import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Activity, Play, X } from 'lucide-react';
import { Logo } from './Logo';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 relative overflow-hidden">
        
        {/* Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-10">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-12">
                <div className="relative flex items-center justify-center">
                    {/* The Master Logo (now includes orbiting elements) */}
                    <Logo 
                        size="xl" 
                        animate={true}
                        className="transform transition-transform duration-700 hover:scale-110" 
                    />
                </div>
            </div>

            {/* Hero Typography */}
            <div className="space-y-6 animate-enter">
                <div className="inline-block relative group">
                    <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 dark:bg-slate-900 border border-indigo-500/30 text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl">
                        Enterprise Audit Intelligence
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9] pt-4">
                    Deployment Readiness <br/>
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent bg-300% animate-gradient">
                        Auditor
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                    Analyze architectural integrity against the 
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mx-2">Google Cloud Framework</span> 
                    using advanced AI semantics.
                </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-enter pt-8 flex flex-col sm:flex-row items-center justify-center gap-6" style={{ animationDelay: '0.2s' }}>
                
                {/* Primary Action */}
                <div className="relative group inline-block w-full sm:w-auto">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500 animate-gradient bg-300%"></div>
                    <button 
                        onClick={onStart}
                        className="relative w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-indigo-600 text-white rounded-full text-xl font-black tracking-tight shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-95"
                    >
                        Scan Infrastructure
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>

                {/* Secondary Action */}
                <button 
                    onClick={() => setIsVideoOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-2xl text-slate-700 dark:text-slate-200 rounded-full text-xl font-bold border border-slate-200/50 dark:border-white/10 transition-all duration-300 group"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                        <Play className="w-5 h-5 fill-current ml-1" />
                    </div>
                    Learn More
                </button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-12 animate-enter" style={{ animationDelay: '0.4s' }}>
                {[
                    { icon: ShieldCheck, text: "WAF Pillars", color: "text-indigo-400" },
                    { icon: Lock, text: "Compliance", color: "text-emerald-400" },
                    { icon: Activity, text: "FinOps Audit", color: "text-amber-400" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-xl border border-white/5 text-xs font-black text-slate-300 uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-colors">
                        <feature.icon className={`w-4 h-4 ${feature.color}`} />
                        {feature.text}
                    </div>
                ))}
            </div>
        </div>

        {/* Video Modal */}
        {isVideoOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                <div 
                    className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl transition-opacity" 
                    onClick={() => setIsVideoOpen(false)}
                />
                
                <div className="relative w-full max-w-6xl bg-black rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
                    <button 
                        onClick={() => setIsVideoOpen(false)}
                        className="absolute top-8 right-8 z-20 p-4 bg-white/10 hover:bg-red-500 text-white rounded-2xl backdrop-blur-xl transition-all duration-300 group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                    
                    <div className="aspect-video w-full">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src="https://www.youtube.com/embed/l-hC0d5Fz54?autoplay=1&rel=0&modestbranding=1" 
                            title="Google Cloud Architecture Framework Video"
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};