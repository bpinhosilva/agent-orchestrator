import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextInstance';
import type { AuthContextType } from './AuthContextInstance';
import { authApi } from '../api/auth';
import type { User } from '../api/users';

const AUTH_TOKEN_KEY = 'auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem(AUTH_TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to restore session:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
    setToken(response.access_token);
    
    // Fetch user info after login
    const currentUser = await authApi.me();
    setUser(currentUser);
  };

  const register = async (username: string, email: string, password: string) => {
    await authApi.register(username, email, password);
    // Automatically login after registration
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
