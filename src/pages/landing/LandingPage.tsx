import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Cpu, Play, BarChart2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg-base text-text-primary selection:bg-accent/30 selection:text-white overflow-x-hidden font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-emerald-400 flex items-center justify-center font-bold text-bg-base">T</div>
                        <span className="font-bold text-lg tracking-tight">TradeGrid</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                        <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
                        <a href="#architecture" className="hover:text-text-primary transition-colors">Architecture</a>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Launch App</Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 container mx-auto">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-block animate-fade-in-up">
                        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent border border-accent/20 rounded-full bg-accent/5">
                            Enterprise-Grade Trading Dashboard
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        High-Frequency Market Intelligence.
                    </h1>
                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        Experience frictionless streaming analytics with 50,000+ events per second. Built with Web Workers, Canvas API, and zero React rendering bottlenecks.
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <Button size="lg" className="h-12 px-8 text-base group" onClick={() => navigate('/dashboard')}>
                            Enter Dashboard 
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <a href="https://github.com/Jabirmahmud0/tradegrid" target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center rounded-md border border-border-subtle bg-bg-surface px-8 text-base font-medium text-text-primary hover:bg-zinc-800 transition-colors">
                            View on GitHub
                        </a>
                    </div>
                </div>

                {/* Dashboard Preview Presentation */}
                <div className="mt-20 relative mx-auto max-w-6xl animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-emerald-500/20 blur-3xl -z-10 rounded-[3rem] opacity-50"></div>
                    <div className="rounded-2xl border border-zinc-800 bg-bg-surface/50 p-2 shadow-2xl backdrop-blur-sm">
                        <div className="rounded-xl border border-zinc-900 bg-bg-base aspect-[16/9] overflow-hidden relative flex items-center justify-center group cursor-pointer" onClick={() => navigate('/dashboard')}>
                            {/* Generic placeholder logic for screenshot / mock dashboard */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CgkJPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPgoJPC9zdmc+')] opacity-50 mix-blend-screen pointer-events-none"></div>
                            
                            <div className="text-center space-y-4 relative z-10 transition-transform group-hover:scale-110 duration-500 ease-out">
                                <Activity className="w-16 h-16 mx-auto text-accent opacity-80" />
                                <div className="text-xl font-medium tracking-wide text-zinc-300">Live Trading Terminal</div>
                            </div>

                            {/* Faux panels */}
                            <div className="absolute top-4 left-4 right-[30%] bottom-4 border border-zinc-800/50 rounded-lg bg-zinc-950/50 backdrop-blur-md opacity-20"></div>
                            <div className="absolute top-4 right-4 w-[28%] bottom-[40%] border border-zinc-800/50 rounded-lg bg-zinc-950/50 backdrop-blur-md opacity-20"></div>
                            <div className="absolute bottom-4 right-4 w-[28%] h-[35%] border border-zinc-800/50 rounded-lg bg-zinc-950/50 backdrop-blur-md opacity-20"></div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="py-24 bg-bg-surface border-y border-border-subtle">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight">Built for Institutional Performance</h2>
                        <p className="text-text-secondary mt-4">Designed to bypass modern web framework limitations.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <FeatureCard 
                            title="Web Worker Pipeline" 
                            description="Market data serialization and coalescing executes on a separate thread via MessagePack to ensure the main UI thread never blocks."
                            icon={<Cpu className="w-6 h-6 text-emerald-400" />} 
                        />
                        <FeatureCard 
                            title="Canvas Native Charts" 
                            description="Heavy DOM manipulations are bypassed in favor of direct HTML5 Canvas API draw commands for candlesticks, depth maps, and heatmaps."
                            icon={<BarChart2 className="w-6 h-6 text-accent" />} 
                        />
                        <FeatureCard 
                            title="Time-Travel Replay" 
                            description="Deterministic session playback with localized random seeds and variable speed controls stretching from 0.5x to 100x speeds."
                            icon={<Play className="w-6 h-6 text-purple-400" />} 
                        />
                    </div>
                </div>
            </section>
            
            {/* Tech Stack Banner */}
            <section id="architecture" className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="text-lg font-medium text-zinc-400 mb-8 uppercase tracking-widest text-sm">Tech Stack</h3>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Mocks */}
                        <TechBadge name="React 19" />
                        <TechBadge name="Vite" />
                        <TechBadge name="Zustand" />
                        <TechBadge name="Tailwind CSS" />
                        <TechBadge name="D3.js & Visx" />
                        <TechBadge name="WebSockets" />
                        <TechBadge name="Node.js" />
                    </div>
                </div>
            </section>
            
            <footer className="border-t border-border-subtle py-8 text-center text-sm text-text-tertiary bg-bg-surface">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
                    <div>© {new Date().getFullYear()} TradeGrid. Designed for extreme performance.</div>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a href="https://github.com/Jabirmahmud0/tradegrid" className="hover:text-text-primary transition-colors">GitHub</a>
                        <a href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-bg-base border border-border-subtle p-8 rounded-2xl hover:border-zinc-700 transition-colors group">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:bg-zinc-800 transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
);

const TechBadge = ({ name }: { name: string }) => (
    <div className="text-xl font-bold tracking-tight text-zinc-300">
        {name}
    </div>
);
