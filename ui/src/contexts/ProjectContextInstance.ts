import { createContext } from 'react';
import type { Project } from '../api/projects';

export interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  refreshProjects: () => Promise<void>;
  setActiveProjectById: (id: string) => void;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
