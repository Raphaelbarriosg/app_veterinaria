'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30',
            'transition-all duration-200',
            error && 'border-status-red focus:ring-status-red/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-status-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };