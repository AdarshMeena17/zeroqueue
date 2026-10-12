import { cn } from '../../utils/cn';

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="t-label">{eyebrow}</p>}
        <h1 className="t-page mt-3">{title}</h1>
        {description && <p className="t-lead mt-3 max-w-xl">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
