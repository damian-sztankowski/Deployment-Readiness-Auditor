
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Activity, X, Brain, Wand2, ChevronRight, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { Logo } from './Logo';

interface SplashPageProps {
  onStart: () => void;
  onRunDemo: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart, onRunDemo }) => {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const showcaseSteps = [
    {
      title: "Semantic Analysis",
      subtitle: "Beyond Basic Linting",
      description: "DRA doesn't just check for syntax. It uses Gemini's multi-modal intelligence to understand architectural intent, identifying risks that static analyzers miss.",
      icon: Brain,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      accent: "border-purple-500/20"
    },
    {
      title: "Cloud Frameworks",
      subtitle: "Official GCP Alignment",
      description: "Every audit is measured against the 5 pillars of the Google Cloud Well-Architected Framework: Security, Reliability, Cost, Operations, and Performance.",
      icon: ShieldCheck,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      accent: "border-indigo-500/20"
    },
    {
      title: "Compliance Mapping",
      subtitle: "Regulatory Guardrails",
      description: "Automatically map infrastructure flaws to international standards including CIS Benchmarks, NIST 800-53, GDPR, HIPAA, and SOC2.",
      icon: Lock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      accent: "border-emerald-500/20"
    },
    {
      title: "One-Click Fixes",
      subtitle: "Instant Remediation",
      description: "Don't just find problems—fix them. DRA generates production-ready Terraform (HCL) snippets to remediate every high-risk finding instantly.",
      icon: Wand2,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      accent: "border-amber-500/20"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 relative overflow-hidden bg-[#020617] transition-colors duration-700">
        
        {/* Optimized Background based on reference screenshot */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Base Dark Navy Layer */}
          <div className="absolute inset-0 bg-[#020617]"></div>
          
          {/* Central Radial Lightening - Lighter in the middle, darker on the sides */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(28,37,65,1)_0%,rgba(2,6,23,0)_75%)]"></div>

          {/* Subtly tinted central glow for branding */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] bg-indigo-600/5 rounded-full blur-[160px] animate-pulse"></div>

          {/* Precision Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.12]" style={{ 
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Edge Vingette to ensure darker sides */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(2,6,23,1)_100%)]"></div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-10">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-8">
                <div className="relative flex items-center justify-center">
                    <Logo 
                        size="xl" 
                        animate={true}
                        className="transform transition-transform duration-1000 scale-110" 
                    />
                </div>
            </div>

            {/* Hero Typography */}
            <div className="space-y-6 animate-enter">
                <div className="inline-block relative">
                    <span className="relative inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900/50 border border-slate-800/50 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl backdrop-blur-md">
                        Enterprise Audit Intelligence
                    </span>
                </div>

                <div className="space-y-0">
                  <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-white leading-[0.85]">
                    Deployment Readiness
                  </h1>
                  <h2 className="text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent leading-[0.85] bg-300% animate-gradient">
                    Auditor
                  </h2>
                </div>
                
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                    Analyze architectural integrity against the 
                    <span className="text-indigo-400 font-bold mx-2">Google Cloud Framework</span> 
                    using advanced AI semantics.
                </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-enter pt-12 flex flex-col md:flex-row items-center justify-center gap-6" style={{ animationDelay: '0.2s' }}>
                
                {/* Scan Infrastructure Button */}
                <div className="relative group">
                    <div className="absolute -inset-1.5 bg-indigo-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
                    <button 
                        onClick={onStart}
                        className="relative flex items-center justify-center gap-4 px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-lg font-black tracking-tight transition-all duration-300 active:scale-95 shadow-2xl border border-indigo-400/20"
                    >
                        Scan Infrastructure
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Interactive Showcase Button */}
                <button 
                    onClick={onRunDemo}
                    className="flex items-center justify-center gap-4 px-12 py-5 bg-slate-900/40 hover:bg-slate-800/60 text-white rounded-2xl text-lg font-black border border-slate-800/50 transition-all duration-300 group shadow-lg backdrop-blur-sm"
                >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    Interactive Showcase
                </button>

                {/* Learn More Button */}
                <button 
                    onClick={() => setIsLearnMoreOpen(true)}
                    className="flex items-center justify-center gap-4 px-10 py-5 bg-transparent hover:bg-white/5 text-slate-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] border border-slate-800/50 transition-all group"
                >
                    <HelpCircle className="w-5 h-5 opacity-60 group-hover:opacity-100" />
                    Learn More
                </button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-16 animate-enter" style={{ animationDelay: '0.4s' }}>
                {[
                    { icon: ShieldCheck, text: "WAF PILLARS", color: "text-indigo-400" },
                    { icon: Lock, text: "COMPLIANCE", color: "text-emerald-400" },
                    { icon: Activity, text: "FINOPS AUDIT", color: "text-amber-400" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 px-8 py-3 rounded-xl bg-slate-900/60 border border-slate-800/50 text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-default hover:bg-slate-800/80 transition-colors shadow-2xl backdrop-blur-sm">
                        <feature.icon className={`w-3.5 h-3.5 ${feature.color} opacity-80`} />
                        {feature.text}
                    </div>
                ))}
            </div>
        </div>

        {/* Learn More Modal */}
        {isLearnMoreOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                <div 
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
                    onClick={() => setIsLearnMoreOpen(false)}
                />
                
                <div className="relative w-full max-w-5xl bg-slate-900 rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[500px]">
                    <button 
                        onClick={() => setIsLearnMoreOpen(false)}
                        className="absolute top-8 right-8 z-20 p-4 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-2xl transition-all duration-300 group shadow-lg"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                    
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-80 bg-slate-950 p-10 border-b md:border-b-0 md:border-r border-slate-800 space-y-6">
                        <div className="mb-10">
                           <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Core Protocol</h3>
                           <p className="text-2xl font-black text-white">Audit Pillars</p>
                        </div>
                        <div className="space-y-3">
                            {showcaseSteps.map((step, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveStep(i)}
                                    className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all text-left group/nav
                                        ${activeStep === i 
                                            ? 'bg-slate-900 shadow-2xl border border-slate-800' 
                                            : 'hover:bg-slate-900/40 text-slate-500'}
                                    `}
                                >
                                    <div className={`p-3 rounded-xl transition-colors ${activeStep === i ? step.bg + ' ' + step.color : 'bg-slate-800'}`}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-tight ${activeStep === i ? 'text-white' : 'text-slate-500'}`}>
                                        {step.title}
                                    </span>
                                    {activeStep === i && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-12 md:p-20 flex flex-col justify-center relative overflow-hidden bg-slate-900">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                        
                        <div key={activeStep} className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                            <div className={`w-24 h-24 rounded-3xl ${showcaseSteps[activeStep].bg} ${showcaseSteps[activeStep].color} flex items-center justify-center border ${showcaseSteps[activeStep].accent} shadow-2xl`}>
                                {React.createElement(showcaseSteps[activeStep].icon, { className: "w-12 h-12" })}
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-[0.3em] mb-3 ${showcaseSteps[activeStep].color}`}>
                                        {showcaseSteps[activeStep].subtitle}
                                    </h4>
                                    <h3 className="text-5xl font-black text-white tracking-tighter leading-none">
                                        {showcaseSteps[activeStep].title}
                                    </h3>
                                </div>
                                <p className="text-slate-400 text-xl leading-relaxed max-w-lg font-medium">
                                    {showcaseSteps[activeStep].description}
                                </p>
                            </div>

                            <div className="pt-6 flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Production Ready
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    AI Sovereignty
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 flex items-center justify-between">
                             <div className="flex gap-2">
                                {showcaseSteps.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-2 rounded-full transition-all duration-500 ${activeStep === i ? 'w-10 bg-indigo-500' : 'w-2 bg-slate-800'}`} 
                                    />
                                ))}
                             </div>
                             <button 
                                onClick={onStart}
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-base font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/30"
                             >
                                Get Started
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
