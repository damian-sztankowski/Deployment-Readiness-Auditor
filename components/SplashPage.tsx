import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Activity, Play, X } from 'lucide-react';
import { Logo } from './Logo';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 relative">
        
        {/* Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-10">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-4">
                <div className="relative group cursor-default animate-float">
                    <Logo size="xl" className="transform transition-transform duration-700 hover:rotate-6" />
                    
                    {/* Floating Orbiting Badges */}
                    <div className="absolute -right-8 -top-4 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce" style={{ animationDuration: '3s' }}>
                        <Lock className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="absolute -left-8 -bottom-4 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                        <Activity className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Hero Typography */}
            <div className="space-y-6 animate-enter">
                <div className="inline-block">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
                        Enterprise Audit Intelligence
                    </span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.95]">
                    Deployment Readiness <br/>
                    <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent bg-300% animate-gradient">
                        Auditor
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                    Automated pre-deployment risk analysis. Align with the 
                    <span className="text-indigo-900 dark:text-indigo-300 font-bold mx-1 underline decoration-indigo-500/30">Google Cloud Architecture Framework</span> 
                    using advanced AI semantics.
                </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-enter pt-4 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: '0.2s' }}>
                
                {/* Primary Action */}
                <div className="relative group inline-block w-full sm:w-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200 animate-gradient bg-300%"></div>
                    <button 
                        onClick={onStart}
                        className="relative w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-lg font-black tracking-wide shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-95"
                    >
                        Scan Infrastructure
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Secondary Action - Watch Demo */}
                <button 
                    onClick={() => setIsVideoOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm text-slate-700 dark:text-slate-200 rounded-full text-lg font-bold border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    Learn More
                </button>
            </div>

             <p className="mt-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] animate-enter" style={{ animationDelay: '0.3s' }}>
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 max-w-2xl mx-auto animate-enter" style={{ animationDelay: '0.4s' }}>
                {[
                    { icon: ShieldCheck, text: "Compliance Check" },
                    { icon: Lock, text: "Security Posture" },
                    { icon: Activity, text: "Cost Optimization" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-default">
                        <feature.icon className="w-4 h-4 text-indigo-500" />
                        {feature.text}
                    </div>
                ))}
            </div>
        </div>

        {/* Video Modal */}
        {isVideoOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" 
                    onClick={() => setIsVideoOpen(false)}
                />
                
                {/* Modal Content */}
                <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-300">
                    <button 
                        onClick={() => setIsVideoOpen(false)}
                        className="absolute top-6 right-6 z-10 p-3 bg-black/50 hover:bg-indigo-600 text-white rounded-full backdrop-blur-sm transition-all duration-200 group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                    
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
        )}
    </div>
  );
};