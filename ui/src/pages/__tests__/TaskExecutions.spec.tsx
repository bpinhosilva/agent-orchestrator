import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type InternalAxiosRequestConfig } from 'axios';
import TaskExecutions from '../TaskExecutions';
import { recurrentTasksApi, RecurrentTaskStatus, ExecStatus, type RecurrentTask } from '../../api/recurrent-tasks';
import { TaskPriority } from '../../api/tasks';
import { type Agent } from '../../api/agents';
import { useProject } from '../../hooks/useProject';
import { useNotification } from '../../hooks/useNotification';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { type AxiosResponse } from 'axios';

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
    update: vi.fn(),
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

vi.mock('../../api/tasks', () => ({
  TaskPriority: {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
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
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        cronExpression: '0 0 * * *',
        assignee: { id: 'agent-1', name: 'Fin-Oracle v2.4' } as unknown as Agent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    vi.mocked(recurrentTasksApi.findExecutions).mockResolvedValue({
      data: {
        data: [
          {
            id: '882',
            status: ExecStatus.SUCCESS,
            createdAt: new Date().toISOString(),
            latencyMs: 248000, // 4m 08s
            result: '[Node-7] Signal validated: Bullish sweep complete...',
            updatedAt: new Date().toISOString(),
            artifacts: null,
          },
        ],
        total: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

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

  it('opens the Edit Task modal when clicked', async () => {
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        cronExpression: '0 0 * * *',
        assignee: { id: 'agent-1', name: 'Fin-Oracle v2.4' } as unknown as Agent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    vi.mocked(recurrentTasksApi.findExecutions).mockResolvedValue({
      data: { data: [], total: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    render(
      <MemoryRouter initialEntries={['/scheduler/tasks/task-1/executions']}>
        <Routes>
          <Route path="/scheduler/tasks/:taskId/executions" element={<TaskExecutions />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    const editButton = screen.getByText(/Edit Task/i);
    fireEvent.click(editButton);

    expect(await screen.findByText(/Update Protocol/i)).toBeInTheDocument();
  });

  it('handles Activate Now flow correctly', async () => {
    const notifySuccess = vi.fn();
    vi.mocked(useNotification).mockReturnValue({
      notifySuccess,
      notifyError: vi.fn(),
      notifyInfo: vi.fn(),
      notifyApiError: vi.fn(),
      closeNotification: vi.fn(),
      state: { isOpen: false, type: 'info', title: '', message: '' },
    });

    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.PAUSED,
        priority: TaskPriority.HIGH,
        cronExpression: '0 0 * * *',
        assignee: { id: 'agent-1', name: 'Fin-Oracle v2.4' } as unknown as Agent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    vi.mocked(recurrentTasksApi.findExecutions).mockResolvedValue({
      data: { data: [], total: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    vi.mocked(recurrentTasksApi.update).mockResolvedValue({} as unknown as AxiosResponse<RecurrentTask>);

    render(
      <MemoryRouter initialEntries={['/scheduler/tasks/task-1/executions']}>
        <Routes>
          <Route path="/scheduler/tasks/:taskId/executions" element={<TaskExecutions />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    const activateButton = screen.getByText(/Activate Now/i);
    expect(activateButton).not.toBeDisabled();
    fireEvent.click(activateButton);

    expect(await screen.findByText(/Activate Protocol/i)).toBeInTheDocument();
    
    const confirmButton = screen.getByText(/Confirm Activation/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(recurrentTasksApi.update).toHaveBeenCalledWith('project-1', 'task-1', {
        status: RecurrentTaskStatus.ACTIVE,
      });
      expect(notifySuccess).toHaveBeenCalledWith(
        'Protocol Activated',
        expect.stringContaining('Daily Market Sweep')
      );
    });
  });

  it('disables Activate Now button when task is already active', async () => {
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        cronExpression: '0 0 * * *',
        assignee: { id: 'agent-1', name: 'Fin-Oracle v2.4' } as unknown as Agent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    vi.mocked(recurrentTasksApi.findExecutions).mockResolvedValue({
      data: { data: [], total: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    render(
      <MemoryRouter initialEntries={['/scheduler/tasks/task-1/executions']}>
        <Routes>
          <Route path="/scheduler/tasks/:taskId/executions" element={<TaskExecutions />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    const activateButton = screen.getByText(/Activate Now/i);
    expect(activateButton).toBeDisabled();
  });
});
