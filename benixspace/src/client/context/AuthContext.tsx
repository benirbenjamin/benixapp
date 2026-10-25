import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  channel_name?: string;
  role: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  preferred_language?: string;
  selected_modules?: string[];
  homepage_layout?: { order: string[] };
  referral_code?: string;
  avatar_url?: string;
  app_profiles?: Record<string, any>;
}

export interface Wallet {
  balance: number;
  bonus_balance?: number;
  total_balance?: number;
  last_login_bonus_date?: string;
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
  login: (email: string, pass: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  registerWizard: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    whatsapp?: string;
    country?: string;
    referral_code?: string;
    [key: string]: any;
  }) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>;
  verifyAccount: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  saveAppProfile: (appKey: string, profileData: any) => Promise<{ success: boolean; error?: string }>;
  hasAppProfile: (appKey: string) => boolean;
  logout: () => void;
  refreshMe: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  updatePreferences: (modules: string[], layout?: any) => Promise<void>;
  updateWalletBalance: (newBalance: number, newBonusBalance?: number) => void;
  claimDailyBonus: () => Promise<{ success: boolean; bonusAmount?: number; message?: string }>;
  updateProfile: (data: { name?: string; phone?: string; channel_name?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  updateProfilePhoto: (avatarUrl: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  wallet: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  registerWizard: async () => ({ success: false }),
  verifyAccount: async () => ({ success: false }),
  resendVerificationCode: async () => ({ success: false }),
  saveAppProfile: async () => ({ success: false }),
  hasAppProfile: () => false,
  logout: () => {},
  refreshMe: async () => {},
  refreshWallet: async () => {},
  updatePreferences: async () => {},
  updateWalletBalance: () => {},
  claimDailyBonus: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  updateProfilePhoto: async () => ({ success: false })
});

// Configure Axios instance
const apiClient = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
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
      const res = await apiClient.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.user) {
        let cachedAppProfiles = {};
        try {
          const savedUser = JSON.parse(localStorage.getItem('benix_user') || '{}');
          if (savedUser.app_profiles) cachedAppProfiles = savedUser.app_profiles;
        } catch {}

        const mergedUser = {
          ...res.data.user,
          app_profiles: {
            ...cachedAppProfiles,
            ...(res.data.user.app_profiles || {})
          }
        };

        setUser(mergedUser);
        if (res.data.wallet) {
          setWallet(res.data.wallet);
          localStorage.setItem('benix_wallet', JSON.stringify(res.data.wallet));
        }
        localStorage.setItem('benix_user', JSON.stringify(mergedUser));
        if (res.data.user.role === 'superadmin' || res.data.user.role === 'admin') {
          localStorage.setItem('benix_admin_token', token);
        }
      }
    } catch (err: any) {
      // Only logout on explicit 401 Unauthorized for regular tokens; never for transient errors
      if (err.response?.status === 401 && !token.startsWith('admin_token_')) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();

    if (!token) return;

    // Window focus refresh: immediate sync when returning to tab
    const handleFocus = () => {
      refreshMe();
    };
    window.addEventListener('focus', handleFocus);

    // Continuous dynamic auto-poll every 6 seconds to eliminate any delay
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        apiClient.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => {
            if (res.data?.wallet) {
              setWallet(res.data.wallet);
              localStorage.setItem('benix_wallet', JSON.stringify(res.data.wallet));
            }
            if (res.data?.user) {
              let cachedProfiles = {};
              try {
                const s = JSON.parse(localStorage.getItem('benix_user') || '{}');
                if (s.app_profiles) cachedProfiles = s.app_profiles;
              } catch {}
              const merged = {
                ...res.data.user,
                app_profiles: {
                  ...cachedProfiles,
                  ...(res.data.user.app_profiles || {})
                }
              };
              setUser(merged);
              localStorage.setItem('benix_user', JSON.stringify(merged));
            }
          })
          .catch(() => {});
      }
    }, 6000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [token]);

  /**
   * Login using Axios with safe error parsing, unverified account verification prompt, and instant Super Admin fallback
   */
  const login = async (email: string, pass: string): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Instant Super Admin Client Fallback if offline/network issue
    const isSuperAdminEmail = cleanEmail === 'benirabok@gmail.com' || cleanEmail === 'admin@benix.space';
    const isSuperAdminPass = cleanPass === '1202!birthDATE' || cleanPass === 'BenixSpace2026!' || cleanPass === 'Admin123!Password';

    try {
      const response = await apiClient.post('/api/auth/login', {
        email: cleanEmail,
        password: cleanPass
      });

      const { data } = response;

      // Handle unverified account requiring email verification
      if (data?.requires_verification) {
        return {
          success: false,
          requiresVerification: true,
          email: data.email || cleanEmail
        };
      }

      if (data?.token && data?.user) {
        setToken(data.token);
        setUser(data.user);
        setWallet(data.wallet || { balance: 100, currency: 'RWF' });
        localStorage.setItem('benix_auth_token', data.token);
        localStorage.setItem('benix_user', JSON.stringify(data.user));
        localStorage.setItem('benix_wallet', JSON.stringify(data.wallet || { balance: 100, currency: 'RWF' }));
        if (data.user.role === 'superadmin' || data.user.role === 'admin') {
          localStorage.setItem('benix_admin_token', data.token);
        }
        return { success: true };
      }
      return { success: false, error: typeof data?.error === 'string' ? data.error : 'Invalid response from server' };
    } catch (err: any) {
      console.error('🔴 [AUTH_LOGIN_CATCH_ERROR]:', err);
      console.error('🔴 [AUTH_LOGIN_STATUS]:', err.response?.status);
      console.error('🔴 [AUTH_LOGIN_DATA]:', err.response?.data);
      console.error('🔴 [AUTH_LOGIN_MESSAGE]:', err.message);

      // Check if server returned requires_verification in error response
      if (err.response?.data?.requires_verification) {
        return {
          success: false,
          requiresVerification: true,
          email: err.response.data.email || cleanEmail
        };
      }

      // If backend was unreachable or server error, but credentials are Super Admin, allow access:
      if (isSuperAdminEmail && isSuperAdminPass) {
        const mockAdminToken = 'admin_token_' + Date.now();
        const mockAdminUser: User = {
          id: 'user-superadmin-benir',
          email: cleanEmail,
          name: 'Benir Benjamin (Super Admin)',
          role: 'superadmin',
          phone: '0783987223',
          whatsapp: '0783987223',
          country: 'Rwanda',
          referral_code: 'BENIX-SUPERADMIN',
          selected_modules: ['tv', 'radio', 'kunda', 'marketplace', 'voxify', 'games', 'calc'],
          app_profiles: {
            kunda: { completed: true },
            voxify: { completed: true },
            marketplace: { completed: true },
            tv: { completed: true },
            radio: { completed: true },
            games: { completed: true },
            calc: { completed: true }
          }
        };
        const mockWallet: Wallet = { balance: 100000.00, currency: 'RWF' };

        setToken(mockAdminToken);
        setUser(mockAdminUser);
        setWallet(mockWallet);
        localStorage.setItem('benix_auth_token', mockAdminToken);
        localStorage.setItem('benix_admin_token', mockAdminToken);
        localStorage.setItem('benix_user', JSON.stringify(mockAdminUser));
        localStorage.setItem('benix_wallet', JSON.stringify(mockWallet));
        return { success: true };
      }

      // Exact error extraction from Axios response
      let errorMessage = 'Login failed.';
      const resData = err.response?.data;
      if (resData) {
        if (typeof resData === 'string') {
          errorMessage = resData;
        } else if (resData.error && typeof resData.error === 'string') {
          errorMessage = resData.error;
        } else if (resData.message && typeof resData.message === 'string') {
          errorMessage = resData.message;
        } else {
          errorMessage = JSON.stringify(resData);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('🔴 [AUTH_LOGIN_DISPLAY_ERROR]:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * 5-field Super-Account Registration (Name, Email, Password, WhatsApp/Phone, Country)
   */
  const registerWizard = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    whatsapp?: string;
    country?: string;
    referral_code?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    try {
      const cleanData = {
        name: data.name.trim(),
        channel_name: (data.channel_name || data.nickname || data.name).trim(),
        email: cleanEmail,
        password: data.password,
        phone: (data.whatsapp || data.phone || '').trim(),
        whatsapp: (data.whatsapp || data.phone || '').trim(),
        country: (data.country || 'Rwanda').trim(),
        referral_code: data.referral_code ? data.referral_code.trim() : undefined,
        selected_modules: data.selected_modules || ['tv', 'radio', 'kunda', 'marketplace', 'voxify', 'games', 'calc'],
        homepage_layout: data.homepage_layout || { order: ['tv', 'radio', 'kunda', 'marketplace', 'voxify', 'games', 'calc'] }
      };

      const response = await apiClient.post('/api/auth/register-wizard', cleanData);
      const resData = response.data;

      // Handle unverified account requiring email verification code
      if (resData?.requires_verification) {
        return {
          success: false,
          requiresVerification: true,
          email: resData.email || cleanEmail
        };
      }

      if (resData?.token && resData?.user) {
        setToken(resData.token);
        setUser(resData.user);
        setWallet(resData.wallet || { balance: 100, currency: 'RWF' });
        localStorage.setItem('benix_auth_token', resData.token);
        localStorage.setItem('benix_user', JSON.stringify(resData.user));
        localStorage.setItem('benix_wallet', JSON.stringify(resData.wallet || { balance: 100, currency: 'RWF' }));
        return { success: true };
      }
      return { success: false, error: resData?.error || 'Registration failed.' };
    } catch (err: any) {
      console.warn('Axios register error:', err);

      if (err.response?.data?.requires_verification) {
        return {
          success: false,
          requiresVerification: true,
          email: err.response.data.email || cleanEmail
        };
      }

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration could not be completed. Please check your information.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Verify Account with 6-digit email code and log in
   */
  const verifyAccount = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.post('/api/auth/verify-account', {
        email: email.trim().toLowerCase(),
        code: code.trim()
      });

      const { data } = response;
      if (data?.token && data?.user) {
        setToken(data.token);
        setUser(data.user);
        setWallet(data.wallet || { balance: 0, bonus_balance: 100, total_balance: 100, currency: 'RWF' });
        localStorage.setItem('benix_auth_token', data.token);
        localStorage.setItem('benix_user', JSON.stringify(data.user));
        localStorage.setItem('benix_wallet', JSON.stringify(data.wallet || { balance: 0, bonus_balance: 100, total_balance: 100, currency: 'RWF' }));
        if (data.user.role === 'superadmin' || data.user.role === 'admin') {
          localStorage.setItem('benix_admin_token', data.token);
        }
        return { success: true };
      }
      return { success: false, error: data?.error || 'Verification failed.' };
    } catch (err: any) {
      console.warn('Axios verify error:', err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Verification failed. Please check your 6-digit code.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Resend 6-digit verification code
   */
  const resendVerificationCode = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await apiClient.post('/api/auth/resend-verification', {
        email: email.trim().toLowerCase()
      });
      return { success: true, message: response.data?.message || 'Verification code resent to your email.' };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not resend code. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Save individual app requirement profile (e.g. Kunda, Voxify, Marketplace)
   */
  const saveAppProfile = async (appKey: string, profileData: any): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Please log in first' };
    }

    const normalizedKey = appKey === 'dating' ? 'kunda' : (appKey === 'music' ? 'voxify' : (appKey === 'videos' ? 'tv' : appKey));
    try {
      localStorage.setItem(`benix_profile_${appKey}_completed`, 'true');
      localStorage.setItem(`benix_profile_${normalizedKey}_completed`, 'true');
    } catch {}

    const updatedProfiles = {
      ...(user.app_profiles || {}),
      [appKey]: { ...profileData, completed: true, updated_at: new Date().toISOString() },
      [normalizedKey]: { ...profileData, completed: true, updated_at: new Date().toISOString() }
    };

    const updatedUser = { ...user, app_profiles: updatedProfiles };
    setUser(updatedUser);
    localStorage.setItem('benix_user', JSON.stringify(updatedUser));

    if (token) {
      try {
        await apiClient.post(
          '/api/auth/save-app-profile',
          { appKey, profileData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.warn('Could not sync app profile to server:', e);
      }
    }

    return { success: true };
  };

  const hasAppProfile = (appKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'superadmin' || user.role === 'admin') return true;
    const normalizedKey = appKey === 'dating' ? 'kunda' : (appKey === 'music' ? 'voxify' : (appKey === 'videos' ? 'tv' : appKey));
    const inProfile = !!(
      (user.app_profiles && (user.app_profiles[appKey]?.completed || user.app_profiles[normalizedKey]?.completed))
    );
    if (inProfile) return true;
    try {
      return localStorage.getItem(`benix_profile_${appKey}_completed`) === 'true' ||
             localStorage.getItem(`benix_profile_${normalizedKey}_completed`) === 'true';
    } catch {
      return false;
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
    if (!user) return;
    const updated = { ...user, selected_modules: modules, homepage_layout: layout };
    setUser(updated);
    localStorage.setItem('benix_user', JSON.stringify(updated));

    if (token) {
      try {
        await apiClient.put(
          '/api/auth/preferences',
          { selected_modules: modules, homepage_layout: layout },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {}
    }
  };

  const updateWalletBalance = (newBalance: number, newBonusBalance?: number) => {
    setWallet((prev) => {
      const base = prev || { balance: 0, bonus_balance: 0, currency: 'RWF' };
      const curBal = typeof newBalance === 'number' && !isNaN(newBalance) ? newBalance : base.balance;
      const curBonus = typeof newBonusBalance === 'number' && !isNaN(newBonusBalance) ? newBonusBalance : (base.bonus_balance || 0);
      const updated: Wallet = {
        ...base,
        balance: curBal,
        bonus_balance: curBonus,
        total_balance: curBal + curBonus
      };
      localStorage.setItem('benix_wallet', JSON.stringify(updated));
      return updated;
    });

    if (token) {
      apiClient.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data?.wallet) {
            setWallet(res.data.wallet);
            localStorage.setItem('benix_wallet', JSON.stringify(res.data.wallet));
          }
        })
        .catch(() => {});
    }
  };

  const updateProfile = async (profileData: { name?: string; phone?: string; channel_name?: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.put('/api/auth/profile', profileData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (res.data?.success && res.data?.user) {
        setUser((prev) => (prev ? { ...prev, ...res.data.user } : res.data.user));
        localStorage.setItem('benix_user', JSON.stringify({ ...user, ...res.data.user }));
        return { success: true };
      }
      return { success: false, error: res.data?.error || 'Failed to update profile' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const updateProfilePhoto = async (avatarUrl: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.post('/api/auth/profile-photo', { avatarUrl }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (res.data?.success) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, avatar_url: avatarUrl };
          localStorage.setItem('benix_user', JSON.stringify(updated));
          return updated;
        });
        return { success: true };
      }
      return { success: false, error: res.data?.error || 'Failed to update profile photo' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const claimDailyBonus = async (): Promise<{ success: boolean; bonusAmount?: number; message?: string }> => {
    try {
      const res = await apiClient.post('/api/wallet/claim-daily-bonus', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (res.data?.success) {
        await refreshMe();
        return { success: true, bonusAmount: res.data.bonusAmount, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Could not claim daily bonus.' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.error || err.message };
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
        verifyAccount,
        resendVerificationCode,
        saveAppProfile,
        hasAppProfile,
        logout,
        refreshMe,
        refreshWallet: refreshMe,
        updatePreferences,
        updateWalletBalance,
        claimDailyBonus,
        updateProfile,
        updateProfilePhoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
