import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize, RefreshCcw } from 'lucide-react';
import { ModalDialog } from './ModalDialog';

interface DiagramViewProps {
  code: string;
}

const DISALLOWED_SVG_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'foreignobject',
  'audio',
  'video',
  'canvas'
]);

/**
 * Parses SVG via DOMParser and strips any executable elements, event handlers (`on*`),
 * or unsafe `javascript:` / `data:text/html` URIs before mounting DOM nodes directly
 * via `replaceChildren()` (preventing innerHTML mXSS per modern-web-guidance `sanitize-untrusted-html`).
 */
const mountSanitizedSvg = (target: HTMLElement | null, rawSvg: string) => {
  if (!target) return;
  if (!rawSvg) {
    target.replaceChildren();
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const svgEl = doc.documentElement;
  if (!svgEl || svgEl.nodeName.toLowerCase() !== 'svg') {
    target.replaceChildren();
    return;
  }

  const walker = doc.createTreeWalker(svgEl, NodeFilter.SHOW_ELEMENT);
  const toRemove: Element[] = [];

  let current: Element | null = svgEl;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (DISALLOWED_SVG_TAGS.has(tag)) {
      toRemove.push(current);
    } else {
      for (const attr of Array.from(current.attributes)) {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();
        if (
          name.startsWith('on') ||
          ((name === 'href' || name === 'xlink:href' || name === 'src') &&
            (val.startsWith('javascript:') || val.startsWith('data:text/html')))
        ) {
          current.removeAttribute(attr.name);
        }
      }
    }
    current = walker.nextNode() as Element | null;
  }

  toRemove.forEach((n) => n.remove());
  target.replaceChildren(document.importNode(svgEl, true));
};

export const DiagramView: React.FC<DiagramViewProps> = ({ code }) => {
  const inlineSvgRef = useRef<HTMLDivElement>(null);
  const modalSvgRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const renderDiagram = async () => {
      if (!code) return;
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'strict',
          flowchart: {
            curve: 'basis',
            padding: 20,
            htmlLabels: false
          },
          themeVariables: isDark
            ? {
                primaryColor: '#1e293b',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#6366f1',
                lineColor: '#94a3b8',
                secondaryColor: '#020617',
                tertiaryColor: '#1e293b',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }
            : {
                primaryColor: '#ffffff',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#4f46e5',
                lineColor: '#64748b',
                secondaryColor: '#f8fafc',
                tertiaryColor: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }
        });

        const cleanCode = code
          .replace(/<br\s*\/?>/gi, '\\n')
          .replace(/<[^>]*>/g, '')
          .replace(/fa:[a-z0-9-]+/gi, '')
          .replace(/```mermaid/gi, '')
          .replace(/```/g, '')
          .trim();

        const { svg } = await mermaid.render(id, cleanCode);
        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        try {
          document.getElementById(`d${id}`)?.remove();
        } catch {
          // ignore
        }
        if (!cancelled) {
          setError('Unable to render architecture diagram.');
        }
      }
    };

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, isDark]);

  useEffect(() => {
    mountSanitizedSvg(inlineSvgRef.current, svgContent);
  }, [svgContent]);

  useEffect(() => {
    if (isMaximized) {
      mountSanitizedSvg(modalSvgRef.current, svgContent);
    }
  }, [isMaximized, svgContent]);

  useEffect(() => {
    setZoom(1);
  }, [isMaximized]);

  const ZoomControls = () => (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
        aria-label="Zoom out diagram"
      >
        <ZoomOut className="w-4 h-4" aria-hidden="true" />
      </button>
      <span className="text-xs font-mono w-10 text-center text-slate-500 dark:text-slate-400 select-none">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
        aria-label="Zoom in diagram"
      >
        <ZoomIn className="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setZoom(1)}
        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors ml-1 border-l border-slate-200 dark:border-slate-700 pl-2"
        aria-label="Reset diagram zoom"
      >
        <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col h-full relative overflow-hidden transition-colors">
        <div className="flex justify-between items-center mb-4 z-10">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Infrastructure Topology Map
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800">
              Strict Sanitized SVG
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <ZoomControls />
            <button
              type="button"
              onClick={() => setIsMaximized(true)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Expand topology diagram"
            >
              <Maximize className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full overflow-auto bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center relative min-h-[300px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

          {error ? (
            <div className="text-slate-400 text-sm flex flex-col items-center gap-2 p-4 text-center">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                <Maximize className="w-6 h-6 opacity-50" aria-hidden="true" />
              </div>
              <p>{error}</p>
            </div>
          ) : svgContent ? (
            <div
              ref={inlineSvgRef}
              role="img"
              aria-label="Generated cloud infrastructure dependency diagram"
              className="transition-transform duration-200 ease-out origin-center p-4"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
          Dependency & blast-radius graph rendered in strict security mode. Click expand for full-screen inspection.
        </p>
      </div>

      <ModalDialog
        isOpen={isMaximized}
        onClose={() => setIsMaximized(false)}
        title="Detailed Infrastructure Topology Map"
        subtitle="Zoom and inspect VPC boundaries, ingress paths, and flagged resources"
        maxWidthClass="max-w-6xl"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Press Esc or click outside the dialog to close.</span>
            <ZoomControls />
          </div>
        }
      >
        <div className="min-h-[60vh] overflow-auto flex items-center justify-center bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
          <div
            ref={modalSvgRef}
            role="img"
            aria-label="Expanded cloud infrastructure dependency diagram"
            className="transition-transform duration-200 ease-out origin-center p-8"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      </ModalDialog>
    </>
  );
};
