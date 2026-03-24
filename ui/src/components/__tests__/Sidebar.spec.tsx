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
    (useProject as any).mockReturnValue({
      activeProject: null,
      loading: false,
      refreshProjects: vi.fn(),
    });
    (useNotification as any).mockReturnValue({
        showNotification: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/ORCHESTRATOR/i)).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    (useProject as any).mockReturnValue({
      activeProject: null,
      loading: false,
      refreshProjects: vi.fn(),
    });
    (useNotification as any).mockReturnValue({
        showNotification: vi.fn(),
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


