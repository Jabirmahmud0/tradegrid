import * as React from 'react';
import { cn } from '../../lib/utils';

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'warning' | 'error' | 'syncing';
  showLabel?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = true,
  className,
  ...props
}) => {
  const configs = {
    online: { color: 'bg-green-500', label: 'Online', pulse: true },
    offline: { color: 'bg-zinc-500', label: 'Offline', pulse: false },
    warning: { color: 'bg-yellow-500', label: 'Degraded', pulse: true },
    error: { color: 'bg-red-500', label: 'Error', pulse: true },
    syncing: { color: 'bg-blue-500', label: 'Syncing', pulse: true },
  };

  const { color, label, pulse } = configs[status];

  return (
    <div className={cn('flex items-center gap-1.5', className)} {...props}>
      <div className="relative flex h-2 w-2">
        {pulse && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', color)} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', color)} />
      </div>
      {showLabel && <span className="text-[10px] uppercase font-bold tracking-tighter text-zinc-400">{label}</span>}
    </div>
  );
};
