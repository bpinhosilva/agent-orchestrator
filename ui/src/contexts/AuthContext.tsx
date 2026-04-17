import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextInstance';
import type { AuthContextType } from './AuthContextInstance';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import type { User } from '../api/users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);

    const currentUser = await authApi.me();
    setUser(currentUser);
  };

  const register = async (
    name: string,
    lastName: string,
    email: string,
    password: string,
  ) => {
    await authApi.register(name, lastName, email, password);
    await login(email, password);
  };

  const value: AuthContextType = {
    user,
    token: user ? 'authenticated' : null,
    isLoading,
    login,
    register,
    logout,
    refreshUser: restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
