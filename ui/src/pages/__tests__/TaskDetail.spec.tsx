import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskDetail from '../TaskDetail';
import { tasksApi, TaskPriority, TaskStatus } from '../../api/tasks';
import { agentsApi } from '../../api/agents';
import type { Task } from '../../api/tasks';

vi.mock('../../api/tasks', () => ({
  tasksApi: {
    findOne: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  TaskPriority: { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 },
  TaskStatus: {
    BACKLOG: 'backlog',
    IN_PROGRESS: 'in-progress',
    REVIEW: 'review',
    DONE: 'done',
    ARCHIVED: 'archived',
  },
}));

vi.mock('../../api/agents', () => ({
  agentsApi: { findAll: vi.fn() },
}));

vi.mock('../../hooks/useNotification', () => ({
  useNotification: () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyApiError: vi.fn(),
  }),
}));

// CommentSection has its own API/auth dependencies; stub it out
vi.mock('../../components/tasks/CommentSection', () => ({
  default: () => <div data-testid="comment-section" />,
}));

// AuthContext used indirectly via CommentSection (already mocked above), but
// guard against any direct usage surfacing from other deps.
vi.mock('../../contexts/AuthContextInstance', () => ({
  AuthContext: {},
  useAuth: () => ({ user: { id: 'user-1', name: 'Test User' } }),
}));

const PROJECT_ID = 'project-1';
const TASK_ID = 'task-abc';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: TASK_ID,
  title: 'Original Title',
  description: 'Original description',
  status: TaskStatus.BACKLOG,
  priority: TaskPriority.MEDIUM,
  projectId: PROJECT_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const renderTaskDetail = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/projects/${PROJECT_ID}/tasks/${TASK_ID}`]}>
        <Routes>
          <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('TaskDetail – priority field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(agentsApi.findAll).mockResolvedValue({
      data: [],
    } as unknown as Awaited<ReturnType<typeof agentsApi.findAll>>);
  });

  it('does not show "Priority is required" when saving after editing the title without touching priority', async () => {
    vi.mocked(tasksApi.findOne).mockResolvedValue({
      data: makeTask({ priority: TaskPriority.HIGH }),
    } as Awaited<ReturnType<typeof tasksApi.findOne>>);
    vi.mocked(tasksApi.update).mockResolvedValue({
      data: makeTask({ title: 'Updated Title', priority: TaskPriority.HIGH }),
    } as Awaited<ReturnType<typeof tasksApi.update>>);

    renderTaskDetail();

    const titleInput = await screen.findByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    fireEvent.click(screen.getByRole('button', { name: /save protocol/i }));

    await waitFor(() => {
      expect(screen.queryByText('Priority is required')).not.toBeInTheDocument();
      expect(tasksApi.update).toHaveBeenCalledWith(
        PROJECT_ID,
        TASK_ID,
        expect.objectContaining({ priority: TaskPriority.HIGH }),
      );
    });
  });

  it('coerces a string priority from the API and saves without error (regression test)', async () => {
    // Simulate an API response where priority is returned as a string instead of a number.
    // The HTML select renders correctly for both types, hiding the mismatch visually.
    vi.mocked(tasksApi.findOne).mockResolvedValue({
      data: makeTask({ priority: '2' as unknown as TaskPriority }),
    } as Awaited<ReturnType<typeof tasksApi.findOne>>);
    vi.mocked(tasksApi.update).mockResolvedValue({
      data: makeTask({ title: 'Updated Title', priority: TaskPriority.MEDIUM }),
    } as Awaited<ReturnType<typeof tasksApi.update>>);

    renderTaskDetail();

    const titleInput = await screen.findByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    fireEvent.click(screen.getByRole('button', { name: /save protocol/i }));

    await waitFor(() => {
      expect(screen.queryByText('Priority is required')).not.toBeInTheDocument();
      expect(tasksApi.update).toHaveBeenCalledWith(
        PROJECT_ID,
        TASK_ID,
        expect.objectContaining({ priority: TaskPriority.MEDIUM }),
      );
    });
  });

  it('does not show "Priority is required" for CRITICAL priority (numeric value 0)', async () => {
    vi.mocked(tasksApi.findOne).mockResolvedValue({
      data: makeTask({ priority: TaskPriority.CRITICAL }),
    } as Awaited<ReturnType<typeof tasksApi.findOne>>);
    vi.mocked(tasksApi.update).mockResolvedValue({
      data: makeTask({ title: 'Updated Title', priority: TaskPriority.CRITICAL }),
    } as Awaited<ReturnType<typeof tasksApi.update>>);

    renderTaskDetail();

    const titleInput = await screen.findByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    fireEvent.click(screen.getByRole('button', { name: /save protocol/i }));

    await waitFor(() => {
      expect(screen.queryByText('Priority is required')).not.toBeInTheDocument();
      expect(tasksApi.update).toHaveBeenCalledWith(
        PROJECT_ID,
        TASK_ID,
        expect.objectContaining({ priority: TaskPriority.CRITICAL }),
      );
    });
  });
});
