import React, { useState, useRef, useEffect } from 'react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';
import { 
    Gauge, Clock, Activity, Bug, Minimize2, 
    HardDrive, Layers, Zap, Maximize2
} from 'lucide-react';
import { PerformanceChart } from './PerformanceChart';

export const DebugPanel: React.FC<{ className?: string }> = ({ className }) => {
    const metrics = useLiveStore(state => state.metrics);
    const eventLog = useLiveStore(state => state.eventLog);
    
    // UI State
    const [isExpanded, setIsExpanded] = useState(false);
    const [pos, setPos] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    // Performance History (for sparklines)
    const [fpsHistory, setFpsHistory] = useState<number[]>([]);
    const [epsHistory, setEpsHistory] = useState<number[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentMetrics = useLiveStore.getState().metrics;
            setFpsHistory(prev => [...prev.slice(-49), currentMetrics.fps]);
            setEpsHistory(prev => [...prev.slice(-49), currentMetrics.eventsPerSec]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - 150)),
                y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - 20))
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isExpanded) {
        return (
            <button 
                onClick={() => setIsExpanded(true)}
                className={cn(
                    "fixed bottom-6 right-6 z-[200] w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-all shadow-xl shadow-black/50 group",
                    className
                )}
            >
                <Bug size={20} className="group-hover:scale-110 transition-transform" />
                {metrics.fps < 45 && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse" />
                )}
            </button>
        );
    }

    return (
        <div 
            ref={dragRef}
            className={cn(
                "fixed z-[200] w-72 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-shadow",
                isDragging ? "shadow-emerald-500/10 border-emerald-500/30" : "shadow-black/60",
                className
            )}
            style={{ left: pos.x, top: pos.y }}
        >
            {/* Header / Drag Handle */}
            <div 
                onMouseDown={handleMouseDown}
                className="drag-handle h-10 px-3 flex items-center justify-between border-b border-zinc-900 bg-zinc-900/50 cursor-move group/header"
            >
                <div className="flex items-center gap-2">
                    <Bug size={14} className="text-zinc-600 group-hover/header:text-emerald-400 transition-colors" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Engine Diagnostics</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsExpanded(false)} className="p-1 hover:text-zinc-100 text-zinc-600 transition-colors">
                        <Minimize2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide max-h-[450px]">
                
                {/* 1. Core Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <MetricCard 
                        label="Frames / Sec" 
                        value={metrics.fps} 
                        unit="fps" 
                        icon={<Gauge size={10}/>} 
                        color={metrics.fps > 55 ? "emerald" : "red"} 
                    />
                    <MetricCard 
                        label="Dropped" 
                        value={metrics.droppedFrames} 
                        unit="fr" 
                        icon={<Activity size={10}/>} 
                        color={metrics.droppedFrames > 0 ? "red" : "zinc"} 
                    />
                    <MetricCard 
                        label="Worker Decode" 
                        value={metrics.workerDecodeTime.toFixed(2)} 
                        unit="ms" 
                        icon={<Zap size={10}/>} 
                        color={metrics.workerDecodeTime > 5 ? "amber" : "emerald"} 
                    />
                    <MetricCard 
                        label="Render Latency" 
                        value={metrics.renderLatency.toFixed(2)} 
                        unit="ms" 
                        icon={<Clock size={10}/>} 
                        color={metrics.renderLatency > 16 ? "red" : "blue"} 
                    />
                    <MetricCard 
                        label="Queue Depth" 
                        value={metrics.queueDepth} 
                        unit="ev" 
                        icon={<Layers size={10}/>} 
                        color={metrics.queueDepth > 100 ? "red" : "zinc"} 
                    />
                    <MetricCard 
                        label="Memory Use" 
                        value={metrics.memoryEstimate.toFixed(1)} 
                        unit="mb" 
                        icon={<HardDrive size={10}/>} 
                        color="blue" 
                    />
                </div>

                {/* 2. Throughput Chart */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase">
                            <Activity size={10} />
                            Ingestion Throughput
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">{metrics.eventsPerSec} eps</span>
                    </div>
                    <div className="h-10 bg-zinc-900/30 rounded border border-zinc-900 overflow-hidden">
                        <PerformanceChart data={epsHistory} color="#10b981" height={40} />
                    </div>
                </div>

                {/* 3. Frame Stability Chart */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase">
                            <Maximize2 size={10} />
                            Frame Stability
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">{metrics.frameTime.toFixed(2)}ms</span>
                    </div>
                    <div className="h-10 bg-zinc-900/30 rounded border border-zinc-900 overflow-hidden">
                        <PerformanceChart data={fpsHistory} color="#3b82f6" height={40} max={60} />
                    </div>
                </div>

                {/* 4. Trace Log */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase">
                        <Zap size={10} />
                        Trace Stream
                    </div>
                    <div className="bg-black/40 border border-zinc-900 rounded p-2 h-32 overflow-y-auto space-y-1 font-mono text-[9px]">
                        {eventLog.length === 0 && <div className="text-zinc-800 italic">No trace events captured...</div>}
                        {eventLog.slice(0, 50).map((log, i) => (
                            <div key={i} className="flex gap-2 leading-relaxed">
                                <span className="text-zinc-700 shrink-0">[{new Date(log.ts).toLocaleTimeString()}]</span>
                                <span className={cn(
                                    log.level === 'error' ? "text-red-500" : 
                                    log.level === 'warn' ? "text-amber-500" : 
                                    "text-zinc-400"
                                )}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Status */}
            <div className="px-3 py-2 bg-zinc-900/80 border-t border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Engine Nominal</span>
                </div>
                <span className="text-[8px] text-zinc-600 font-mono">TG-SDK v2.1.0-sim</span>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ 
    label: string; 
    value: any; 
    unit: string; 
    icon: React.ReactNode;
    color: 'emerald' | 'amber' | 'red' | 'blue' | 'zinc';
}> = ({ label, value, unit, icon, color }) => {
    const colorClasses = {
        emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
        amber: "text-amber-400 bg-amber-500/5 border-amber-500/10",
        red: "text-red-400 bg-red-500/5 border-red-500/10",
        blue: "text-blue-400 bg-blue-500/5 border-blue-500/10",
        zinc: "text-zinc-400 bg-zinc-500/5 border-zinc-500/10",
    };

    return (
        <div className={cn("p-2 rounded-lg border flex flex-col gap-1 transition-colors", colorClasses[color])}>
            <div className="flex items-center gap-1.5 opacity-60">
                {icon}
                <span className="text-[8px] font-bold uppercase tracking-tighter whitespace-nowrap">{label}</span>
            </div>
            <div className="text-sm font-mono font-bold flex items-baseline gap-1">
                {value}
                <span className="text-[8px] font-normal uppercase opacity-40">{unit}</span>
            </div>
        </div>
    );
};
