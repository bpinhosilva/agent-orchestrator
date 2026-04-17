import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorFallback';

interface AppErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const AppErrorBoundary = ({
  children,
  title,
  description,
}: AppErrorBoundaryProps) => {
  return (
    <ErrorBoundary
      fallbackRender={(props) => (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <ErrorFallback
              {...props}
              title={title}
              description={description}
            />
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
