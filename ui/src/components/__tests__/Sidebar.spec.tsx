import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useProject } from '../../hooks/useProject';
import { useNotification } from '../../hooks/useNotification';

// Mock the useProject hook
vi.mock('../../hooks/useProject', () => ({
  useProject: vi.fn(),
}));

// Mock the useNotification hook
vi.mock('../../hooks/useNotification', () => ({
  useNotification: vi.fn(),
}));

describe('Sidebar Component', () => {
  it('renders the brand title', () => {
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

    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/ORCHESTRATOR/i)).toBeInTheDocument();
  });

  it('renders navigation items', () => {
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

    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Manager/i)).toBeInTheDocument();
  });
});


