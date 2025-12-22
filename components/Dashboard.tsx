import React, { useRef, useState } from 'react';
import { AuditResult, Severity } from '../types';
import { ScoreCard } from './ScoreCard';
import { RiskCharts } from './RiskCharts';
import { FindingsList } from './FindingsList';
import { CostImpact } from './CostImpact';
import { Download, Calendar, Loader2, ShieldCheck, Share2, FileText } from 'lucide-react';
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

  // High-fidelity Logo recreation for PDF (exactly replicates the liquid logo appearance)
  const drawEnterpriseLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    
    // 1. Soft Shadow Glow
    doc.setFillColor(79, 70, 229, 0.08); 
    doc.circle(x, y, r * 1.3, 'F');

    // 2. Liquid Morphing Layers
    const drawHex = (cx: number, cy: number, radius: number, fillColor: [number, number, number], opacity: number = 1) => {
      const angles = [0, 60, 120, 180, 240, 300];
      const pts = angles.map(a => {
        const rad = ((a - 90) * Math.PI) / 180;
        return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
      });
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2], opacity);
      pts.forEach((p, i) => {
        if (i === 0) doc.moveTo(p[0], p[1]);
        else doc.lineTo(p[0], p[1]);
      });
      doc.lineTo(pts[0][0], pts[0][1]); // Close path manually
      doc.fill();
    };

    // Deep layer
    drawHex(x, y, r, [79, 70, 229], 0.15);
    // Core layer
    drawHex(x, y, r * 0.9, [79, 70, 229], 1);

    // 3. Shield Icon Inlay
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.line(x - r/3, y - r/4, x, y + r/2);
    doc.line(x, y + r/2, x + r/3, y - r/4);
    doc.line(x - r/3, y - r/4, x, y - r/2);
    doc.line(x, y - r/2, x + r/3, y - r/4);

    // 4. Accent Orb (Cyan)
    doc.setFillColor(34, 211, 238); 
    doc.circle(x + r * 0.75, y - r * 0.75, r * 0.18, 'F');
    
    // 5. Orbiting Nodes (Emerald and Amber)
    doc.setFillColor(16, 185, 129); // Emerald
    doc.circle(x - r * 0.85, y + r * 0.45, r * 0.14, 'F');
    doc.setFillColor(245, 158, 11); // Amber
    doc.circle(x + r * 0.4, y + r * 0.85, r * 0.12, 'F');
  };

  const handleExportPDF = async () => {
    setLoadingText("Synthesizing Enterprise Intelligence...");
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
        slate950: [2, 6, 23] as [number, number, number],
        slate900: [15, 23, 42] as [number, number, number],
        slate800: [30, 41, 59] as [number, number, number],
        slate400: [148, 163, 184] as [number, number, number],
        slateMuted: [100, 116, 139] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number],
        warning: [217, 119, 6] as [number, number, number],
        safe: [16, 185, 129] as [number, number, number],
      };

      // --- PAGE 1: ENTERPRISE COVER ---
      doc.setFillColor(...theme.slate950);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setFillColor(...theme.slate900);
      doc.rect(0, pageHeight - 90, pageWidth, 90, 'F');
      
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 6, 'F');

      drawEnterpriseLogo(doc, pageWidth / 2, 85, 55);
      
      doc.setFont("helvetica", "bold").setFontSize(38).setTextColor(255, 255, 255);
      doc.text("INFRASTRUCTURE", pageWidth / 2, 135, { align: 'center' });
      doc.text("AUDIT REPORT", pageWidth / 2, 152, { align: 'center' });
      
      doc.setFont("helvetica", "normal").setFontSize(13).setTextColor(...theme.slate400);
      doc.text("Deployment Readiness Assessment Protocol v2.5", pageWidth / 2, 165, { align: 'center' });
      
      doc.setDrawColor(...theme.primary);
      doc.setLineWidth(1.8);
      doc.line(pageWidth / 2 - 40, 178, pageWidth / 2 + 40, 178);

      doc.setFontSize(11).setTextColor(255, 255, 255);
      const reportId = `DRA-${Date.now().toString().slice(-8)}`;
      doc.text(`REPORT ID: ${reportId}`, pageWidth / 2, 195, { align: 'center' });
      doc.text(`DATE: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, 202, { align: 'center' });

      doc.setFillColor(255, 255, 255, 0.08);
      doc.roundedRect(margin, pageHeight - 45, contentWidth, 22, 4, 4, 'F');
      doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      doc.text("PROPRIETARY & CONFIDENTIAL", pageWidth / 2, pageHeight - 34, { align: 'center' });
      doc.setFontSize(9).setFont("helvetica", "italic").setTextColor(...theme.slate400);
      doc.text("This document contains proprietary architectural analysis. Unauthorized distribution is prohibited.", pageWidth / 2, pageHeight - 28, { align: 'center' });

      // --- PAGE 2: EXECUTIVE SUMMARY & ASSESSMENT ---
      doc.addPage();
      let currentY = 25;

      doc.setFillColor(...theme.slate950);
      doc.rect(0, 0, pageWidth, 48, 'F');
      drawEnterpriseLogo(doc, margin + 12, 24, 18);
      doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(255, 255, 255);
      doc.text("Executive Summary", margin + 35, 28);
      doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(...theme.slate400);
      doc.text("Architectural Integrity Analysis & Risk Profiling", margin + 35, 35);

      currentY = 65;
      doc.setFontSize(15).setTextColor(...theme.slate900).setFont("helvetica", "bold").text("1. Overall Readiness Summary", margin, currentY);
      currentY += 12;

      doc.setFillColor(248, 250, 252); 
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 16);
      const summaryBoxHeight = (summaryLines.length * 6.5) + 16;
      doc.roundedRect(margin, currentY, contentWidth, summaryBoxHeight, 5, 5, 'F');
      doc.setFontSize(11).setTextColor(...theme.slate900).setFont("helvetica", "normal");
      doc.text(summaryLines, margin + 8, currentY + 12);
      
      currentY += summaryBoxHeight + 15;

      doc.setFontSize(15).setTextColor(...theme.slate900).setFont("helvetica", "bold").text("2. Pillar Performance Assessment", margin, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['ARCHITECTURE PILLAR', 'SCORE', 'STATUS', 'AUDITOR ANALYSIS']],
        body: result.categories.map(c => [
          c.name.toUpperCase(),
          `${c.score}/100`,
          c.status.toUpperCase(),
          { content: c.explanation || "System validated against benchmark.", styles: { fontSize: 9 } }
        ]),
        theme: 'grid',
        headStyles: { fillColor: theme.slate900, fontSize: 10, fontStyle: 'bold', halign: 'center', cellPadding: 5 },
        styles: { fontSize: 10, cellPadding: 6, valign: 'middle' },
        columnStyles: { 
          0: { cellWidth: 50, fontStyle: 'bold' }, 
          1: { cellWidth: 25, halign: 'center' }, 
          2: { cellWidth: 35, halign: 'center' }, 
          3: { cellWidth: 'auto' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw as string;
            if (val === 'CRITICAL') data.cell.styles.textColor = theme.danger;
            else if (val === 'WARNING') data.cell.styles.textColor = theme.warning;
            else if (val === 'SAFE') data.cell.styles.textColor = theme.safe;
          }
        }
      });

      // --- PAGE 3+: TECHNICAL FINDINGS LOG ---
      doc.addPage();
      currentY = 25;
      
      doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...theme.slate900);
      doc.text("3. Technical Observation Log", margin, currentY);
      doc.setDrawColor(...theme.primary);
      doc.setLineWidth(1.2);
      doc.line(margin, currentY + 4, margin + 30, currentY + 4);
      
      currentY += 18;
      
      const findingsRows = result.findings.map(f => {
        const complianceText = f.compliance?.map(c => `• ${c.standard}: ${c.controlId}`).join('\n') || 'Architectural Best Practice.';
        const context = `SOURCE: ${f.fileName || 'Project-wide'}\nLOCATION: Line ${f.lineNumber || 'N/A'}\nCATEGORY: ${f.category}`;
        
        return [
          { content: `${f.severity.toUpperCase()}`, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
          { content: context, styles: { fontSize: 8.5, fontStyle: 'italic' as const } },
          { 
            content: `${f.title.toUpperCase()}\n\n${f.description}\n\nREMEDIATION STRATEGY: ${f.remediation}\n\nCOMPLIANCE MAPPING:\n${complianceText}`,
            styles: { fontSize: 9.5 }
          }
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin, bottom: 25 },
        head: [['SEVERITY', 'CONTEXT', 'FINDING, REMEDIATION & COMPLIANCE']],
        body: findingsRows,
        theme: 'striped',
        headStyles: { fillColor: theme.primary, fontSize: 11, cellPadding: 7 },
        styles: { fontSize: 10, cellPadding: 8, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 42 },
          1: { cellWidth: 45 }, 
          2: { cellWidth: 'auto' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const val = data.cell.text[0];
            if (val.includes('CRITICAL')) {
                data.cell.styles.fillColor = [254, 242, 242];
                data.cell.styles.textColor = theme.danger;
            } else if (val.includes('HIGH')) {
                data.cell.styles.fillColor = [255, 251, 235];
                data.cell.styles.textColor = theme.warning;
            }
          }
        }
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9).setTextColor(...theme.slateMuted);
        
        doc.setDrawColor(...theme.slateMuted, 0.15);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        doc.text(`Deployment Readiness Auditor | CONFIDENTIAL AUDIT REPORT | ${reportId}`, margin, pageHeight - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      doc.save(`DRA_Enterprise_Audit_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Enterprise PDF Export Failed:", error);
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
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                {isExporting ? loadingText : "Export Enterprise Brief"}
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