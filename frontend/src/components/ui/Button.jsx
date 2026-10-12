import React from 'react';
import { cn } from '../../utils/cn';

// Re-exported because existing screens import `cn` from here.
// eslint-disable-next-line react-refresh/only-export-components
export { cn };

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-tight select-none ' +
  'transition-[background-color,color,border-color,transform,opacity,box-shadow] duration-200 ease-out ' +
  'active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none';

const variants = {
  primary: 'bg-brand-accent text-brand-accent-text hover:opacity-90',
  signal: 'bg-signal text-ink hover:brightness-95',
  secondary: 'bg-bg-tertiary text-text-primary hover:bg-border-subtle',
  outline: 'border border-border-strong text-text-primary hover:bg-bg-tertiary hover:border-text-tertiary',
  ghost: 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
  danger: 'bg-danger text-white hover:brightness-110',
  'danger-ghost': 'text-danger hover:bg-danger/10',
};

const sizes = {
  default: 'h-11 px-4',
  sm: 'h-10 px-3.5',
  lg: 'h-12 px-6 text-[0.95rem]',
  icon: 'h-11 w-11',
};

// Class builder so links can look like buttons without nesting <a> inside <button>.
// eslint-disable-next-line react-refresh/only-export-components
export const buttonClasses = ({ variant = 'primary', size = 'default', className } = {}) =>
  cn(base, variants[variant], sizes[size], className);

export const Button = React.forwardRef(function Button(
  { className, variant = 'primary', size = 'default', isLoading = false, disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});
