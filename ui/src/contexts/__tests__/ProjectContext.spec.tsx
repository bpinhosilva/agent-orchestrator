import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectProvider } from '../ProjectContext';
import { useProject } from '../../hooks/useProject';
import { projectsApi } from '../../api/projects';
import type { Project } from '../../api/projects';
import { ProjectStatus } from '../../api/projects';

vi.mock('../../api/projects', () => ({
  projectsApi: {
    findAll: vi.fn(),
  },
  ProjectStatus: {
    PLANNING: 'planning',
    ACTIVE: 'active',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
  },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeProject = (id: string, title: string): Project => ({
  id,
  title,
  description: '',
  status: ProjectStatus.ACTIVE,
  ownerAgent: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ─── Test consumer ───────────────────────────────────────────────────────────

const TestConsumer = () => {
  const { projects, activeProject, loading, setActiveProjectById } = useProject();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="active">{activeProject?.title ?? 'none'}</div>
      <div data-testid="count">{projects.length}</div>
      {projects.map((p) => (
        <button key={p.id} onClick={() => setActiveProjectById(p.id)}>
          Select {p.title}
        </button>
      ))}
    </div>
  );
};

// ─── Render helper ───────────────────────────────────────────────────────────

const renderProvider = (queryClient?: QueryClient) => {
  const client =
    queryClient ??
    new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ProjectProvider>
          <TestConsumer />
        </ProjectProvider>
      </QueryClientProvider>,
    ),
  };
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ProjectProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reflects loading=true while the fetch is in flight', () => {
    vi.mocked(projectsApi.findAll).mockReturnValue(new Promise(() => {}));

    renderProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('reflects loading=false and renders projects after fetch resolves', async () => {
    vi.mocked(projectsApi.findAll).mockResolvedValue({
      data: [makeProject('p1', 'Alpha'), makeProject('p2', 'Beta')],
    } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  it('defaults activeProject to the first project in the list', async () => {
    vi.mocked(projectsApi.findAll).mockResolvedValue({
      data: [makeProject('p1', 'Alpha'), makeProject('p2', 'Beta')],
    } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('Alpha');
    });
  });

  it('sets activeProject to null when the list is empty', async () => {
    vi.mocked(projectsApi.findAll).mockResolvedValue({ data: [] } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });

  it('setActiveProjectById switches the active project', async () => {
    vi.mocked(projectsApi.findAll).mockResolvedValue({
      data: [makeProject('p1', 'Alpha'), makeProject('p2', 'Beta')],
    } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('Alpha');
    });

    await userEvent.click(screen.getByText('Select Beta'));

    expect(screen.getByTestId('active')).toHaveTextContent('Beta');
  });

  it('setActiveProjectById is a no-op for an unknown project id', async () => {
    vi.mocked(projectsApi.findAll).mockResolvedValue({
      data: [makeProject('p1', 'Alpha')],
    } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { getByTestId } = render(
      <QueryClientProvider client={client}>
        <ProjectProvider>
          {/* Custom consumer that calls setActiveProjectById directly */}
          {(() => {
            const Inner = () => {
              const ctx = useProject();
              return (
                <>
                  <div data-testid="active">{ctx.activeProject?.title ?? 'none'}</div>
                  <button onClick={() => ctx.setActiveProjectById('does-not-exist')}>
                    Select Unknown
                  </button>
                </>
              );
            };
            return <Inner />;
          })()}
        </ProjectProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('active')).toHaveTextContent('Alpha');
    });

    await userEvent.click(screen.getByText('Select Unknown'));

    expect(getByTestId('active')).toHaveTextContent('Alpha');
  });

  it('falls back to the first project when the preferred project is removed after a refetch', async () => {
    vi.mocked(projectsApi.findAll)
      .mockResolvedValueOnce({
        data: [makeProject('p1', 'Alpha'), makeProject('p2', 'Beta')],
      } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>)
      .mockResolvedValueOnce({
        data: [makeProject('p1', 'Alpha')], // Beta removed
      } as unknown as Awaited<ReturnType<typeof projectsApi.findAll>>);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderProvider(client);

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('Alpha');
    });

    // Select Beta while it still exists.
    await userEvent.click(screen.getByText('Select Beta'));
    expect(screen.getByTestId('active')).toHaveTextContent('Beta');

    // Trigger a refetch — Beta is gone in the second response.
    act(() => {
      client.invalidateQueries({ queryKey: ['projects'] });
    });

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('Alpha');
    });
  });
});
