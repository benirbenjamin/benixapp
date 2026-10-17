import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { parseJsonResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rba_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySavedToken = async () => {
      const savedToken = localStorage.getItem('rba_admin_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        const data = await parseJsonResponse(res);
        setUser(data.user);
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('rba_admin_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySavedToken();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('rba_admin_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('rba_admin_token');
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isSuperAdmin, isAdmin }}>
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
