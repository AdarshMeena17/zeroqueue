import { cn } from '../../utils/cn';

// Mark: a queue "pill" with the active token at its front.
export function Logo({ className, showText = true, textClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-display', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect x="3" y="9" width="26" height="14" rx="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="21.5" cy="16" r="3.4" fill="var(--qz-signal)" />
      </svg>
      {showText && <span className={cn('text-[1.2rem] font-semibold tracking-[-0.04em]', textClassName)}>QueueZero</span>}
    </span>
  );
}
