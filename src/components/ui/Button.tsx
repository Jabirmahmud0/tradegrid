import * as React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'tab';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'sm',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm border-blue-500',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700',
    outline: 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800',
    ghost: 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
    tab: 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-100 rounded-none border-b-2 data-[active=true]:border-blue-500 data-[active=true]:text-zinc-100',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-4 py-2 text-sm font-semibold',
    lg: 'px-6 py-3 text-base font-bold',
    icon: 'h-8 w-8 flex items-center justify-center p-0',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-sm border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-blue-500/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : null}
      {children}
    </button>
  );
};
