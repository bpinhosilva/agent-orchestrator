import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateRecurrentTaskModal from '../CreateRecurrentTaskModal';
import { agentsApi, type Agent } from '../../api/agents';
import {
  recurrentTasksApi,
  RecurrentTaskStatus,
  type RecurrentTask,
} from '../../api/recurrent-tasks';
import { TaskPriority } from '../../api/tasks';

// Mock focus-trap-react or other potential issues
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion') as Record<string, unknown>;
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    },
  };
});

const mockNotifyError = vi.fn();
const mockNotifyApiError = vi.fn();

// Mock useNotification
vi.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({
    notifyApiError: mockNotifyApiError,
    notifyError: mockNotifyError,
    notifySuccess: vi.fn(),
  }),
}));

// Mock agentsApi
vi.mock('../../api/agents', () => ({
  agentsApi: {
    findAll: vi.fn(),
  },
}));

// Mock recurrentTasksApi
vi.mock('../../api/recurrent-tasks', () => ({
  recurrentTasksApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
  RecurrentTaskStatus: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    ERROR: 'error',
  },
}));

const mockAgents: Agent[] = [
  { id: 'agent-1', name: 'Fin-Oracle v2.4', role: 'Financial Analyst' },
  { id: 'agent-2', name: 'Admin-Bot 4000', role: 'System Admin' },
];

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

describe('CreateRecurrentTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(agentsApi.findAll).mockResolvedValue({
      data: mockAgents,
    } as Awaited<ReturnType<typeof agentsApi.findAll>>);
  });

  it('renders correctly when open', async () => {
    render(
      <CreateRecurrentTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Deploy New Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Daily Market Sweep/i)).toBeInTheDocument();
  });

  it('submits correctly when creating a new task', async () => {
    vi.mocked(recurrentTasksApi.create).mockResolvedValue({
      data: {
        id: 'new-id',
        title: 'Test Task',
        description: 'Test Description',
        cronExpression: '0 0 * * *',
        assignee: mockAgents[0],
        priority: TaskPriority.MEDIUM,
        status: RecurrentTaskStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as Awaited<ReturnType<typeof recurrentTasksApi.create>>);

    render(
      <CreateRecurrentTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Daily Market Sweep/i), { target: { value: 'Test Task' } });
    fireEvent.change(screen.getByPlaceholderText(/Briefly describe the objective/i), { target: { value: 'Test Description' } });
    
    const cronInput = screen.getByPlaceholderText(/0 0 \* \* \*/);
    fireEvent.change(cronInput, { target: { value: '0 0 * * *' } });

    // Select agent
    fireEvent.click(screen.getByTestId('agent-select'));
    const agentOption = await screen.findByTestId('agent-option-agent-1');
    fireEvent.click(agentOption);

    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(recurrentTasksApi.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Task',
        description: 'Test Description',
        cronExpression: '0 0 * * *',
        assigneeId: 'agent-1',
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('renders correctly in edit mode', async () => {
    const initialData: RecurrentTask = {
      id: 'task-1',
      title: 'Existing Task',
      description: 'Existing Description',
      cronExpression: '*/15 * * * *',
      assignee: mockAgents[0],
      priority: TaskPriority.LOW,
      status: RecurrentTaskStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <CreateRecurrentTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        initialData={initialData}
      />
    );

    expect(await screen.findByText(/Update Protocol/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    
    // Check if agent name appears
    await waitFor(() => {
      expect(screen.queryByText(/Scanning fleet/i)).not.toBeInTheDocument();
      const agentSelect = screen.getByTestId('agent-select');
      expect(agentSelect).toHaveTextContent('Fin-Oracle v2.4');
    }, { timeout: 3000 });
  });

  it('submits correctly when editing a task', async () => {
    const initialData: RecurrentTask = {
      id: 'task-1',
      title: 'Existing Task',
      description: 'Existing Description',
      cronExpression: '0 0 * * *',
      assignee: mockAgents[0],
      priority: TaskPriority.LOW,
      status: RecurrentTaskStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(recurrentTasksApi.update).mockResolvedValue({
      data: { ...initialData, title: 'Updated Task' },
    } as Awaited<ReturnType<typeof recurrentTasksApi.update>>);

    render(
      <CreateRecurrentTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        initialData={initialData}
      />
    );

    // Wait for initial data to be populated
    const titleInput = await screen.findByDisplayValue('Existing Task');
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } });
    
    // Ensure agent is loaded
    await waitFor(() => {
      if (screen.queryByText(/Scanning fleet/i)) {
        console.log('Still scanning fleet...');
      }
      expect(screen.queryByText(/Scanning fleet/i)).not.toBeInTheDocument();
      const agentSelect = screen.getByTestId('agent-select');
      expect(agentSelect).toHaveTextContent('Fin-Oracle v2.4');
    }, { timeout: 4000 });

    fireEvent.click(screen.getByText('Update Task'));

    await waitFor(() => {
      expect(recurrentTasksApi.update).toHaveBeenCalledWith('task-1', expect.objectContaining({
        title: 'Updated Task',
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows validation errors for invalid cron expression', async () => {
    render(
      <CreateRecurrentTaskModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cronInput = screen.getByPlaceholderText('e.g. 0 0 * * *');
    fireEvent.change(cronInput, { target: { value: 'invalid-cron' } });
    fireEvent.blur(cronInput);

    await waitFor(() => {
      expect(screen.getByText(/Invalid cron format/i)).toBeInTheDocument();
    });
  });
});
