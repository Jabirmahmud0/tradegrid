import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils';

interface EmptyStateProps {
  className?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  className, 
  message = "No data available", 
  icon = <Inbox size={32} /> 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center text-zinc-600 gap-4 opacity-70",
      className
    )}>
      <div className="text-zinc-800 bg-zinc-900/50 p-4 rounded-full border border-zinc-800 mb-2">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{message}</p>
        <p className="text-[10px] text-zinc-700">Waiting for market data stream to initialize...</p>
      </div>
    </div>
  );
};
