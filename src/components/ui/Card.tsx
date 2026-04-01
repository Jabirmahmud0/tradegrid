import * as React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'outline' | 'ghost' | 'glass';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'outline',
  header,
  footer,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col bg-zinc-950 overflow-hidden',
        variant === 'outline' && 'border border-zinc-900 rounded-sm shadow-sm',
        variant === 'ghost' && 'border-none',
        variant === 'glass' && 'bg-zinc-950/80 backdrop-blur-md border border-zinc-800/50 rounded-md',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-3 py-2 border-b border-zinc-900 bg-zinc-900/10 flex items-center justify-between font-mono text-[10px] uppercase font-bold tracking-tight text-zinc-400">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-auto">{children}</div>
      {footer && (
        <div className="px-3 py-1.5 border-t border-zinc-900 bg-zinc-900/5 text-[10px] text-zinc-500">
          {footer}
        </div>
      )}
    </div>
  );
};
