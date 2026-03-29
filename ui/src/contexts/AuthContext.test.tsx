import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './AuthContextInstance';
import { authApi } from '../api/auth';

// Mock authApi
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

// Mock client to prevent axios errors during tests if needed, 
// though we mock authApi which is what uses it.

const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with null user and not loading if no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('should login successfully and store token', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: 'fake-token',
    });
    vi.mocked(authApi.me).mockResolvedValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    expect(localStorage.getItem('auth_token')).toBe('fake-token');
  });

  it('should logout and clear token', async () => {
    localStorage.setItem('auth_token', 'fake-token');
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    vi.mocked(authApi.me).mockResolvedValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should restore user from token on mount', async () => {
    localStorage.setItem('auth_token', 'fake-token');
    const mockUser = { id: '1', username: 'restored-user', email: 'test@example.com' };
    vi.mocked(authApi.me).mockResolvedValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('restored-user');
    });
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
