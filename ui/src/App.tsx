import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './layout/Shell';

const AgentFleet = lazy(() => import('./components/AgentFleet'));
const Providers = lazy(() => import('./pages/Providers'));
const UserDetail = lazy(() => import('./pages/UserDetail'));
const TaskManager = lazy(() => import('./pages/TaskManager'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Scheduler = lazy(() => import('./pages/Scheduler'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/Users'));
import { NotificationProvider } from './contexts/NotificationContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContextInstance';
import NotificationModal from './components/NotificationModal';
import NotificationInterceptor from './components/NotificationInterceptor';
import AppErrorBoundary from './components/AppErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="w-12 h-12 rounded-full border-4 border-outline-variant/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const suspenseFallback = (
    <div className="flex items-center justify-center p-8 h-full min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-4 border-outline-variant/30 border-t-primary animate-spin"></div>
    </div>
  );

  return (
    <AppErrorBoundary
      title="The app shell crashed"
      description="A rendering error escaped the route tree. Retry to recover the application shell."
    >
      <NotificationProvider>
        <NotificationInterceptor />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <AppErrorBoundary title="Unable to render login">
                    <Login />
                  </AppErrorBoundary>
                }
              />
              <Route
                path="/register"
                element={
                  <AppErrorBoundary title="Unable to render registration">
                    <Register />
                  </AppErrorBoundary>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <ProjectProvider>
                      <Shell>
                        <Suspense fallback={suspenseFallback}>
                          <Routes>
                            <Route
                              path="/"
                              element={
                                <AppErrorBoundary title="Unable to render task manager">
                                  <TaskManager />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/projects/:projectId/tasks/:taskId"
                              element={
                                <AppErrorBoundary title="Unable to render task detail">
                                  <TaskDetail />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/projects/:projectId"
                              element={
                                <AppErrorBoundary title="Unable to render project detail">
                                  <ProjectDetail />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/agents"
                              element={
                                <AppErrorBoundary title="Unable to render agents">
                                  <AgentFleet />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/providers"
                              element={
                                <AppErrorBoundary title="Unable to render providers">
                                  <Providers />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/flow"
                              element={
                                <AppErrorBoundary title="Unable to render flow builder">
                                  <div className="text-on-surface-variant font-mono">FLOW_BUILDER_CANVAS</div>
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/scheduler"
                              element={
                                <AppErrorBoundary title="Unable to render scheduler">
                                  <Scheduler />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/profile"
                              element={
                                <AppErrorBoundary title="Unable to render profile">
                                  <Profile />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/users"
                              element={
                                <AppErrorBoundary title="Unable to render users">
                                  <Users />
                                </AppErrorBoundary>
                              }
                            />
                            <Route
                              path="/users/:id"
                              element={
                                <AppErrorBoundary title="Unable to render user details">
                                  <ProtectedRoute roles={['admin']}>
                                    <UserDetail />
                                  </ProtectedRoute>
                                </AppErrorBoundary>
                              }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </Shell>
                    </ProjectProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <NotificationModal />
      </NotificationProvider>
    </AppErrorBoundary>
  );
}

export default App;
