import React, { useRef, useState } from 'react';
import { AuditResult, Severity } from '../types';
import { ScoreCard } from './ScoreCard';
import { RiskCharts } from './RiskCharts';
import { FindingsList } from './FindingsList';
import { FileBarChart2, Download, Calendar, Loader2 } from 'lucide-react';
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
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      const colors = {
        primary: [79, 70, 229] as [number, number, number],
        secondary: [30, 41, 59] as [number, number, number],
        text: [51, 65, 85] as [number, number, number],
        lightBg: [248, 250, 252] as [number, number, number],
        critical: [220, 38, 38] as [number, number, number],
        high: [249, 115, 22] as [number, number, number],
        medium: [234, 179, 8] as [number, number, number],
        low: [59, 130, 246] as [number, number, number],
        info: [100, 116, 139] as [number, number, number],
      };

      const captureComponent = async (elementId: string, isPieChart = false): Promise<string | null> => {
        const element = document.getElementById(elementId);
        if (!element) return null;

        try {
          const canvas = await html2canvas(element, {
            scale: 4,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              clonedDoc.documentElement.classList.remove('dark');
              const el = clonedDoc.getElementById(elementId);
              if (el) {
                el.style.overflow = 'visible';
                if (isPieChart) {
                    const overlays = el.getElementsByClassName('absolute');
                    Array.from(overlays).forEach((o: Element) => (o as HTMLElement).style.display = 'none');
                }
                const paths = el.getElementsByTagName('path');
                for (let i = 0; i < paths.length; i++) {
                    paths[i].style.strokeDasharray = 'none';
                    paths[i].style.transition = 'none';
                }
              }
            }
          });
          return canvas.toDataURL('image/png');
        } catch (e) {
          return null;
        }
      };

      // Header
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Readiness Audit Report", margin, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(224, 231, 255);
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const refId = `REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      doc.text(`${dateStr}  |  ${refId}`, pageWidth - margin, 16, { align: 'right' });

      let currentY = 35;

      // Executive Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      doc.text("Executive Summary", margin, currentY);
      currentY += 6;
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY - 4, contentWidth, 25, 2, 2, 'FD');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.text);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 10);
      doc.text(summaryLines, margin + 5, currentY + 3);

      currentY += 35;

      // Findings Overview (Left)
      const col1Width = 60;
      const col2X = margin + col1Width + 15;
      
      const scoreImg = await captureComponent('score-pie-chart', true);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      doc.text("Risk Overview", margin, currentY);

      if (scoreImg) {
        doc.addImage(scoreImg, 'PNG', margin + 5, currentY + 5, 50, 50);
      }

      // Draw Vector Findings Count (Centered in donut)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(...colors.secondary);
      doc.text(`${result.findings.length}`, margin + 30, currentY + 32, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("FINDINGS", margin + 30, currentY + 38, { align: 'center' });

      // Pillar Analysis (Right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      doc.text("Pillar Analysis", col2X, currentY);

      let pillarY = currentY + 10;
      result.categories.forEach((cat) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(cat.name, col2X, pillarY);
          
          const barX = col2X + 45;
          const barWidth = 70;
          const barHeight = 4;
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(barX, pillarY - 3, barWidth, barHeight, 1.5, 1.5, 'F');

          const fillWidth = (cat.score / 100) * barWidth;
          if (cat.score >= 80) doc.setFillColor(34, 197, 94);
          else if (cat.score >= 50) doc.setFillColor(234, 179, 8);
          else doc.setFillColor(239, 68, 68);
          doc.roundedRect(barX, pillarY - 3, fillWidth, barHeight, 1.5, 1.5, 'F');

          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(`${cat.score}`, barX + barWidth + 5, pillarY);
          pillarY += 9;
      });

      currentY += 65;

      // Findings Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...colors.secondary);
      doc.text("Key Findings", margin, currentY);
      currentY += 5;

      const tableData = result.findings.map(f => {
        let location = "";
        if (f.fileName) location += `File: ${f.fileName}\n`;
        if (f.lineNumber) location += `Line: ${f.lineNumber}`;
        
        return [
          f.severity.toUpperCase(),
          f.category,
          `${f.title}\n\n${location ? `LOCATION: ${location}\n\n` : ''}${f.description}\n\nRecommendation: ${f.remediation}`
        ];
      });

      (autoTable as any)(doc, {
        startY: currentY,
        head: [['Severity', 'Category', 'Observation & Remediation']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [71, 85, 105],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          textColor: [51, 65, 85],
          overflow: 'linebreak',
          cellPadding: 3,
          valign: 'top',
          lineColor: [226, 232, 240],
          lineWidth: { bottom: 0.1 },
        },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold', fontSize: 8 }, 
          1: { cellWidth: 35, fontStyle: 'normal', textColor: [100, 116, 139] },
          2: { cellWidth: 'auto' }
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 0) {
            const sev = data.cell.raw;
            if (sev === 'CRITICAL') data.cell.styles.textColor = colors.critical;
            else if (sev === 'HIGH') data.cell.styles.textColor = colors.high;
            else if (sev === 'MEDIUM') data.cell.styles.textColor = colors.medium;
            else if (sev === 'LOW') data.cell.styles.textColor = colors.low;
            else data.cell.styles.textColor = colors.info;
          }
        },
        margin: { left: margin, right: margin, bottom: 20 }
      });

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save("DRA-Readiness-Report.pdf");

    } catch (error) {
      console.error("PDF Export Failed:", error);
      alert("Could not generate report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="space-y-8 animate-enter bg-slate-50 dark:bg-slate-900/50 p-4 md:p-8 rounded-xl -mx-4 md:-mx-8 transition-colors duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <FileBarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Readiness Audit Report</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </div>
        <div className="no-print">
            <div className="relative group z-0 inline-block">
                <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-70 transition duration-500 animate-gradient bg-300% ${isExporting ? 'opacity-80 scale-105 duration-1000' : ''}`}></div>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-lg opacity-50 group-hover:opacity-100 transition duration-500 animate-gradient bg-300% ${isExporting ? 'opacity-100' : ''}`}></div>
                <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className={`
                        relative flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm border border-transparent
                        ${isExporting ? 'text-indigo-600 dark:text-indigo-400 cursor-wait' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white active:scale-95'}
                    `}
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" /> : <Download className="w-4 h-4 text-indigo-500 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110 group-active:translate-y-1" />}
                    <span className="min-w-[9rem] text-center inline-block">{isExporting ? loadingText : "Export PDF Report"}</span>
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="w-full h-full relative z-10">
             <ScoreCard findings={result.findings} summary={result.summary} />
        </div>
        <div className="w-full h-full relative z-10">
            <RiskCharts categories={result.categories} />
        </div>
      </div>

      <div className="w-full relative z-10 mt-8">
         <FindingsList findings={result.findings} />
      </div>
    </div>
  );
};