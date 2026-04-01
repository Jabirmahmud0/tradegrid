import * as React from 'react';
import { cn } from '../../lib/utils';

interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  prevValue?: number;
  format?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
}

export const Price: React.FC<PriceProps> = ({
  value,
  prevValue,
  size = 'md',
  showSign = false,
  className,
  ...props
}) => {
  const isUp = prevValue !== undefined ? value > prevValue : null;
  const isDown = prevValue !== undefined ? value < prevValue : null;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-medium',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-black tracking-tight',
  };

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <span
      className={cn(
        'font-mono transition-colors duration-300',
        sizeClasses[size],
        isUp && 'text-green-400',
        isDown && 'text-red-400',
        !isUp && !isDown && 'text-zinc-100',
        className
      )}
      {...props}
    >
      {showSign && value > 0 ? '+' : ''}
      {formatted}
    </span>
  );
};
