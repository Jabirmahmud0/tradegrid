import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { marketClient } from '../../services/market-client';
import { cn } from '../../utils';
import { Card } from '../../components/ui/Card';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Activity } from 'lucide-react';

const SPEEDS = [0.5, 1, 2, 5, 10, 50, 100] as const;

export const TimeMachinePage: React.FC = () => {
  const {
    mode, status, speed, progress,
    setReplayMode, setReplayStatus, setReplaySpeed, setReplayProgress, resetReplay
  } = useLiveStore();

  const isReplay = mode === 'REPLAY';
  const isPlaying = status === 'PLAYING';
  const isPaused = status === 'PAUSED';

  const handleToggleReplay = () => {
    if (!isReplay) {
      setReplayMode('REPLAY');
      setReplayStatus('PAUSED');
      marketClient.startReplay(speed);
    } else {
      resetReplay();
      marketClient.stopReplay();
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setReplayStatus('PAUSED');
      marketClient.stopReplay();
    } else {
      setReplayStatus('PLAYING');
      marketClient.startReplay(speed);
    }
  };

  const handleSpeedChange = (s: number) => {
    setReplaySpeed(s);
    if (isPlaying) marketClient.startReplay(s);
  };

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setReplayProgress(pct);
  };

  const handleSeekDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleSeekStart(e);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Time Machine</h1>
          <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Replay historical market sessions with full control</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
            isReplay
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          )}>
            <Activity size={12} className={isReplay ? '' : 'animate-pulse'} />
            {mode}
          </div>
        </div>
      </div>

      {/* Main Replay Controls */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* Status Indicator */}
        <div className="text-center">
          <div className={cn(
            'text-4xl font-black font-mono tracking-tighter',
            isReplay ? 'text-amber-400' : 'text-emerald-400'
          )}>
            {isReplay ? 'REPLAY MODE' : 'LIVE MODE'}
          </div>
          <div className="text-[10px] font-mono text-[var(--color-text-tertiary)] mt-2">
            {isReplay
              ? `Cursor: ${(progress * 100).toFixed(1)}% · Speed: ${speed}x · ${status}`
              : 'All charts streaming live data'
            }
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setReplayProgress(0)}
            className="p-3 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-zinc-400 hover:text-white hover:border-[var(--color-border-strong)] transition-all"
            disabled={!isReplay}
            aria-label="Start"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={() => setReplayProgress(Math.max(0, progress - 0.05))}
            className="p-3 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-zinc-400 hover:text-white hover:border-[var(--color-border-strong)] transition-all"
            disabled={!isReplay}
            aria-label="Rewind"
          >
            <Rewind size={20} />
          </button>
          <button
            onClick={handlePlayPause}
            className={cn(
              'p-5 rounded-full border transition-all',
              !isReplay
                ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
                : isPaused
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 hover:scale-110 shadow-lg shadow-emerald-500/20'
                  : 'bg-[var(--color-bg-elevated)] text-white border-[var(--color-border-strong)] hover:scale-105'
            )}
            disabled={!isReplay}
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
          </button>
          <button
            onClick={() => setReplayProgress(Math.min(1, progress + 0.05))}
            className="p-3 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-zinc-400 hover:text-white hover:border-[var(--color-border-strong)] transition-all"
            disabled={!isReplay}
            aria-label="Fast forward"
          >
            <FastForward size={20} />
          </button>
          <button
            onClick={() => setReplayProgress(1)}
            className="p-3 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-zinc-400 hover:text-white hover:border-[var(--color-border-strong)] transition-all"
            disabled={!isReplay}
            aria-label="End"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Speed:</span>
          <div className="flex items-center bg-[var(--color-bg-base)] rounded-md p-0.5 border border-[var(--color-border)]">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                disabled={!isReplay}
                className={cn(
                  'px-3 py-1.5 rounded text-[10px] font-bold font-mono transition-all',
                  speed === s
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : isReplay
                      ? 'text-zinc-600 hover:text-zinc-400'
                      : 'text-zinc-800 cursor-not-allowed'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Timeline Scrubber */}
      <div className="px-6 pb-6 shrink-0">
        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
              <span>SESSION START</span>
              <span className="text-[var(--color-text-secondary)]">
                {isReplay ? `${(progress * 100).toFixed(1)}%` : '—'}
              </span>
              <span>SESSION END</span>
            </div>
            <div
              className="h-3 bg-[var(--color-bg-base)] rounded-full cursor-pointer relative group"
              onClick={handleSeekStart}
              onMouseMove={handleSeekDrag}
              role="slider"
              aria-label="Replay timeline"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') setReplayProgress(Math.min(1, progress + 0.01));
                if (e.key === 'ArrowLeft') setReplayProgress(Math.max(0, progress - 0.01));
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: isReplay
                    ? 'linear-gradient(90deg, var(--color-accent), var(--color-profit))'
                    : 'var(--color-text-disabled)'
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[var(--color-accent)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress * 100}% - 8px)` }}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleToggleReplay}
            className={cn(
              'px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border',
              isReplay
                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            )}
          >
            {isReplay ? 'Exit Replay → Live' : 'Enter Replay Mode'}
          </button>
          {isReplay && (
            <button
              onClick={() => { resetReplay(); marketClient.stopReplay(); }}
              className="px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-700 hover:text-zinc-300 transition-all"
            >
              Reset Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
