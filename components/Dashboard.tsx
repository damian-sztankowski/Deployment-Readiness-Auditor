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

  // High-fidelity Logo recreation for PDF (replicates the liquid logo appearance)
  const drawEnterpriseLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    
    // 1. Shadow/Glow Base
    doc.setFillColor(79, 70, 229, 0.1); 
    doc.circle(x, y, r * 1.2, 'F');

    // 2. Liquid Morphing Layers (Outer Hexagon)
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
      doc.lineTo(pts[0][0], pts[0][1]);
      doc.fill();
    };

    // Background Hex (Soft)
    drawHex(x, y, r, [79, 70, 229], 0.2);
    // Primary Hex
    drawHex(x, y, r * 0.9, [79, 70, 229], 1);

    // 3. Shield Inlay
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(x - r/3, y - r/5, x, y + r/2);
    doc.line(x, y + r/2, x + r/3, y - r/5);
    doc.line(x - r/3, y - r/5, x, y - r/2);
    doc.line(x, y - r/2, x + r/3, y - r/5);

    // 4. Orbiting Badge Nodes
    doc.setFillColor(34, 211, 238); // Cyan
    doc.circle(x + r * 0.8, y - r * 0.8, r * 0.15, 'F');
    doc.setFillColor(16, 185, 129); // Emerald
    doc.circle(x - r * 0.8, y + r * 0.5, r * 0.12, 'F');
    doc.setFillColor(245, 158, 11); // Amber
    doc.circle(x + r * 0.4, y + r * 0.9, r * 0.1, 'F');
  };

  const handleExportPDF = async () => {
    setLoadingText("Compiling Enterprise Audit Brief...");
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
        indigoDark: [49, 46, 129] as [number, number, number],
        slate950: [2, 6, 23] as [number, number, number],
        slate900: [15, 23, 42] as [number, number, number],
        slate800: [30, 41, 59] as [number, number, number],
        slate400: [148, 163, 184] as [number, number, number],
        slateMuted: [100, 116, 139] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number],
        warning: [217, 119, 6] as [number, number, number],
        safe: [16, 185, 129] as [number, number, number],
      };

      const capture = async (id: string): Promise<string | null> => {
        const el = document.getElementById(id);
        if (!el) return null;
        const canvas = await html2canvas(el, { 
          scale: 4, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          logging: false 
        });
        return canvas.toDataURL('image/png');
      };

      // --- PAGE 1: ENTERPRISE COVER ---
      doc.setFillColor(...theme.slate950);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Decorative bottom block
      doc.setFillColor(...theme.slate900);
      doc.rect(0, pageHeight - 100, pageWidth, 100, 'F');
      
      // Branding Header
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Main Logo
      drawEnterpriseLogo(doc, pageWidth / 2, 80, 50);
      
      doc.setFont("helvetica", "bold").setFontSize(36).setTextColor(255, 255, 255);
      doc.text("INFRASTRUCTURE", pageWidth / 2, 125, { align: 'center' });
      doc.text("AUDIT REPORT", pageWidth / 2, 142, { align: 'center' });
      
      doc.setFont("helvetica", "normal").setFontSize(12).setTextColor(...theme.slate400);
      doc.text("Deployment Readiness Assessment Protocol v2.5", pageWidth / 2, 155, { align: 'center' });
      
      doc.setDrawColor(...theme.primary);
      doc.setLineWidth(1.5);
      doc.line(pageWidth / 2 - 35, 168, pageWidth / 2 + 35, 168);

      // Report metadata
      doc.setFontSize(11).setTextColor(255, 255, 255);
      doc.text(`REPORT ID: DRA-${Date.now().toString().slice(-8)}`, pageWidth / 2, 185, { align: 'center' });
      doc.text(`DATE: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth / 2, 192, { align: 'center' });

      // Confidentiality Section (Fixed Contrast)
      doc.setFillColor(255, 255, 255, 0.1);
      doc.roundedRect(margin, pageHeight - 45, contentWidth, 20, 3, 3, 'F');
      doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      doc.text("PROPRIETARY & CONFIDENTIAL", pageWidth / 2, pageHeight - 35, { align: 'center' });
      doc.setFontSize(9).setFont("helvetica", "italic").setTextColor(...theme.slate400);
      doc.text("This document contains sensitive architectural analysis intended for authorized personnel only.", pageWidth / 2, pageHeight - 29, { align: 'center' });

      // --- PAGE 2: EXECUTIVE SUMMARY ---
      doc.addPage();
      let currentY = 25;

      // Consistent Header for Content Pages
      doc.setFillColor(...theme.slate950);
      doc.rect(0, 0, pageWidth, 45, 'F');
      drawEnterpriseLogo(doc, margin + 12, 22, 16);
      doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(255, 255, 255);
      doc.text("Executive Summary", margin + 32, 26);
      doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(...theme.slate400);
      doc.text("Integrity Analysis & Risk Profiling", margin + 32, 33);

      currentY = 60;
      doc.setFontSize(14).setTextColor(...theme.slate900).setFont("helvetica", "bold").text("1. Overall Assessment Summary", margin, currentY);
      currentY += 10;

      // Summary Box (Fixed Contrast)
      doc.setFillColor(248, 250, 252); 
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 14);
      const summaryBoxHeight = (summaryLines.length * 6) + 16;
      doc.roundedRect(margin, currentY, contentWidth, summaryBoxHeight, 4, 4, 'F');
      doc.setFontSize(10.5).setTextColor(...theme.slate900).setFont("helvetica", "normal");
      doc.text(summaryLines, margin + 8, currentY + 12);
      
      currentY += summaryBoxHeight + 15;

      // Visualized Pillars
      doc.setFontSize(14).setTextColor(...theme.slate900).setFont("helvetica", "bold").text("2. Pillar Performance Matrix", margin, currentY);
      currentY += 8;

      const [pieImg, radarImg] = await Promise.all([
        capture('score-pie-chart'), 
        capture('risk-radar-chart')
      ]);

      if (pieImg && radarImg) {
        const imgWidth = contentWidth / 2 - 5;
        doc.addImage(pieImg, 'PNG', margin, currentY, imgWidth, 60);
        doc.addImage(radarImg, 'PNG', margin + imgWidth + 10, currentY, imgWidth, 60);
        currentY += 70;
      }

      // Pillar Table
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['ARCHITECTURE PILLAR', 'SCORE', 'STATUS', 'BRIEF ANALYSIS']],
        body: result.categories.map(c => [
          c.name.toUpperCase(),
          `${c.score}/100`,
          c.status.toUpperCase(),
          { content: c.explanation || "System validated.", styles: { fontSize: 8.5 } }
        ]),
        theme: 'grid',
        headStyles: { fillColor: theme.slate900, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9.5, cellPadding: 5, valign: 'middle' },
        columnStyles: { 
          0: { cellWidth: 45, fontStyle: 'bold' }, 
          1: { cellWidth: 25, halign: 'center' }, 
          2: { cellWidth: 32, halign: 'center' }, 
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

      // --- PAGE 3+: TECHNICAL FINDINGS ---
      doc.addPage();
      currentY = 25;
      
      doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...theme.slate900);
      doc.text("3. Technical Observation Log", margin, currentY);
      doc.setDrawColor(...theme.primary);
      doc.setLineWidth(1);
      doc.line(margin, currentY + 3, margin + 25, currentY + 3);
      
      currentY += 15;
      
      const findingsRows = result.findings.map(f => {
        const complianceText = f.compliance?.map(c => `• ${c.standard}: ${c.controlId}`).join('\n') || 'General Best Practice.';
        const context = `FILE: ${f.fileName || 'N/A'}\nLINE: ${f.lineNumber || 'N/A'}\nTYPE: ${f.category}`;
        
        return [
          { content: `${f.severity.toUpperCase()}`, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
          { content: context, styles: { fontSize: 8, fontStyle: 'italic' as const } },
          { 
            content: `${f.title.toUpperCase()}\n\n${f.description}\n\nREMEDIATION: ${f.remediation}\n\nSTANDARDS: ${complianceText}`,
            styles: { fontSize: 9 }
          }
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin, bottom: 25 },
        head: [['PRIORITY', 'CONTEXT', 'DETAILED FINDING & REMEDIATION STRATEGY']],
        body: findingsRows,
        theme: 'striped',
        headStyles: { fillColor: theme.primary, fontSize: 10.5, cellPadding: 6 },
        styles: { fontSize: 9.5, cellPadding: 8, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 35 }, // Increased to prevent "CRITICAL" wrapping
          1: { cellWidth: 42 }, 
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

      // Unified Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8.5).setTextColor(...theme.slateMuted);
        
        // Horizontal separator line
        doc.setDrawColor(...theme.slateMuted, 0.2);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        doc.text(`DRA Auditor Enterprise | Proprietary Architectural Insight`, margin, pageHeight - 10);
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