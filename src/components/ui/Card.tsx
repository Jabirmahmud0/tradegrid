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
        'flex flex-col bg-[var(--color-bg-base)] overflow-hidden',
        variant === 'outline' && 'border border-[var(--color-border)] rounded-sm shadow-sm',
        variant === 'ghost' && 'border-none',
        variant === 'glass' && 'bg-[var(--color-bg-base)]/80 backdrop-blur-md border border-[var(--color-border-strong)]/30 rounded-md',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/30 flex items-center justify-between font-mono text-[10px] uppercase font-bold tracking-tight text-[var(--color-text-secondary)]">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">{children}</div>
      {footer && (
        <div className="px-3 py-1.5 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]/20 text-[10px] text-[var(--color-text-tertiary)]">
          {footer}
        </div>
      )}
    </div>
  );
};
