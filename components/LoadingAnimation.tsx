import React, { useState, useEffect } from 'react';
import { Bot, Search, Zap, Cloud, Terminal } from 'lucide-react';

const FUNNY_MESSAGES = [
  "Convincing the AI to be nice...",
  "Parsing your infrastructure spaghetti...",
  "Checking if you accidentally leaked your API key...",
  "Consulting the Council of Cloud Architects...",
  "Reticulating splines...",
  "Double-checking the firewall rules...",
  "Reading the documentation (so you don't have to)...",
  "Searching for 10x engineer secrets...",
  "Optimizing for maximum aesthetic...",
  "Applying patches to the matrix...",
  "Ensuring the buckets aren't leaking...",
  "Verifying you aren't mining crypto...",
  "Counting the number of nines in your reliability...",
  "Asking the rubber duck for a second opinion...",
  "Compressing the cloud to fit in your browser...",
  "Defragmenting the flux capacitor..."
];

export const LoadingAnimation: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Randomize start message
    setMessageIndex(Math.floor(Math.random() * FUNNY_MESSAGES.length));

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-500 w-full overflow-hidden">
      <div className="relative mb-6 group">
        {/* Glowing Background with rotating gradient - Reduced size */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        
        {/* Main Card - Compact padding */}
        <div className="relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-lg shadow-indigo-500/10 border border-indigo-50 dark:border-indigo-900 flex items-center justify-center z-10">
            {/* Bouncing Bot - Smaller Icon */}
            <div className="relative">
                <Bot className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-bounce" strokeWidth={1.5} style={{ animationDuration: '1.5s' }} />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-black/10 dark:bg-white/10 rounded-[100%] blur-sm animate-pulse" style={{ animationDuration: '1.5s' }}></div>
            </div>
            
            {/* Orbiting Elements - Satellites - Tighter orbit */}
            <div className="absolute -top-3 -right-3 animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.2s' }}>
                 <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-md border border-amber-100 dark:border-amber-900/30 rotate-12">
                    <Zap className="w-4 h-4 text-amber-400 fill-current" />
                 </div>
            </div>
             <div className="absolute -bottom-3 -left-3 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s'}}>
                 <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-md border border-emerald-100 dark:border-emerald-900/30 -rotate-12">
                    <Search className="w-4 h-4 text-emerald-400" />
                 </div>
            </div>
            
            {/* Floating Cloud Elements - Smaller */}
            <div className="absolute top-1/2 -right-10 animate-pulse" style={{ animationDuration: '3s' }}>
                 <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-80">
                    <Cloud className="w-4 h-4 text-sky-400" />
                 </div>
            </div>
            <div className="absolute top-0 -left-8 animate-pulse" style={{ animationDuration: '4s' }}>
                 <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-60">
                    <Terminal className="w-3 h-3 text-slate-400" />
                 </div>
            </div>
        </div>
      </div>
      
      {/* Text Content */}
      <div className="text-center space-y-2 max-w-lg px-4">
        <div className="h-8 flex items-center justify-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-all duration-300 transform key={messageIndex}">
                {FUNNY_MESSAGES[messageIndex]}
            </h3>
        </div>
        
        <div className="flex items-center justify-center gap-2">
             <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></div>
            </div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Auditing</span>
        </div>
      </div>
    </div>
  );
};