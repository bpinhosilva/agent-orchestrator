import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextInstance';
import type { AuthContextType } from './AuthContextInstance';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import type { User } from '../api/users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await authApi.me();
      setUser(currentUser);
      setToken('authenticated');
    } catch (error) {
      console.error('Failed to restore session:', error);
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
    setToken('authenticated');

    const currentUser = await authApi.me();
    setUser(currentUser);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    await authApi.register(username, email, password);
    await login(email, password);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
