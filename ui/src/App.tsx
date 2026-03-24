import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './layout/Shell';

const AgentFleet = lazy(() => import('./components/AgentFleet'));
const Providers = lazy(() => import('./pages/Providers'));
const TaskManager = lazy(() => import('./pages/TaskManager'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
import { NotificationProvider } from './contexts/NotificationContext';
import { ProjectProvider } from './contexts/ProjectContext';
import NotificationModal from './components/NotificationModal';
import NotificationInterceptor from './components/NotificationInterceptor';

function App() {
  return (
    <NotificationProvider>
      <NotificationInterceptor />
      <BrowserRouter>
        <ProjectProvider>
          <Shell>
            <Suspense fallback={
              <div className="flex items-center justify-center p-8 h-full min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-4 border border-outline-variant/30 border-t-primary animate-spin"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<TaskManager />} />
                <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/agents" element={<AgentFleet />} />
                <Route path="/providers" element={<Providers />} />
                <Route path="/flow" element={<div className="text-on-surface-variant font-mono">FLOW_BUILDER_CANVAS</div>} />
                <Route path="/scheduler" element={<div className="text-on-surface-variant font-mono">SCHEDULER_CORE</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Shell>
        </ProjectProvider>
      </BrowserRouter>
      <NotificationModal />
    </NotificationProvider>
  );
}

export default App;
