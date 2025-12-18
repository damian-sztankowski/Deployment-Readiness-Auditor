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
    // Outer Hexagon
    const angles = [0, 60, 120, 180, 240, 300];
    const pts = angles.map(a => {
      const rad = (a * Math.PI) / 180;
      return [x + r * Math.cos(rad), y + r * Math.sin(rad)];
    });

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.setFillColor(79, 70, 229); // Indigo 600
    
    const relativeLines: [number, number][] = pts.map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      return [next[0] - p[0], next[1] - p[1]];
    });
    doc.lines(relativeLines, pts[0][0], pts[0][1], [1, 1], 'FD', true);

    // Inner Shield symbol (simplified V)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(x - r / 2.5, y - r / 4, x, y + r / 2);
    doc.line(x, y + r / 2, x + r / 2.5, y - r / 4);
  };

  const handleExportPDF = async () => {
    setLoadingText("Compiling Infrastructure Brief...");
    setIsExporting(true);

    // Give UI a moment to settle
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const theme = {
        primary: [79, 70, 229] as [number, number, number],   // Indigo 600
        dark: [15, 23, 42] as [number, number, number],      // Slate 900
        accent: [16, 185, 129] as [number, number, number],   // Emerald 500
        muted: [100, 116, 139] as [number, number, number],   // Slate 400
        danger: [220, 38, 38] as [number, number, number],    // Red 600
        warning: [217, 119, 6] as [number, number, number],   // Amber 600
        bg: [248, 250, 252] as [number, number, number],      // Slate 50
      };

      const capture = async (id: string): Promise<string | null> => {
        const el = document.getElementById(id);
        if (!el) return null;
        const canvas = await html2canvas(el, { 
          scale: 3, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          logging: false
        });
        return canvas.toDataURL('image/png');
      };

      // --- PAGE 1: EXECUTIVE BRIEFING ---
      
      // Header Bar
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 55, 'F');
      
      // Logo & Title
      drawLogo(doc, margin + 8, 25, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("Readiness Audit Report", margin + 22, 28);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(218, 218, 255);
      const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
      doc.text(`GENERATED: ${dateStr.toUpperCase()} | ARCHITECTURE FRAMEWORK COMPLIANCE AUDIT`, margin + 22, 35);
      
      // Executive Summary
      let currentY = 70;
      doc.setFontSize(16);
      doc.setTextColor(...theme.dark);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", margin, currentY);
      
      currentY += 10;
      doc.setFillColor(...theme.bg);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 10);
      const boxHeight = (summaryLines.length * 6) + 12;
      doc.roundedRect(margin - 2, currentY - 5, contentWidth + 4, boxHeight, 3, 3, 'F');
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(summaryLines, margin + 3, currentY + 3);
      currentY += boxHeight + 15;

      // Charts Row
      const [pieImg, radarImg] = await Promise.all([
        capture('score-pie-chart'),
        capture('risk-radar-chart')
      ]);

      if (pieImg && radarImg) {
        doc.addImage(pieImg, 'PNG', margin, currentY, 80, 60);
        doc.addImage(radarImg, 'PNG', margin + 90, currentY, 80, 60);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...theme.muted);
        doc.text("DEPLOYMENT RISK DISTRIBUTION", margin + 15, currentY + 65);
        doc.text("ARCHITECTURE PILLAR MATURITY", margin + 105, currentY + 65);
        
        currentY += 80;
      }

      // Pillar Table
      doc.setFontSize(14);
      doc.setTextColor(...theme.dark);
      doc.text("Pillar Performance Matrix", margin, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        margin: { left: margin, right: margin },
        head: [['Architectural Pillar', 'Score', 'Status', 'AI Reasoning & Context']],
        body: result.categories.map(c => [
          c.name,
          `${c.score}/100`,
          c.status.toUpperCase(),
          c.explanation || "Evaluation passed baseline requirements."
        ]),
        theme: 'grid',
        headStyles: { fillColor: theme.dark, fontSize: 9, cellPadding: 4 },
        styles: { fontSize: 9, cellPadding: 5, font: 'helvetica' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { halign: 'center', cellWidth: 20 }, 2: { halign: 'center', cellWidth: 25 } }
      });

      // --- PAGE 2+: DETAILED ASSESSMENT ---
      doc.addPage();
      currentY = 25;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...theme.dark);
      doc.text("Detailed Assessment Findings", margin, currentY);
      
      currentY += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...theme.muted);
      doc.text("Critical findings identified during semantic analysis of the infrastructure source code.", margin, currentY);

      const findingsRows = result.findings.map(f => [
        f.severity.toUpperCase(),
        f.category,
        {
          content: `${f.title.toUpperCase()}\n\n${f.description}\n\nACTION: ${f.remediation}${f.documentationUrls?.length ? '\n\nREFERENCES: ' + f.documentationUrls.join(', ') : ''}${f.compliance?.length ? '\n\nCOMPLIANCE: ' + f.compliance.join(', ') : ''}`,
          styles: { fontStyle: 'normal' }
        }
      ]);

      autoTable(doc, {
        startY: currentY + 10,
        margin: { left: margin, right: margin },
        head: [['Severity', 'Pillar', 'Finding & Remediation Action Plan']],
        body: findingsRows,
        theme: 'striped',
        headStyles: { fillColor: theme.primary, fontSize: 10, cellPadding: 5 },
        styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 25, fontStyle: 'bold' }, 
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 110 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const sev = data.cell.text[0];
            if (sev === 'CRITICAL') data.cell.styles.textColor = theme.danger;
            if (sev === 'HIGH') data.cell.styles.textColor = theme.warning;
            if (sev === 'MEDIUM') data.cell.styles.textColor = [180, 130, 0];
          }
        }
      });

      // Global Footer for all pages
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...theme.muted);
        doc.text(`Deployment Readiness Auditor | CONFIDENTIAL | Page ${i} of ${pageCount}`, margin, pageHeight - 12);
        doc.text("Verification Source: Google Cloud Architecture Framework", pageWidth - margin - 75, pageHeight - 12);
      }

      doc.save(`DRA_Audit_Report_${Date.now()}.pdf`);

    } catch (error) {
      console.error("PDF Export Failed:", error);
      alert("Professional report generation failed. Verify chart visibility and try again.");
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
        <div className="flex items-center gap-3">
            <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`
                    group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black transition-all duration-300 shadow-xl shadow-indigo-500/30
                    ${isExporting ? 'opacity-50 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}
                `}
            >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? loadingText : "Export Professional Brief"}
                <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm">
                <Share2 className="w-5 h-5" />
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