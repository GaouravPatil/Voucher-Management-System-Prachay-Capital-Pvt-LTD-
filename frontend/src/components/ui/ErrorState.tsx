import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center"
      role="alert"
    >
      <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden="true" />
      <p className="max-w-md text-sm text-gray-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
