import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className, 
  size = 24, 
  label 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <Loader2 
        className="text-emerald-500 animate-spin" 
        size={size} 
      />
      {label && (
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};
