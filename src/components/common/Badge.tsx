import * as React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'live' | 'replay';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variants = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    outline: 'bg-transparent border-zinc-700 text-zinc-400',
    live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse-subtle',
    replay: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px] leading-none',
    md: 'px-2 py-0.5 text-xs font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
