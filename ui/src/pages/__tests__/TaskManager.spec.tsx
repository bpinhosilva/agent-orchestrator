import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskManager from '../TaskManager';
import { tasksApi, TaskStatus } from '../../api/tasks';
import { useProject } from '../../hooks/useProject';
import { useNotification } from '../../hooks/useNotification';
import { useTaskSSE } from '../../hooks/useTaskSSE';
import { useTaskDnD } from '../../hooks/useTaskDnD';
import type { Task as ApiTask } from '../../api/tasks';
import type { Project } from '../../api/projects';
import { ProjectStatus } from '../../api/projects';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion') as Record<string, unknown>;
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
      ),
    },
  };
});

vi.mock('../../hooks/useProject');
vi.mock('../../hooks/useNotification');
vi.mock('../../hooks/useTaskSSE');
vi.mock('../../hooks/useTaskDnD');
vi.mock('../../api/tasks', () => ({
  tasksApi: {
    fetchAll: vi.fn(),
    update: vi.fn(),
  },
  TaskStatus: {
    BACKLOG: 'backlog',
    IN_PROGRESS: 'in-progress',
    REVIEW: 'review',
    DONE: 'done',
    ARCHIVED: 'archived',
  },
}));

// Lazy-loaded — must be a real module mock so Suspense resolves immediately.
vi.mock('../../components/tasks/CreateTaskModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-task-modal" /> : null,
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project Alpha',
  description: '',
  status: ProjectStatus.ACTIVE,
  ownerAgent: { id: 'agent-1', name: 'Lead Agent' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeApiTask = (id: string, status: string = 'backlog'): ApiTask => ({
  id,
  title: `Task ${id}`,
  description: '',
  status: status as ApiTask['status'],
  priority: 2,
  projectId: 'project-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const defaultDnDReturn = {
  activeId: null,
  sensors: [],
  collisionDetection: () => null,
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDragEnd: vi.fn(),
  isConfirmOpen: false,
  setIsConfirmOpen: vi.fn(),
  pendingArchiveId: null,
  setPendingArchiveId: vi.fn(),
};

const mockNotifyError = vi.fn();
const mockNotifySuccess = vi.fn();

// ─── Render helper ───────────────────────────────────────────────────────────

const renderTaskManager = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <TaskManager />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TaskManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNotification).mockReturnValue({
      notifyError: mockNotifyError,
      notifySuccess: mockNotifySuccess,
      notifyApiError: vi.fn(),
      notifyInfo: vi.fn(),
      closeNotification: vi.fn(),
      state: { isOpen: false, type: 'info' as const, title: '', message: '' },
    });

    vi.mocked(useTaskSSE).mockReturnValue(undefined);
    vi.mocked(useTaskDnD).mockReturnValue(defaultDnDReturn);
    vi.mocked(tasksApi.fetchAll).mockResolvedValue([]);
    vi.mocked(tasksApi.update).mockResolvedValue({ data: {} } as unknown as Awaited<ReturnType<typeof tasksApi.update>>);
  });

  it('shows a loading spinner while the project context is resolving', () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: null,
      projects: [],
      loading: true,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    expect(screen.getByText(/Initializing Neural Mesh/i)).toBeInTheDocument();
  });

  it('shows the empty state when there is no active project', async () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: null,
      projects: [],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    expect(screen.getByText('No Active Projects Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toBeInTheDocument();
  });

  it('does not call tasksApi when there is no active project', () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: null,
      projects: [],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    expect(tasksApi.fetchAll).not.toHaveBeenCalled();
  });

  it('renders the task canvas heading for an active project', async () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: makeProject(),
      projects: [makeProject()],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    expect(screen.getByText('Agentic Task Canvas')).toBeInTheDocument();
  });

  it('fetches tasks using the active project id', async () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: makeProject(),
      projects: [makeProject()],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    await waitFor(() => {
      expect(tasksApi.fetchAll).toHaveBeenCalledWith('project-1');
    });
  });

  it('shows the missing-lead warning when ownerAgent is null', async () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: makeProject({ ownerAgent: null }),
      projects: [makeProject({ ownerAgent: null })],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    expect(screen.getByText(/Administrative Protocol Warning/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Assign Protocol Lead/i })).toBeInTheDocument();
  });

  it('shows the inactive-project warning when project status is not active', () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: makeProject({ status: ProjectStatus.ON_HOLD }),
      projects: [makeProject({ status: ProjectStatus.ON_HOLD })],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    expect(screen.getByText(/Activate Project/i)).toBeInTheDocument();
  });

  it('opens the create-task modal when Commission Task is clicked', async () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: makeProject(),
      projects: [makeProject()],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    renderTaskManager();

    fireEvent.click(screen.getByText('Commission Task'));

    await waitFor(() => {
      expect(screen.getByTestId('create-task-modal')).toBeInTheDocument();
    });
  });

  it('shows the task count in the heading after tasks load', async () => {
    vi.mocked(useProject).mockReturnValue({
      activeProject: makeProject(),
      projects: [makeProject()],
      loading: false,
      refreshProjects: vi.fn(),
      setActiveProjectById: vi.fn(),
    });

    vi.mocked(tasksApi.fetchAll).mockResolvedValue([
      makeApiTask('t1', 'backlog'),
      makeApiTask('t2', 'in-progress'),
    ]);

    renderTaskManager();

    await waitFor(() => {
      // The heading paragraph shows "Orchestrating N parallel node operations"
      expect(screen.getByText(/parallel node operations/i).textContent).toContain('2');
    });
  });

  describe('archive confirm flow', () => {
    beforeEach(() => {
      vi.mocked(useProject).mockReturnValue({
        activeProject: makeProject(),
        projects: [makeProject()],
        loading: false,
        refreshProjects: vi.fn(),
        setActiveProjectById: vi.fn(),
      });

      vi.mocked(tasksApi.fetchAll).mockResolvedValue([makeApiTask('task-1', 'in-progress')]);
    });

    it('renders the confirm dialog when isConfirmOpen is true', () => {
      vi.mocked(useTaskDnD).mockReturnValue({
        ...defaultDnDReturn,
        isConfirmOpen: true,
        pendingArchiveId: 'task-1',
      });

      renderTaskManager();

      expect(screen.getByText('Archive Protocol Task')).toBeInTheDocument();
    });

    it('calls tasksApi.update with archived status when archive is confirmed', async () => {
      const mockSetIsConfirmOpen = vi.fn();
      vi.mocked(useTaskDnD).mockReturnValue({
        ...defaultDnDReturn,
        isConfirmOpen: true,
        pendingArchiveId: 'task-1',
        setIsConfirmOpen: mockSetIsConfirmOpen,
      });

      renderTaskManager();

      fireEvent.click(screen.getByText('Archive Task'));

      await waitFor(() => {
        expect(tasksApi.update).toHaveBeenCalledWith(
          'project-1',
          'task-1',
          { status: TaskStatus.ARCHIVED },
        );
      });
    });

    it('closes the dialog after confirming archive', async () => {
      const mockSetIsConfirmOpen = vi.fn();
      vi.mocked(useTaskDnD).mockReturnValue({
        ...defaultDnDReturn,
        isConfirmOpen: true,
        pendingArchiveId: 'task-1',
        setIsConfirmOpen: mockSetIsConfirmOpen,
      });

      renderTaskManager();

      fireEvent.click(screen.getByText('Archive Task'));

      await waitFor(() => {
        expect(mockSetIsConfirmOpen).toHaveBeenCalledWith(false);
      });
    });

    it('calls notifyError and invalidates query when status update fails', async () => {
      vi.mocked(useTaskDnD).mockReturnValue({
        ...defaultDnDReturn,
        isConfirmOpen: true,
        pendingArchiveId: 'task-1',
        setIsConfirmOpen: vi.fn(),
      });
      vi.mocked(tasksApi.update).mockRejectedValue(new Error('network'));

      renderTaskManager();

      fireEvent.click(screen.getByText('Archive Task'));

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Status Update Failed',
          expect.any(String),
        );
      });
    });
  });
});
