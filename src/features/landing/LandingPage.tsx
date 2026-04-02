import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Zap, Cpu, History, ChevronRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-black">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Activity size={18} className="text-zinc-950" strokeWidth={2.5} />
                        </div>
                        <span className="font-bold tracking-tighter text-xl">TradeGrid</span>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Left: Text */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] uppercase font-black tracking-widest mb-6 translate-y-0 animate-in fade-in duration-700 slide-in-from-bottom-2">
                            <Zap size={12} fill="currentColor" />
                            Next-Generation Rendering
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.9] text-zinc-50 drop-shadow-2xl">
                            The Institutional <br />
                            <span className="text-amber-500/90 italic">Data Engine.</span>
                        </h1>
                        <p className="text-lg text-zinc-400 mb-10 max-w-lg leading-relaxed">
                            Visualize high-frequency market data at <span className="text-zinc-100 font-bold">60fps</span> with sub-millisecond 
                            MessagePack binary ingestion. Built for the modern quantitative analyst.
                        </p>
                        
                        <div className="flex items-center gap-6">
                            <Link 
                                to="/dashboard" 
                                className="group flex items-center gap-3 bg-zinc-100 text-zinc-950 px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all shadow-xl hover:shadow-zinc-100/10"
                            >
                                Launch Terminal
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <span className="text-zinc-600 font-mono text-sm border-l border-zinc-800 pl-6">
                                v1.0.4 <br /> Stable Release
                            </span>
                        </div>
                    </div>

                    {/* Right: Mock UI Visualization */}
                    <div className="relative group">
                        <div className="absolute -inset-10 bg-amber-500/10 blur-[100px] rounded-full group-hover:bg-amber-500/20 transition-all duration-1000" />
                        <div className="relative glass rounded-2xl overflow-hidden border border-zinc-800/50 shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-700">
                            <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                                </div>
                                <div className="mx-auto text-[10px] text-zinc-500 font-mono font-bold tracking-widest uppercase opacity-50">TradeGrid-Terminal</div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex gap-4">
                                    <div className="h-32 flex-1 bg-zinc-950/50 rounded-lg border border-zinc-800/50 flex items-end p-2 gap-1 overflow-hidden">
                                        {[40, 20, 60, 80, 50, 90, 70].map((h, i) => (
                                            <div key={i} className="flex-1 bg-amber-500/30 rounded-full" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                    <div className="h-32 w-1/3 bg-zinc-950/50 rounded-lg border border-zinc-800/50" />
                                </div>
                                <div className="h-40 bg-zinc-950/50 rounded-lg border border-zinc-800/50 p-4 font-mono text-[10px] text-zinc-600">
                                    <div>Ingestion: 52,142 EPS</div>
                                    <div className="text-zinc-500">Pipeline: MessagePack (Binary)</div>
                                    <div className="text-zinc-500 mt-2">Buffer: [####################] 100%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-40">
                    <Card 
                        icon={<Cpu className="text-amber-500" />} 
                        title="Low Latency Ingestion" 
                        desc="Web Worker based pipeline decoupling UI thread from binary data stream decoding." 
                    />
                    <Card 
                        icon={<History className="text-amber-500" />} 
                        title="Historical Replay" 
                        desc="Advanced playback toolkit to scrub through millions of market events with zero lag." 
                    />
                    <Card 
                        icon={<Activity className="text-amber-500" />} 
                        title="Heatmap Clustering" 
                        desc="Identify liquidity walls using custom treemap algorithms and canvas-based depth maps." 
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-zinc-900 text-center">
                <p className="text-zinc-600 text-sm font-mono tracking-widest uppercase">
                    &copy; 2026 TradeGrid Terminal. All rights reserved. 
                </p>
            </footer>
        </div>
    );
};

const Card: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="glass p-8 rounded-2xl group hover:border-amber-500/30 transition-all duration-300">
        <div className="p-3 bg-zinc-950 rounded-xl inline-flex mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-zinc-500 leading-relaxed text-sm">{desc}</p>
    </div>
);
