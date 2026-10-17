import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api, getErrorMessage } from '../lib/api';

interface SavedPayout {
  method: string | null;
  account: string | null;
  accountName: string | null;
  bankName: string | null;
}

interface WalletSettings {
  minWithdrawal: number;
  welcomeBonus: number;
  referralReward: number;
  referralDepositCommissionPct: number;
  contactUnlockCommissionPct: number;
}

interface WalletContextType {
  balance: number;
  bonusBalance: number;
  totalAvailable: number;
  withdrawableEarned: number;
  currency: string;
  referralCode: string;
  referredUsersCount: number;
  savedPayout: SavedPayout;
  settings: WalletSettings;
  totalDeposits: number;
  totalSpent: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  depositFunds: (amount: number) => Promise<{ success: boolean; paymentUrl?: string; error?: string }>;
  requestWithdrawal: (data: {
    amount: number;
    payoutMethod: 'momo' | 'airtel' | 'bank';
    payoutAccount: string;
    accountHolderName: string;
    bankName?: string;
  }) => Promise<{ success: boolean; error?: string; withdrawal?: any }>;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
}

const defaultSettings: WalletSettings = {
  minWithdrawal: 2000,
  welcomeBonus: 500,
  referralReward: 200,
  referralDepositCommissionPct: 5,
  contactUnlockCommissionPct: 15,
};

const defaultPayout: SavedPayout = {
  method: null,
  account: null,
  accountName: null,
  bankName: null,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [withdrawableEarned, setWithdrawableEarned] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('RWF');
  const [referralCode, setReferralCode] = useState<string>('');
  const [referredUsersCount, setReferredUsersCount] = useState<number>(0);
  const [savedPayout, setSavedPayout] = useState<SavedPayout>(defaultPayout);
  const [settings, setSettings] = useState<WalletSettings>(defaultSettings);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);

  const refreshBalance = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/wallet/balance');
      if (res.data.success) {
        setBalance(res.data.balance || 0);
        setBonusBalance(res.data.bonusBalance || 0);
        setTotalAvailable(res.data.totalAvailable || ((res.data.balance || 0) + (res.data.bonusBalance || 0)));
        setWithdrawableEarned(res.data.withdrawableEarned || 0);
        setCurrency(res.data.currency || 'RWF');
        if (res.data.referralCode) setReferralCode(res.data.referralCode);
        if (res.data.referredUsersCount !== undefined) setReferredUsersCount(res.data.referredUsersCount);
        if (res.data.savedPayout) setSavedPayout(res.data.savedPayout);
        if (res.data.settings) setSettings(res.data.settings);
        setTotalDeposits(res.data.totalDeposits || 0);
        setTotalSpent(res.data.totalSpent || 0);
      }
    } catch (err) {
      console.error('Wallet balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
    }
  }, [isAuthenticated]);

  const depositFunds = async (amount: number) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await api.post('/payments/initialize', { amount, currency });
      if (res.data.success && res.data.paymentUrl) {
        return { success: true, paymentUrl: res.data.paymentUrl };
      }
      return { success: false, error: res.data.error || 'Failed to initialize payment' };
    } catch (err: any) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const requestWithdrawal = async (data: {
    amount: number;
    payoutMethod: 'momo' | 'airtel' | 'bank';
    payoutAccount: string;
    accountHolderName: string;
    bankName?: string;
  }) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await api.post('/wallet/withdraw', data);
      if (res.data.success) {
        await refreshBalance();
        return { success: true, withdrawal: res.data.withdrawal };
      }
      return { success: false, error: res.data.error || 'Withdrawal request failed' };
    } catch (err: any) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        bonusBalance,
        totalAvailable,
        withdrawableEarned,
        currency,
        referralCode,
        referredUsersCount,
        savedPayout,
        settings,
        totalDeposits,
        totalSpent,
        loading,
        refreshBalance,
        depositFunds,
        requestWithdrawal,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
