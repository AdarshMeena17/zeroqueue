import { cn } from '../../utils/cn';

// A deliberate empty state: a quiet queue rail with nobody on it, then what to do next.
export function EmptyState({ title, description, action, icon: Icon, className, compact = false }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-border-strong bg-bg-primary/50 text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-1.5 text-text-tertiary" aria-hidden="true">
        {Icon ? (
          <Icon className="h-6 w-6" />
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            <span className="h-px w-8 bg-border-strong" />
            <span className="h-2 w-2 rounded-full border border-text-tertiary" />
            <span className="h-px w-8 bg-border-strong" />
            <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
          </>
        )}
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="t-meta mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
