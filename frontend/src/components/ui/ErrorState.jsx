import { RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

// One consistent "something failed, here is how to recover" state.
export function ErrorState({ title = 'Something went wrong', description, onRetry, className }) {
  return (
    <EmptyState
      className={className}
      title={title}
      description={description}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </Button>
        )
      }
    />
  );
}
