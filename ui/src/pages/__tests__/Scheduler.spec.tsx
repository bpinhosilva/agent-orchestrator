import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Scheduler from '../Scheduler';
import { recurrentTasksApi, RecurrentTaskStatus } from '../../api/recurrent-tasks';
import { TaskPriority } from '../../api/tasks';
import { useProject } from '../../hooks/useProject';
import { useNotification } from '../../hooks/useNotification';

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

vi.mock('../../components/CreateRecurrentTaskModal', () => ({
  default: () => null,
}));

vi.mock('../../api/recurrent-tasks', () => ({
  recurrentTasksApi: {
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  RecurrentTaskStatus: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    ERROR: 'error',
  },
}));

describe('Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useProject).mockReturnValue({
      activeProject: {
        id: 'project-1',
        title: 'Mission Control',
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

  it('loads recurrent tasks for the active project', async () => {
    vi.mocked(recurrentTasksApi.findAll).mockResolvedValue({
      data: [
        {
          id: 'rt-1',
          title: 'Daily Market Sweep',
          description: 'Scan the market every morning.',
          status: RecurrentTaskStatus.ACTIVE,
          priority: TaskPriority.MEDIUM,
          cronExpression: '0 0 * * *',
          assignee: { id: 'agent-1', name: 'Fin-Oracle' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as Awaited<ReturnType<typeof recurrentTasksApi.findAll>>);

    render(<Scheduler />);

    await waitFor(() => {
      expect(recurrentTasksApi.findAll).toHaveBeenCalledWith('project-1');
    });

    expect(await screen.findByText('Daily Market Sweep')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
