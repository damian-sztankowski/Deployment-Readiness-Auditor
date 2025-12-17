import React from 'react';
import { Github, Linkedin, ExternalLink, Cpu, Globe, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Top Energy Line - Animated Gradient */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 dark:opacity-30"></div>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-gradient bg-300% opacity-30"></div>

      <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            
            {/* Column 1: Brand & Status */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 group cursor-default">
                <Logo size="sm" className="group-hover:scale-110 transition-transform duration-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tighter text-slate-900 dark:text-white">
                    AUDITOR<span className="text-indigo-500">.</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Infrastructure Integrity
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Engine: Gemini 2.5 Pro (Active)
                </span>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
                Real-time architectural compliance and risk mitigation for modern Google Cloud deployments.
              </p>
            </div>

            {/* Column 2: Center - AI Badge & Credits */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 shadow-sm">
                  <Cpu className="w-5 h-5 text-indigo-500 animate-float" />
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Powered By</p>
                    <p className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      Google GenAI SDK
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">
                Built for architects by architects
              </p>
            </div>

            {/* Column 3: Links & Socials */}
            <div className="flex flex-col items-start md:items-end space-y-6">
              <div className="flex items-center gap-4">
                 <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
                   className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 shadow-sm hover:scale-110">
                    <Github className="w-5 h-5" />
                 </a>
                 <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                   className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 shadow-sm hover:scale-110">
                    <Linkedin className="w-5 h-5" />
                 </a>
                 <a href="https://docs.cloud.google.com/architecture/framework" target="_blank" rel="noopener noreferrer"
                   className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 shadow-sm hover:scale-110"
                   title="GCP Architecture Framework">
                    <Globe className="w-5 h-5" />
                 </a>
              </div>

              <nav className="flex flex-col items-start md:items-end gap-3">
                 <a href="https://docs.cloud.google.com/architecture/framework" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
                   Architecture Framework
                   <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                 </a>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Zero-Trust Analysis Protocol
                 </div>
              </nav>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              © 2025 DRA AUDITOR / MIT LICENSE
            </div>
            <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    Privacy Focused
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    No Data Persistence
                </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};