import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useProject } from '../../hooks/useProject';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContextInstance';

// Mock the hooks
vi.mock('../../hooks/useProject', () => ({
  useProject: vi.fn(),
}));

vi.mock('../../hooks/useNotification', () => ({
  useNotification: vi.fn(),
}));

vi.mock('../../contexts/AuthContextInstance', () => ({
  useAuth: vi.fn(),
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: null,
      loading: false,
      refreshProjects: vi.fn(),
      projects: [],
      setActiveProjectById: vi.fn(),
    });

    vi.mocked(useNotification).mockReturnValue({
      notifySuccess: vi.fn(),
      notifyError: vi.fn(),
      notifyApiError: vi.fn(),
      notifyInfo: vi.fn(),
      closeNotification: vi.fn(),
      state: { isOpen: false, type: 'info', title: '', message: '' },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
      token: 'fake-token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders the brand title', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/ORCHESTRATOR/i)).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Manager/i)).toBeInTheDocument();
  });
});
