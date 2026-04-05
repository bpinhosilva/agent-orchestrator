import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UsersPage from '../Users';
import { usersApi } from '../../api/users';
import { useAuth } from '../../contexts/AuthContextInstance';

vi.mock('../../contexts/AuthContextInstance', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../api/users', () => ({
  usersApi: {
    findAll: vi.fn(),
    updateRole: vi.fn(),
    deleteUser: vi.fn(),
    createUser: vi.fn(),
  },
}));

vi.mock('../../components/CreateUserModal', () => ({
  default: () => null,
}));

vi.mock('../../components/ConfirmDialog', () => ({
  default: () => null,
}));

describe('UsersPage', () => {
  const hasExactText = (text: string) => (_: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/g, ' ').trim() === text;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'admin-1',
        name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        role: 'admin',
      },
      token: 'token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('requests paginated users from the backend and forwards search terms', async () => {
    vi.mocked(usersApi.findAll)
      .mockResolvedValueOnce({
        items: [
          {
            id: 'user-1',
            name: 'Ada',
            last_name: 'Lovelace',
            email: 'ada@example.com',
            role: 'admin',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 18,
        page: 1,
        limit: 15,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'user-2',
            name: 'Alan',
            last_name: 'Turing',
            email: 'alan@example.com',
            role: 'user',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 15,
      });

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(usersApi.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 15,
        search: undefined,
      });
    });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(
      screen.getByText(hasExactText('Showing 1–15 of 18 users')),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search by name or email…'), {
      target: { value: 'Alan' },
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(usersApi.findAll).toHaveBeenLastCalledWith({
        page: 1,
        limit: 15,
        search: 'Alan',
      });
    });

    expect(await screen.findByText('Alan Turing')).toBeInTheDocument();
    expect(
      screen.queryByText(hasExactText('Showing 1–15 of 18 users')),
    ).not.toBeInTheDocument();
  });
});
