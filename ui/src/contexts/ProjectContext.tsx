import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { projectsApi, type Project } from '../api/projects';
import { ProjectContext } from './ProjectContextInstance';

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectsApi.findAll();
      const fetchedProjects = res.data;
      setProjects(fetchedProjects);
      
      // Update activeProject if needed, without causing a dependency loop
      setActiveProject(currentActive => {
        if (fetchedProjects.length > 0) {
          if (!currentActive) {
            return fetchedProjects[0];
          } else {
            const updatedActive = fetchedProjects.find(p => p.id === currentActive.id);
            return updatedActive || fetchedProjects[0];
          }
        }
        return null;
      });
    } catch (error) {
      console.error('Failed to fetch projects in context:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveProjectById = useCallback((id: string) => {
    setActiveProject(currentActive => {
        const project = projects.find(p => p.id === id);
        return project || currentActive;
    });
  }, [projects]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      activeProject, 
      loading, 
      refreshProjects,
      setActiveProjectById
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
