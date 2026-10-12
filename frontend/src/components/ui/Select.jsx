import React, { useId } from 'react';
import { cn } from '../../utils/cn';

// Native <select> (best keyboard and mobile behavior) styled to match Input.
export const Select = React.forwardRef(function Select({ className, label, error, id, children, ...props }, ref) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="t-label mb-2 block">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={cn(
          'h-11 w-full rounded-md border border-border-strong bg-bg-primary px-3 text-[0.9375rem] text-text-primary',
          'transition-[border-color,box-shadow] duration-200 hover:border-text-tertiary focus:border-text-primary focus:outline-none focus:ring-4 focus:ring-text-primary/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
