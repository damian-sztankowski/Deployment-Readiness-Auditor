
import React, { useRef, useState } from 'react';
import { AuditResult, Severity } from '../types';
import { ScoreCard } from './ScoreCard';
import { RiskCharts } from './RiskCharts';
import { FindingsList } from './FindingsList';
import { CostImpact } from './CostImpact';
import { FileBarChart2, Download, Calendar, Loader2, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  result: AuditResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ result }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingText, setLoadingText] = useState("Generating Report...");

  /**
   * Safe vector drawing for the logo in the PDF using standard jsPDF methods.
   */
  const drawLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    const angles = [0, 60, 120, 180, 240, 300];
    const pts = angles.map(a => {
      const rad = (a * Math.PI) / 180;
      return [x + r * Math.cos(rad), y + r * Math.sin(rad)];
    });

    const relativeLines: [number, number][] = [];
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      relativeLines.push([next[0] - pts[i][0], next[1] - pts[i][1]]);
    }

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.1);
    doc.setFillColor(255, 255, 255, 0.1); 
    doc.lines(relativeLines, pts[0][0], pts[0][1], [1, 1], 'F', true);

    // Main Shield Line
    doc.setLineWidth(0.8);
    doc.setDrawColor(255, 255, 255);
    doc.line(x - r / 2, y - r / 3, x, y + r / 2);
    doc.line(x, y + r / 2, x + r / 2, y - r / 3);
    doc.line(x - r / 2, y - r / 3, x + r / 2, y - r / 3);
    
    // Zap Accent
    doc.setLineWidth(0.4);
    doc.setDrawColor(245, 158, 11); // Amber 500
    doc.line(x - r / 6, y - r / 6, x + r / 6, y);
    doc.line(x + r / 6, y, x - r / 6, y + r / 6);
  };

  const handleExportPDF = async () => {
    const funnyPhrases = [
      "Summoning PDF...",
      "Reticulating Splines...",
      "Compressing Clouds...",
      "Adding Sparkles...",
      "Polishing Pixels...",
      "Feeding Hamsters...",
      "Converting to Paper...",
      "Applying Magic..."
    ];
    setLoadingText(funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)]);
    setIsExporting(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const colors = {
        primary: [79, 70, 229] as [number, number, number],
        secondary: [15, 23, 42] as [number, number, number],
        text: [51, 65, 85] as [number, number, number],
        muted: [100, 116, 139] as [number, number, number],
        lightBg: [248, 250, 252] as [number, number, number],
      };

      const captureComponent = async (elementId: string): Promise<string | null> => {
        const element = document.getElementById(elementId);
        if (!element) return null;
        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              clonedDoc.documentElement.classList.remove('dark');
            }
          });
          return canvas.toDataURL('image/png');
        } catch (e) {
          return null;
        }
      };

      // --- HEADER ---
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      drawLogo(doc, margin + 5, 22, 14);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Readiness Audit Report", margin + 18, 24);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(199, 210, 254);
      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      doc.text(`Generated: ${dateStr}`, margin + 18, 31);
      doc.text("Architecture Framework Compliance Audit", margin + 18, 36);

      let currentY = 60;

      // --- SUMMARY ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...colors.secondary);
      doc.text("Executive Summary", margin, currentY);
      currentY += 8;
      
      doc.setFillColor(...colors.lightBg);
      doc.roundedRect(margin, currentY, contentWidth, 35, 2, 2, 'F');
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 10);
      doc.text(summaryLines, margin + 5, currentY + 8);
      currentY += 45;

      const scoreImg = await captureComponent('score-pie-chart');
      if (scoreImg) {
        doc.addImage(scoreImg, 'PNG', margin, currentY, (contentWidth - 10) / 2, 50);
      }

      // --- FINDINGS TABLE ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...colors.secondary);
      doc.text("Detailed Assessment", margin, currentY + 60);

      const tableRows = result.findings.map(f => [
        f.severity.toUpperCase(),
        f.category,
        `${f.title}\n\n${f.description}\n\nACTION: ${f.remediation}`
      ]);

      autoTable(doc, {
        startY: currentY + 66,
        head: [['Severity', 'Pillar', 'Finding & Action Plan']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: colors.secondary },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 35 } }
      });

      doc.save(`DRA_Audit_Report_${Date.now()}.pdf`);

    } catch (error) {
      console.error("PDF Export Failed:", error);
      alert("PDF generation failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="space-y-8 lg:space-y-12 animate-enter bg-slate-50 dark:bg-slate-950/20 p-6 md:p-12 rounded-[2.5rem] transition-all duration-300 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-indigo-500/5">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Audit Summary Report</h2>
            </div>
            <div className="flex items-center gap-6 text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="hidden sm:inline-block w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Architecture Integrity Verified</span>
            </div>
        </div>
        <div className="no-print">
            <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`
                    relative flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black transition-all duration-200 shadow-xl shadow-indigo-500/30
                    ${isExporting ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}
                `}
            >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? loadingText : "Download Full Audit"}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="xl:col-span-5 h-full">
             <ScoreCard findings={result.findings} summary={result.summary} />
        </div>
        <div className="xl:col-span-7 h-full">
            <RiskCharts categories={result.categories} />
        </div>
      </div>

      <div className="w-full">
        <CostImpact findings={result.findings} />
      </div>

      <div className="w-full mt-4">
         <FindingsList findings={result.findings} />
      </div>
    </div>
  );
};
