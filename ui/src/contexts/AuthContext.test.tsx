import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './AuthContextInstance';
import { authApi } from '../api/auth';
import type { User } from '../api/users';

// Mock authApi
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null user and loading true without logging expected restore failures', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(authApi.me).mockRejectedValue(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should login successfully', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    };
    vi.mocked(authApi.login).mockResolvedValue(undefined);
    vi.mocked(authApi.me).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test');
    });

    expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should logout and clear user', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    };
    vi.mocked(authApi.me).mockResolvedValue(mockUser);
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
    expect(authApi.logout).toHaveBeenCalled();
  });

  it('should restore user on mount if authenticated', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Restored',
      lastName: 'User',
      email: 'test@example.com',
    };
    vi.mocked(authApi.me).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Restored');
    });
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
