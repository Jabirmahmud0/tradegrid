import React from 'react';
import { Play, Pause, FastForward, Rewind, Activity, Zap, Cpu } from 'lucide-react';
import { useReplayStore } from '../../store/replay-store';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';

export const ReplayPanel: React.FC = () => {
    const { isReplaying, isPaused, speed, progress, setPaused, setSpeed, reset } = useReplayStore();
    const metrics = useLiveStore(state => state.metrics);

    if (!isReplaying) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-4 shadow-emerald-500/5">
                <div className="flex flex-col gap-4">
                    
                    {/* Top Section: Metrics & Scrubbing */}
                    <div className="flex items-center justify-between gap-6">
                        {/* Buffer / Load Stats */}
                        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <Cpu size={12} className="text-emerald-500" />
                                <span className="uppercase tracking-tighter">FPS:</span>
                                <span className={cn("font-bold tabular-nums", metrics.fps < 50 ? "text-red-400" : "text-emerald-400")}>
                                    {metrics.fps}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
                                <Zap size={12} className="text-amber-500" />
                                <span className="uppercase tracking-tighter">Latency:</span>
                                <span className="font-bold tabular-nums text-zinc-300">
                                    {metrics.dispatchLatency.toFixed(1)}ms
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
                                <Activity size={12} className="text-blue-500" />
                                <span className="uppercase tracking-tighter">Load:</span>
                                <div className="h-2 w-16 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500/50 transition-all duration-300" 
                                        style={{ width: `${Math.min(100, metrics.queueDepth / 10)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Close Replay Button */}
                        <button 
                            onClick={reset}
                            className="text-[9px] font-bold text-zinc-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                        >
                            Exit Replay Mode
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative group/progress">
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full cursor-pointer overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                        <div 
                            className="absolute -top-4 text-[9px] font-bold text-emerald-400 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                            style={{ left: `${progress * 100}%`, transform: 'translateX(-50%)' }}
                        >
                            {(progress * 100).toFixed(1)}%
                        </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                                <Rewind size={18} />
                            </button>
                            <button 
                                onClick={() => setPaused(!isPaused)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                                    isPaused 
                                        ? "bg-emerald-500 text-zinc-950 hover:scale-110 shadow-lg shadow-emerald-500/20" 
                                        : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                                )}
                            >
                                {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                            </button>
                            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                                <FastForward size={18} />
                            </button>
                        </div>

                        {/* Speed Selector */}
                        <div className="flex items-center bg-zinc-950/50 rounded-lg p-1 border border-zinc-800">
                            {[0.5, 1.0, 2.0, 5.0, 10.0].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={cn(
                                        "px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all",
                                        speed === s 
                                            ? "bg-zinc-800 text-white shadow-sm" 
                                            : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-0 right-0 p-1">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isPaused ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-glow"
                    )} />
                </div>
            </div>
        </div>
    );
};
