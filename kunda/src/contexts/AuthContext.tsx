import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  dob: string;
  phone?: string;
  phoneCode?: string;
  preferredLanguage?: string;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  gender: string;
  interestedIn: string;
  country: string;
  city: string;
  bio?: string;
  height?: number;
  languages?: string[];
  education?: string;
  occupation?: string;
  relationshipIntention: string;
  interests?: string[];
  photos?: string[];
  verifiedBadge?: boolean;
  contactSharingConsent?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, user: User, profile: Profile) => void;
  logout: () => void;
  updateProfile: (profile: Profile) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kunda_token'));
  const [loading, setLoading] = useState(true);

  const fetchSession = async (currentToken: string) => {
    try {
      const res = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = res.data;
      if (data.success && data.user) {
        setUser(data.user);
        setProfile(data.profile);
      } else {
        // Expired or invalid token
        logout();
      }
    } catch (err) {
      console.error('Session verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSession(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User, newProfile: Profile) => {
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    localStorage.setItem('kunda_token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('kunda_token');
  };

  const updateProfile = (updated: Profile) => {
    setProfile(updated);
  };

  const refreshSession = async () => {
    if (token) {
      await fetchSession(token);
    }
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user && ['super_admin', 'admin', 'moderator'].includes(user.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
        updateProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
