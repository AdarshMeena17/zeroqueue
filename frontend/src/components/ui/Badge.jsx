import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-bg-tertiary text-text-secondary',
  active: 'bg-signal/20 text-signal-ink',
  paused: 'bg-warn/15 text-warn',
  closed: 'bg-danger/15 text-danger',
  serving: 'bg-signal text-ink',
  outline: 'border border-border-strong text-text-secondary',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em]',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
