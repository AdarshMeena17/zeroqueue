import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(function Input({ className, label, error, hint, id, trailing, ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="t-label mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'peer h-11 w-full rounded-md border border-border-strong bg-bg-primary px-3.5 text-[0.9375rem] text-text-primary',
            'placeholder:text-text-tertiary/70 transition-[border-color,box-shadow] duration-200',
            'hover:border-text-tertiary focus:border-text-primary focus:outline-none focus:ring-4 focus:ring-text-primary/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            trailing && 'pr-11',
            className,
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="t-caption mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
