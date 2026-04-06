import React, { useCallback, useRef } from 'react';
import { useLiveStore } from '../../store/live-store';
import { marketClient } from '../../services/market-client';
import { cn } from '../../utils';
import { Play, Pause, Activity, Rewind, Flag } from 'lucide-react';

// Replay time range (mock: 24 hours in ms)
const REPLAY_DURATION_MS = 24 * 60 * 60 * 1000;
const REPLAY_START_TIME = Date.now() - REPLAY_DURATION_MS;
const REPLAY_END_TIME = REPLAY_START_TIME + REPLAY_DURATION_MS;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const ReplayControls: React.FC = () => {
  const { mode, status, speed, progress, cursor, totalEvents, setReplayMode, setReplayStatus, setReplaySpeed, setReplayProgress } = useLiveStore();
  const scrubRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const replayTotal = Math.max(totalEvents, 0);

  const seekToProgress = useCallback((pct: number) => {
    const nextProgress = Math.max(0, Math.min(1, pct));
    const nextCursor = replayTotal > 1 ? Math.round(nextProgress * (replayTotal - 1)) : 0;
    setReplayProgress(nextProgress);
    if (mode === 'REPLAY') {
      marketClient.seekReplay(nextCursor);
    }
  }, [mode, replayTotal, setReplayProgress]);

  const handleToggleMode = () => {
    if (mode === 'LIVE') {
      setReplayMode('REPLAY');
      setReplayStatus('PAUSED');
      marketClient.startReplay(speed, cursor);
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
        marketClient.startReplay(speed, cursor);
    } else {
        marketClient.stopReplay();
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setReplaySpeed(newSpeed);
    if (status === 'PLAYING') {
        marketClient.startReplay(newSpeed, cursor);
    }
  };

  const scrubToPct = useCallback((clientX: number) => {
    if (!scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    seekToProgress(pct);
  }, [seekToProgress]);

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    scrubToPct(e.clientX);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    scrubToPct(e.clientX);
    const handleMouseMove = (ev: MouseEvent) => {
      if (isDragging.current) scrubToPct(ev.clientX);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [scrubToPct]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keyboard scrub support (M12)
    const step = 0.02;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      seekToProgress(Math.min(1, progress + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      seekToProgress(Math.max(0, progress - step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      seekToProgress(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      seekToProgress(1);
    }
  }, [progress, seekToProgress]);

  const currentTime = REPLAY_START_TIME + progress * REPLAY_DURATION_MS;

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
            {status === 'COMPLETED' ? (
              <div className="flex items-center gap-1.5 text-amber-400">
                <Flag size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">End of Session</span>
              </div>
            ) : (
              <button
                  onClick={handlePlayPause}
                  className="text-zinc-100 hover:text-white transition-colors"
                  aria-label={status === 'PLAYING' ? 'Pause' : 'Play'}
              >
                  {status === 'PLAYING' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
            )}

            {/* Speed Multipliers — PRD spec: 0.5x, 1x, 5x, 10x, 100x */}
            <div className="flex items-center gap-1 bg-zinc-950/50 p-0.5 rounded-md border border-zinc-800">
                {[0.5, 1, 5, 10, 100].map(s => (
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

            {/* Scrub Bar — interactive with drag support (H10) + time display (H11) */}
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                    {formatTime(currentTime)}
                </span>
                <div
                    ref={scrubRef}
                    className="w-32 h-1 bg-zinc-800 rounded-full relative overflow-hidden cursor-pointer group"
                    onClick={handleScrubClick}
                    onMouseDown={handleMouseDown}
                    onKeyDown={handleKeyDown}
                    role="slider"
                    aria-label="Replay progress"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    tabIndex={0}
                >
                    <div
                        className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-100 group-hover:bg-amber-400"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                    {formatTime(REPLAY_END_TIME)}
                </span>
            </div>
        </div>
      )}
    </div>
  );
};
