import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskExecutions from '../TaskExecutions';
import { recurrentTasksApi, RecurrentTaskStatus, ExecStatus } from '../../api/recurrent-tasks';
import { useProject } from '../../hooks/useProject';
import { useNotification } from '../../hooks/useNotification';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const stripMotionProps = <T extends Record<string, unknown>>(props: T) => {
  const nextProps = { ...props };
  delete nextProps.initial;
  delete nextProps.animate;
  delete nextProps.exit;
  delete nextProps.transition;
  delete nextProps.whileHover;
  delete nextProps.whileTap;
  return nextProps;
};

vi.mock('framer-motion', async () => {
  const actual =
    (await vi.importActual('framer-motion')) as Record<string, unknown>;

  return {
    ...actual,
    motion: {
      div: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & {
        children: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
        exit?: unknown;
        transition?: unknown;
        whileHover?: unknown;
        whileTap?: unknown;
      }) => <div {...stripMotionProps(props)}>{children}</div>,
      header: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLElement> & {
        children: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      }) => <header {...stripMotionProps(props)}>{children}</header>,
      section: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLElement> & {
        children: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      }) => <section {...stripMotionProps(props)}>{children}</section>,
      button: ({
        children,
        ...props
      }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        children: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
        exit?: unknown;
        transition?: unknown;
        whileHover?: unknown;
        whileTap?: unknown;
      }) => <button {...stripMotionProps(props)}>{children}</button>,
    },
  };
});

vi.mock('../../hooks/useProject', () => ({
  useProject: vi.fn(),
}));

vi.mock('../../hooks/useNotification', () => ({
  useNotification: vi.fn(),
}));

vi.mock('../../api/recurrent-tasks', () => ({
  recurrentTasksApi: {
    findOne: vi.fn(),
    findExecutions: vi.fn(),
  },
  RecurrentTaskStatus: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    ERROR: 'error',
  },
  ExecStatus: {
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILURE: 'failure',
    CANCELED: 'canceled',
  },
}));

describe('TaskExecutions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useProject).mockReturnValue({
      activeProject: {
        id: 'project-1',
        title: 'Aetheric Logic',
        description: 'Primary project',
        status: 'active',
        ownerAgent: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      loading: false,
      refreshProjects: vi.fn(),
      projects: [],
      setActiveProjectById: vi.fn(),
    });

    vi.mocked(useNotification).mockReturnValue({
      notifySuccess: vi.fn(),
      notifyError: vi.fn(),
      notifyInfo: vi.fn(),
      notifyApiError: vi.fn(),
      closeNotification: vi.fn(),
      state: { isOpen: false, type: 'info', title: '', message: '' },
    });
  });

  it('renders task details and executions', async () => {
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        status: RecurrentTaskStatus.ACTIVE,
        priority: 'high',
        cronExpression: '0 0 * * *',
        assignee: { name: 'Fin-Oracle v2.4' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as unknown as { data: { id: string; title: string; status: string; priority: string; cronExpression: string; assignee: { name: string }; createdAt: string; updatedAt: string } });

    vi.mocked(recurrentTasksApi.findExecutions).mockResolvedValue({
      data: {
        data: [
          {
            id: '882',
            status: ExecStatus.SUCCESS,
            createdAt: new Date().toISOString(),
            latencyMs: 248000, // 4m 08s
            result: '[Node-7] Signal validated: Bullish sweep complete...',
          },
        ],
        total: 1,
      },
    } as unknown as { data: { data: { id: string; status: string; createdAt: string; latencyMs: number; result: string }[]; total: number } });

    render(
      <MemoryRouter initialEntries={['/scheduler/tasks/task-1/executions']}>
        <Routes>
          <Route path="/scheduler/tasks/:taskId/executions" element={<TaskExecutions />} />
        </Routes>
      </MemoryRouter>
    );

    // Initially shows loading
    expect(screen.getByText(/INITIALIZING DATA GRID/i)).toBeInTheDocument();

    // After promises resolve
    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.getByRole('heading', { name: 'Daily Market Sweep' })).toBeInTheDocument();
    expect(screen.getByText(/#EXEC-882/i)).toBeInTheDocument();
    
    const table = screen.getByRole('table');
    expect(within(table).getByText(/SUCCESS/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.mocked(recurrentTasksApi.findOne).mockReturnValue(new Promise(() => {}));
    
    render(
      <MemoryRouter initialEntries={['/scheduler/tasks/task-1/executions']}>
        <Routes>
          <Route path="/scheduler/tasks/:taskId/executions" element={<TaskExecutions />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/INITIALIZING DATA GRID/i)).toBeInTheDocument();
  });
});
