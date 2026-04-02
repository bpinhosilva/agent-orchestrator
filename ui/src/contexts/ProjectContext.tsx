import React, {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, type Project } from '../api/projects';
import { ProjectContext } from './ProjectContextInstance';

const PROJECTS_QUERY_KEY = ['projects'] as const;

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferredActiveProjectId, setPreferredActiveProjectId] = useState<string | null>(null);

  const {
    data: projects = [],
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => {
      const response = await projectsApi.findAll();
      return response.data;
    },
  });

  const activeProject = useMemo<Project | null>(() => {
    if (projects.length === 0) {
      return null;
    }

    return (
      projects.find((project) => project.id === preferredActiveProjectId) ??
      projects[0] ??
      null
    );
  }, [preferredActiveProjectId, projects]);

  const refreshProjects = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const setActiveProjectById = useCallback(
    (id: string) => {
      setPreferredActiveProjectId((currentActiveProjectId) => {
        const nextActiveProject = projects.find((project) => project.id === id);
        return nextActiveProject?.id ?? currentActiveProjectId;
      });
    },
    [projects],
  );

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      loading: isPending || isFetching,
      refreshProjects,
      setActiveProjectById,
    }),
    [activeProject, isFetching, isPending, projects, refreshProjects, setActiveProjectById],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
