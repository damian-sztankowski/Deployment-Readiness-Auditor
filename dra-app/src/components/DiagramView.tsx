import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize, Minimize, RefreshCcw, X } from 'lucide-react';

interface DiagramViewProps {
  code: string;
}

export const DiagramView: React.FC<DiagramViewProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Watch for theme changes to re-render diagram with correct colors
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    // Initial check
    checkTheme();

    // Observer for class changes on html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;
      
      try {
        // Initialize mermaid with rich styling matching the app theme
        mermaid.initialize({ 
          startOnLoad: false,
          theme: 'base',
          flowchart: {
            curve: 'basis', // Smooth, organic curves
            padding: 20,
            htmlLabels: true,
          },
          themeVariables: isDark ? {
             // Dark Mode Palette
             primaryColor: '#1e293b', // Slate 800 (Node Bg)
             primaryTextColor: '#f8fafc', // Slate 50
             primaryBorderColor: '#6366f1', // Indigo 500
             lineColor: '#94a3b8', // Slate 400
             secondaryColor: '#020617', // Slate 950 (Cluster Bg)
             tertiaryColor: '#1e293b',
             fontFamily: 'Inter, sans-serif',
             fontSize: '14px',
          } : {
             // Light Mode Palette
             primaryColor: '#ffffff',
             primaryTextColor: '#1e293b', // Slate 800
             primaryBorderColor: '#4f46e5', // Indigo 600
             lineColor: '#64748b', // Slate 500
             secondaryColor: '#f8fafc', // Slate 50 (Cluster Bg)
             tertiaryColor: '#ffffff',
             fontFamily: 'Inter, sans-serif',
             fontSize: '14px',
          },
          securityLevel: 'loose',
        });

        // SANITIZATION:
        // 1. Replace HTML <br> tags with \n to avoid parse errors
        // 2. Remove any remaining HTML tags inside brackets that might confuse parser
        // 3. Remove FontAwesome syntax
        // 4. Strip markdown code blocks
        let cleanCode = code
            .replace(/<br\s*\/?>/gi, '\n') 
            .replace(/<[^>]*>/g, '')      
            .replace(/fa:[a-z0-9-]+/gi, '') 
            .replace(/```mermaid/g, '')   
            .replace(/```/g, '')
            .trim();

        // Generate unique ID for this render to avoid conflicts
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, cleanCode);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError("Failed to render architecture diagram. The syntax returned by AI was invalid.");
      }
    };

    renderDiagram();
  }, [code, isDark]); // Re-render on code change OR theme change

  // Reset zoom when toggling maximize
  useEffect(() => {
    setZoom(1);
  }, [isMaximized]);

  // Controls Component for reuse
  const ZoomControls = () => (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors" title="Zoom Out">
        <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-10 text-center text-slate-500 dark:text-slate-400 select-none">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors" title="Zoom In">
        <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors ml-1 border-l border-slate-200 dark:border-slate-700 pl-2" title="Reset Zoom">
        <RefreshCcw className="w-3.5 h-3.5" />
        </button>
    </div>
  );

  return (
    <>
        {/* Inline Card View */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col h-full relative overflow-hidden transition-colors">
            <div className="flex justify-between items-center mb-4 z-10">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Infrastructure Map
                    <span className="text-[10px] font-normal px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800">
                        Generated
                    </span>
                </h3>
                
                <div className="flex items-center gap-2">
                    <ZoomControls />
                    <button 
                        onClick={() => setIsMaximized(true)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Expand Diagram"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div 
                ref={containerRef}
                className="flex-1 w-full overflow-auto bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center relative min-h-[300px]"
            >
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none"></div>

                {error ? (
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2 p-4 text-center">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Maximize className="w-6 h-6 opacity-50" />
                    </div>
                    <p>{error}</p>
                </div>
                ) : svgContent ? (
                <div 
                    className="transition-transform duration-200 ease-out origin-center p-4"
                    style={{ transform: `scale(${zoom})` }}
                    dangerouslySetInnerHTML={{ __html: svgContent }} 
                />
                ) : (
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                )}
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                AI-generated representation. Click expand for details.
            </p>
        </div>

        {/* Maximized Modal View */}
        {isMaximized && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm"
                    onClick={() => setIsMaximized(false)}
                />

                {/* Modal Content */}
                <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Infrastructure Map</h3>
                        <div className="flex items-center gap-4">
                            <ZoomControls />
                            <button 
                                onClick={() => setIsMaximized(false)}
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-black/40 relative">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                        
                        {svgContent && (
                            <div 
                                className="transition-transform duration-200 ease-out origin-center p-12"
                                style={{ transform: `scale(${zoom})` }}
                                dangerouslySetInnerHTML={{ __html: svgContent }} 
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
    </>
  );
};