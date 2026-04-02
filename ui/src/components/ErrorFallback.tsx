import type { FallbackProps } from 'react-error-boundary';

interface ErrorFallbackProps extends FallbackProps {
  title?: string;
  description?: string;
}

const ErrorFallback = ({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  description = 'This section hit an unexpected error. You can try again without losing the rest of the app.',
}: ErrorFallbackProps) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-left shadow-lg">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-error/80">
          Rendering error
        </p>
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-xl bg-surface/70 p-4 text-xs text-on-surface-variant">
        {errorMessage}
      </pre>

      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-on-primary transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        Retry render
      </button>
    </div>
  );
};

export default ErrorFallback;
