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

  // Draw a professional representation of the hexagon logo in PDF
  const drawLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    const angles = [0, 60, 120, 180, 240, 300];
    const pts = angles.map(a => {
      const rad = ((a - 90) * Math.PI) / 180;
      return [x + r * Math.cos(rad), y + r * Math.sin(rad)];
    });

    // Outer Hexagon
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    
    // Draw polygon
    pts.forEach((p, i) => {
      if (i === 0) doc.moveTo(p[0], p[1]);
      else doc.lineTo(p[0], p[1]);
    });
    // Fix: jsPDF uses fillStroke instead of fillAndStroke
    doc.fillStroke();

    // Inner details (Shield silhouette)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(x - r/2.5, y - r/4, x, y + r/2);
    doc.line(x, y + r/2, x + r/2.5, y - r/4);
    doc.line(x - r/2.5, y - r/4, x, y - r/2);
    doc.line(x, y - r/2, x + r/2.5, y - r/4);
  };

  const handleExportPDF = async () => {
    setLoadingText("Compiling Enterprise Audit Brief...");
    setIsExporting(true);
    
    // Give time for UI to reflect loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const theme = {
        primary: [79, 70, 229] as [number, number, number],
        indigoDark: [49, 46, 129] as [number, number, number],
        slateDark: [15, 23, 42] as [number, number, number],
        slateMuted: [100, 116, 139] as [number, number, number],
        slateLight: [241, 245, 249] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number],
        warning: [217, 119, 6] as [number, number, number],
        safe: [16, 185, 129] as [number, number, number],
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

      // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
      
      // Indigo Header Block
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      // Branding
      drawLogo(doc, margin + 10, 30, 18);
      doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(255, 255, 255);
      doc.text("Deployment Readiness Audit", margin + 26, 32);
      
      doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(200, 200, 255);
      const timestamp = new Date().toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'short' 
      });
      doc.text(`REPORT ID: DRA-${Date.now().toString().slice(-6)} | GENERATED: ${timestamp.toUpperCase()}`, margin + 26, 39);

      let currentY = 75;

      // Executive Summary
      doc.setFontSize(14).setTextColor(...theme.slateDark).setFont("helvetica", "bold").text("Executive Summary", margin, currentY);
      currentY += 8;
      
      doc.setFillColor(...theme.slateLight);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 10);
      const summaryBoxHeight = (summaryLines.length * 5) + 12;
      doc.roundedRect(margin - 2, currentY - 4, contentWidth + 4, summaryBoxHeight, 2, 2, 'F');
      doc.setFontSize(10).setTextColor(51, 65, 85).setFont("helvetica", "normal");
      doc.text(summaryLines, margin + 3, currentY + 4);
      
      currentY += summaryBoxHeight + 15;

      // Charts Visual Section
      doc.setFontSize(14).setTextColor(...theme.slateDark).setFont("helvetica", "bold").text("Pillar Performance & Risk Distribution", margin, currentY);
      currentY += 5;

      const [pieImg, radarImg] = await Promise.all([
        capture('score-pie-chart'), 
        capture('risk-radar-chart')
      ]);

      if (pieImg && radarImg) {
        // Place side by side
        const imgWidth = contentWidth / 2 - 5;
        doc.addImage(pieImg, 'PNG', margin, currentY, imgWidth, 60);
        doc.addImage(radarImg, 'PNG', margin + imgWidth + 10, currentY, imgWidth, 60);
        currentY += 70;
      }

      // Pillar Table (Quick Overview)
      const pillarRows = result.categories.map(c => [
        c.name.toUpperCase(),
        `${c.score}/100`,
        c.status.toUpperCase(),
        { content: c.explanation || "No explanation provided.", styles: { fontSize: 8 } }
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['ARCHITECTURE PILLAR', 'SCORE', 'STATUS', 'BRIEF LOGIC']],
        body: pillarRows,
        theme: 'grid',
        headStyles: { fillColor: theme.indigoDark, fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 
          0: { cellWidth: 40, fontStyle: 'bold' }, 
          1: { cellWidth: 20, halign: 'center' }, 
          2: { cellWidth: 30, halign: 'center' }, 
          3: { cellWidth: 'auto' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw as string;
            if (val === 'CRITICAL') data.cell.styles.textColor = theme.danger;
            if (val === 'WARNING') data.cell.styles.textColor = theme.warning;
            if (val === 'SAFE') data.cell.styles.textColor = theme.safe;
          }
        }
      });

      // --- PAGE 2+: DETAILED FINDINGS ---
      doc.addPage();
      currentY = 25;
      
      doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...theme.slateDark);
      doc.text("Infrastructure Findings & Compliance Mapping", margin, currentY);
      
      currentY += 10;
      
      // Fix: Use 'as const' to ensure string literals match 'FontStyle' and 'HAlign' types in autoTable
      const findingsRows = result.findings.map(f => {
        const complianceStr = f.compliance?.map(c => `[${c.standard}: ${c.controlId}]`).join('\n') || 'N/A';
        const contextStr = `${f.fileName || 'Global'}\nLine ${f.lineNumber || 'N/A'}${f.costSavings ? '\nSAVINGS: ' + f.costSavings : ''}`;
        
        return [
          { content: `${f.severity.toUpperCase()}\n\n${f.category}`, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
          { content: contextStr, styles: { fontSize: 8, fontStyle: 'italic' as const } },
          { 
            content: `${f.title.toUpperCase()}\n\n${f.description}\n\nREMEDIATION: ${f.remediation}\n\nCOMPLIANCE:\n${complianceStr}`,
            styles: { fontSize: 8.5 }
          }
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin, bottom: 20 },
        head: [['SEVERITY / PILLAR', 'SOURCE CONTEXT', 'FINDING DETAIL & ACTIONABLE REMEDIATION']],
        body: findingsRows,
        theme: 'striped',
        headStyles: { fillColor: theme.primary, fontSize: 10, cellPadding: 5 },
        styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 35 }, 
          1: { cellWidth: 35 }, 
          2: { cellWidth: 'auto' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const val = data.cell.text[0];
            if (val.includes('CRITICAL')) data.cell.styles.textColor = theme.danger;
            else if (val.includes('HIGH')) data.cell.styles.textColor = theme.warning;
            else if (val.includes('MEDIUM')) data.cell.styles.textColor = [180, 150, 0];
          }
        }
      });

      // Footer with Page Numbers
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8).setTextColor(...theme.slateMuted);
        doc.setDrawColor(...theme.slateLight);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.text(`Deployment Readiness Auditor | CONFIDENTIAL AUDIT REPORT | v2.5`, margin, pageHeight - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      }

      doc.save(`DRA_Audit_Report_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Professional PDF Export Failed:", error);
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
            <button 
              onClick={handleExportPDF} 
              disabled={isExporting} 
              className="group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-black shadow-xl transition-all shadow-indigo-500/20 active:scale-95 disabled:opacity-70"
            >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                {isExporting ? loadingText : "Export Professional Audit"}
            </button>
            <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm">
              <Share2 className="w-5 h-5" />
            </button>
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