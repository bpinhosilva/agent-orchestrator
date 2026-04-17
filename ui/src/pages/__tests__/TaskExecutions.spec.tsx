import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type InternalAxiosRequestConfig } from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

vi.mock('../../components/CreateRecurrentTaskModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Update Protocol</div> : null),
}));

// cron-parser mock returns a fixed future date so nextRun tests are deterministic
vi.mock('cron-parser', () => ({
  CronExpressionParser: {
    parse: () => ({
      next: () => ({ toDate: () => new Date(Date.now() + 3 * 3600 * 1000) }),
    }),
  },
}));

vi.mock('../../api/tasks', () => ({
  TaskPriority: {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  },
  getTaskPriorityLabel: (priority: number) => {
    switch (priority) {
      case 0: return 'CRITICAL';
      case 1: return 'HIGH';
      case 2: return 'MEDIUM';
      case 3: return 'LOW';
      default: return 'UNKNOWN';
    }
  },
}));

describe('TaskExecutions', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
      >
        <MemoryRouter initialEntries={['/scheduler/tasks/task-1/executions']}>
          <Routes>
            <Route path="/scheduler/tasks/:taskId/executions" element={<TaskExecutions />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

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

    renderPage();

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

    // Verify priority is displayed as text
    expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.mocked(recurrentTasksApi.findOne).mockReturnValue(new Promise(() => {}));
    
    renderPage();

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

    renderPage();

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

    renderPage();

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

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    // Active tasks show Pause Task, not a disabled Activate Now
    expect(screen.getByText(/Pause Task/i)).toBeInTheDocument();
    expect(screen.queryByText(/Activate Now/i)).not.toBeInTheDocument();
  });


  it('computes success rate from loaded executions', async () => {
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.ACTIVE,
        priority: TaskPriority.MEDIUM,
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
          { id: 'e1', status: ExecStatus.SUCCESS, latencyMs: 60000, result: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), artifacts: null },
          { id: 'e2', status: ExecStatus.SUCCESS, latencyMs: 120000, result: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), artifacts: null },
          { id: 'e3', status: ExecStatus.FAILURE, latencyMs: 30000, result: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), artifacts: null },
          { id: 'e4', status: ExecStatus.SUCCESS, latencyMs: 90000, result: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), artifacts: null },
        ],
        total: 4,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    // 3 success out of 4 completed = 75.0%
    expect(screen.getByTestId('success-rate')).toHaveTextContent('75.0%');
    // avg of 60000, 120000, 30000, 90000 = 75000ms = 1m 15s
    expect(screen.getByTestId('avg-duration')).toHaveTextContent('1m 15s');
  });

  it('shows dash placeholders when no executions exist', async () => {
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.ACTIVE,
        priority: TaskPriority.LOW,
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

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('success-rate')).toHaveTextContent('\u2014');
    expect(screen.getByTestId('avg-duration')).toHaveTextContent('\u2014');
  });

  it('hides Next Run section when task is paused', async () => {
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.PAUSED,
        priority: TaskPriority.MEDIUM,
        cronExpression: '0 0 * * *',
        assignee: { id: 'agent-1', name: 'Fin-Oracle v2.4' } as unknown as Agent,
        nextRun: new Date(Date.now() + 3600 * 1000).toISOString(),
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

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('next-run-relative')).not.toBeInTheDocument();
  });

  it('shows Next Run section when task is active with nextRun', async () => {
    const nextRunDate = new Date(Date.now() + 5 * 3600 * 1000); // 5 hours from now
    vi.mocked(recurrentTasksApi.findOne).mockResolvedValue({
      data: {
        id: 'task-1',
        title: 'Daily Market Sweep',
        description: 'Automated market scanning protocol',
        status: RecurrentTaskStatus.ACTIVE,
        priority: TaskPriority.HIGH,
        cronExpression: '0 0 * * *',
        assignee: { id: 'agent-1', name: 'Fin-Oracle v2.4' } as unknown as Agent,
        nextRun: nextRunDate.toISOString(),
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

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    const nextRunEl = screen.getByTestId('next-run-relative');
    expect(nextRunEl).toBeInTheDocument();
    expect(nextRunEl.textContent).toMatch(/^in /);
    expect(screen.getByTestId('next-run-absolute')).toBeInTheDocument();
  });

  it('shows Pause Task button when task is active', async () => {
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

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Pause Task/i)).toBeInTheDocument();
    expect(screen.queryByText(/Activate Now/i)).not.toBeInTheDocument();
  });

  it('handles Pause Task flow correctly', async () => {
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

    vi.mocked(recurrentTasksApi.update).mockResolvedValue({} as unknown as AxiosResponse<RecurrentTask>);

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/INITIALIZING DATA GRID/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Pause Task/i));

    expect(await screen.findByText(/Pause Protocol/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Confirm Pause/i));

    await waitFor(() => {
      expect(recurrentTasksApi.update).toHaveBeenCalledWith('project-1', 'task-1', {
        status: RecurrentTaskStatus.PAUSED,
      });
      expect(notifySuccess).toHaveBeenCalledWith(
        'Protocol Paused',
        expect.stringContaining('Daily Market Sweep')
      );
    });
  });
});
