
import React, { useRef, useState } from 'react';
import { AuditResult, Severity } from '../types';
import { ScoreCard } from './ScoreCard';
import { RiskCharts } from './RiskCharts';
import { FindingsList } from './FindingsList';
import { CostImpact } from './CostImpact';
import { Download, Calendar, Loader2, ShieldCheck, Share2 } from 'lucide-react';
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

  const drawLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    const angles = [0, 60, 120, 180, 240, 300];
    const pts = angles.map(a => {
      const rad = (a * Math.PI) / 180;
      return [x + r * Math.cos(rad), y + r * Math.sin(rad)];
    });
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.setFillColor(79, 70, 229);
    const relativeLines: [number, number][] = pts.map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      return [next[0] - p[0], next[1] - p[1]];
    });
    doc.lines(relativeLines, pts[0][0], pts[0][1], [1, 1], 'FD', true);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(x - r / 2.5, y - r / 4, x, y + r / 2);
    doc.line(x, y + r / 2, x + r / 2.5, y - r / 4);
  };

  const handleExportPDF = async () => {
    setLoadingText("Compiling Professional Audit Brief...");
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const theme = {
        primary: [79, 70, 229] as [number, number, number],
        dark: [15, 23, 42] as [number, number, number],
        muted: [100, 116, 139] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number],
        warning: [217, 119, 6] as [number, number, number],
        bg: [248, 250, 252] as [number, number, number],
      };

      const capture = async (id: string): Promise<string | null> => {
        const el = document.getElementById(id);
        if (!el) return null;
        const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        return canvas.toDataURL('image/png');
      };

      // Header
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 55, 'F');
      drawLogo(doc, margin + 8, 25, 16);
      doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(255, 255, 255);
      doc.text("Readiness Audit Report", margin + 22, 28);
      doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(218, 218, 255);
      const dateStr = new Date().toLocaleString();
      doc.text(`GENERATED: ${dateStr.toUpperCase()} | GCP ARCHITECTURE FRAMEWORK AUDIT`, margin + 22, 35);
      
      let currentY = 70;
      doc.setFontSize(16).setTextColor(...theme.dark).setFont("helvetica", "bold").text("Executive Summary", margin, currentY);
      currentY += 10;
      doc.setFillColor(...theme.bg);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 10);
      const boxHeight = (summaryLines.length * 6) + 12;
      doc.roundedRect(margin - 2, currentY - 5, contentWidth + 4, boxHeight, 3, 3, 'F');
      doc.setFontSize(11).setTextColor(51, 65, 85).text(summaryLines, margin + 3, currentY + 3);
      currentY += boxHeight + 15;

      const [pieImg, radarImg] = await Promise.all([capture('score-pie-chart'), capture('risk-radar-chart')]);
      if (pieImg && radarImg) {
        doc.addImage(pieImg, 'PNG', margin, currentY, 80, 60);
        doc.addImage(radarImg, 'PNG', margin + 90, currentY, 80, 60);
        currentY += 80;
      }

      doc.addPage();
      currentY = 25;
      doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...theme.dark).text("Detailed Infrastructure Assessment", margin, currentY);
      
      // Fix: Use explicit any[][] type for findingsRows to bypass FontStyle union type mismatch in jspdf-autotable
      const findingsRows: any[][] = result.findings.map(f => [
        `${f.severity.toUpperCase()}\n\n${f.category}`,
        `${f.fileName || 'Global'}\nLine ${f.lineNumber || 'N/A'}${f.costSavings ? '\n\n' + f.costSavings : ''}`,
        {
          content: `${f.title.toUpperCase()}\n\n${f.description}\n\nACTION: ${f.remediation}`,
          styles: { fontStyle: 'normal' }
        }
      ]);

      autoTable(doc, {
        startY: currentY + 10,
        margin: { left: margin, right: margin },
        head: [['Severity / Pillar', 'Context', 'Finding Details']],
        body: findingsRows,
        theme: 'striped',
        headStyles: { fillColor: theme.primary, fontSize: 10, cellPadding: 5 },
        styles: { fontSize: 8, cellPadding: 6, overflow: 'linebreak' },
        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 105 } }
      });

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8).setTextColor(...theme.muted);
        doc.text(`DRA Audit Report | CONFIDENTIAL | Page ${i} of ${pageCount}`, margin, pageHeight - 12);
      }

      doc.save(`DRA_Audit_Report_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="space-y-8 animate-enter bg-slate-50 dark:bg-slate-950/20 p-6 md:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Audit Summary Report</h2>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> {new Date().toLocaleDateString()}</span>
                <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Architecture Integrity Verified</span>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black shadow-xl transition-all shadow-indigo-500/20">
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? loadingText : "Export Professional Audit"}
            </button>
            <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500"><Share2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-5 h-full">
             <ScoreCard findings={result.findings} summary={result.summary} />
        </div>
        <div className="xl:col-span-7 h-full">
            <RiskCharts categories={result.categories} />
        </div>
      </div>

      <CostImpact findings={result.findings} />
      
      <div className="w-full">
         <FindingsList findings={result.findings} />
      </div>
    </div>
  );
};
