import * as React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={id} className="text-[10px] uppercase font-bold tracking-tight text-zinc-500 ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-2.5 text-zinc-500 transition-colors group-focus-within:text-blue-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'h-8 w-full bg-zinc-950 border border-zinc-900 rounded-sm px-3 text-xs text-zinc-100 transition-all font-mono',
              'placeholder:text-zinc-700 hover:border-zinc-800 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20',
              icon && 'pl-9',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10',
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[10px] text-red-400 ml-1 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
