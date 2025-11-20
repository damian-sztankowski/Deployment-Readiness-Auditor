import React from 'react';
import { Hexagon, Zap, ShieldCheck, BarChart3, ArrowRight, Lock, Activity } from 'lucide-react';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
        
        {/* Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-10">
            
            {/* Logo / Icon Animation - Consistent Brand - Automated */}
            <div className="flex justify-center mb-4">
                <div className="relative group cursor-default animate-float">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse" />
                    
                    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-indigo-50 dark:border-indigo-900 ring-1 ring-slate-900/5 transform transition-transform duration-500 hover:scale-105">
                        {/* Large Brand Logo */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <Hexagon 
                                className="w-16 h-16 text-indigo-600 dark:text-indigo-500 fill-indigo-100/20 dark:fill-indigo-900/20 animate-spin-slow" 
                                strokeWidth={1.5} 
                            />
                            <div className="absolute flex items-center justify-center animate-wiggle">
                                <Zap 
                                    className="w-8 h-8 text-indigo-600 dark:text-indigo-400 drop-shadow-md" 
                                    strokeWidth={2.5} 
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Floating Orbiting Badges */}
                    <div className="absolute -right-6 -top-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 animate-bounce" style={{ animationDuration: '3s' }}>
                        <Lock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="absolute -left-6 -bottom-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                        <Activity className="w-5 h-5 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Hero Typography */}
            <div className="space-y-6 animate-enter">
                {/* Tool Name Badge */}
                <div className="inline-block">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                        Deployment Readiness Auditor
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                    Deploy with <br/>
                    <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent bg-300% animate-gradient">
                        Unshakable Confidence
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                    Your AI-powered architect. Instantly analyze infrastructure against the 
                    <span className="text-indigo-900 dark:text-indigo-300 font-bold mx-1">Google Cloud Architecture Framework</span> 
                    to detect risks and ensure compliance.
                </p>
            </div>

            {/* CTA Button with Glowing Animation */}
            <div className="animate-enter pt-4" style={{ animationDelay: '0.2s' }}>
                <div className="relative group inline-block">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200 animate-gradient bg-300%"></div>
                    <button 
                        onClick={onStart}
                        className="relative flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-lg font-bold tracking-wide shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    >
                        Start Assessment
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                <p className="mt-6 text-sm text-slate-400 font-medium">
                    Compatible with Terraform and Google Cloud Asset Inventory JSON
                </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 max-w-2xl mx-auto animate-enter" style={{ animationDelay: '0.4s' }}>
                {[
                    { icon: ShieldCheck, text: "Security Audits" },
                    { icon: Zap, text: "Performance Tuning" },
                    { icon: Activity, text: "Reliability Checks" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all cursor-default hover:-translate-y-0.5">
                        <feature.icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        {feature.text}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};