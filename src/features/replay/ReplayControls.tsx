import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { marketClient } from '../../services/market-client';
import { cn } from '../../utils';
import { Play, Pause, FastForward, Rewind, Activity } from 'lucide-react';

export const ReplayControls: React.FC = () => {
  const { mode, status, speed, setReplayMode, setReplayStatus, setReplaySpeed } = useLiveStore();

  const handleToggleMode = () => {
    if (mode === 'LIVE') {
      setReplayMode('REPLAY');
      setReplayStatus('PAUSED');
      marketClient.startReplay(speed);
    } else {
      setReplayMode('LIVE');
      setReplayStatus('IDLE');
      marketClient.stopReplay();
    }
  };

  const handlePlayPause = () => {
    const nextStatus = status === 'PLAYING' ? 'PAUSED' : 'PLAYING';
    setReplayStatus(nextStatus);
    
    if (nextStatus === 'PLAYING') {
        marketClient.startReplay(speed);
    } else {
        marketClient.stopReplay();
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setReplaySpeed(newSpeed);
    if (status === 'PLAYING') {
        marketClient.startReplay(newSpeed);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-full shadow-2xl">
      {/* Mode Toggle */}
      <button 
        onClick={handleToggleMode}
        className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
            mode === 'LIVE' 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        )}
      >
        {mode === 'LIVE' ? <Activity size={12} className="animate-pulse" /> : <Rewind size={12} />}
        {mode}
      </button>

      {/* Playback Controls (Visible only in Replay) */}
      {mode === 'REPLAY' && (
        <div className="flex items-center gap-6 border-l border-zinc-800 pl-6 h-6">
            <button 
                onClick={handlePlayPause}
                className="text-zinc-100 hover:text-white transition-colors"
            >
                {status === 'PLAYING' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-zinc-950/50 p-0.5 rounded-md border border-zinc-800">
                {[1, 2, 5, 10].map(s => (
                    <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={cn(
                            "px-2 py-0.5 text-[9px] font-bold rounded-sm transition-all",
                            speed === s ? "bg-zinc-100 text-zinc-950" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            {/* Scrub Bar (Simulation) */}
            <div className="w-32 h-1 bg-zinc-800 rounded-full relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 left-0 h-full bg-amber-500 w-1/3" />
            </div>
        </div>
      )}
    </div>
  );
};
