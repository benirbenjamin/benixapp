import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  preferred_language?: string;
  selected_modules?: string[];
  homepage_layout?: { order: string[] };
  referral_code?: string;
}

export interface Wallet {
  balance: number;
  pending_balance?: number;
  currency: string;
  total_earnings?: number;
  total_withdrawn?: number;
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWizard: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updatePreferences: (modules: string[], layout?: any) => Promise<void>;
  updateWalletBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  wallet: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  registerWizard: async () => ({ success: false }),
  logout: () => {},
  refreshMe: async () => {},
  updatePreferences: async () => {},
  updateWalletBalance: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('benix_auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('benix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [wallet, setWallet] = useState<Wallet | null>(() => {
    const saved = localStorage.getItem('benix_wallet');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setWallet(data.wallet);
        localStorage.setItem('benix_user', JSON.stringify(data.user));
        localStorage.setItem('benix_wallet', JSON.stringify(data.wallet));
      } else if (res.status === 401) {
        logout();
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, [token]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setToken(data.token);
      setUser(data.user);
      setWallet(data.wallet);
      localStorage.setItem('benix_auth_token', data.token);
      localStorage.setItem('benix_user', JSON.stringify(data.user));
      localStorage.setItem('benix_wallet', JSON.stringify(data.wallet));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const registerWizard = async (data: any) => {
    try {
      const res = await fetch('/api/auth/register-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Registration failed' };
      }
      setToken(resData.token);
      setUser(resData.user);
      setWallet(resData.wallet);
      localStorage.setItem('benix_auth_token', resData.token);
      localStorage.setItem('benix_user', JSON.stringify(resData.user));
      localStorage.setItem('benix_wallet', JSON.stringify(resData.wallet));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWallet(null);
    localStorage.removeItem('benix_auth_token');
    localStorage.removeItem('benix_user');
    localStorage.removeItem('benix_wallet');
  };

  const updatePreferences = async (modules: string[], layout?: any) => {
    if (!token || !user) return;
    try {
      await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ selected_modules: modules, homepage_layout: layout })
      });
      setUser({ ...user, selected_modules: modules, homepage_layout: layout });
    } catch (e) {}
  };

  const updateWalletBalance = (newBalance: number) => {
    if (wallet) {
      const updated = { ...wallet, balance: newBalance };
      setWallet(updated);
      localStorage.setItem('benix_wallet', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        isLoading,
        login,
        registerWizard,
        logout,
        refreshMe,
        updatePreferences,
        updateWalletBalance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
