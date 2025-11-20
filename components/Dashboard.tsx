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
    
    // Wait a brief moment to ensure any re-renders or animations are settled
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

      // Brand Colors
      const colors = {
        primary: [79, 70, 229] as [number, number, number], // Indigo 600
        secondary: [30, 41, 59] as [number, number, number], // Slate 800
        text: [51, 65, 85] as [number, number, number], // Slate 700
        lightBg: [248, 250, 252] as [number, number, number], // Slate 50
        accent: [224, 231, 255] as [number, number, number], // Indigo 100
        critical: [220, 38, 38] as [number, number, number], // Red 600
        high: [249, 115, 22] as [number, number, number],   // Orange 500 (Brighter)
        medium: [234, 179, 8] as [number, number, number],  // Yellow 600 (Darker Yellow)
        low: [59, 130, 246] as [number, number, number],    // Blue 500
        info: [100, 116, 139] as [number, number, number],  // Slate 500
      };

      // --- Helper: Capture Element with High DPI ---
      const captureComponent = async (elementId: string, isPieChart = false): Promise<string | null> => {
        const element = document.getElementById(elementId);
        if (!element) return null;

        try {
          const canvas = await html2canvas(element, {
            scale: 4, // Ultra High DPI for charts
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff', // Always capture on white for PDF
            logging: false,
            onclone: (clonedDoc) => {
              // CRITICAL: Remove dark mode class from clone to ensure we capture "Light Mode" versions 
              // (Dark text on White background) for the PDF, otherwise we get White text on White background or Dark on Dark.
              clonedDoc.documentElement.classList.remove('dark');

              const el = clonedDoc.getElementById(elementId);
              if (el) {
                el.style.overflow = 'visible';
                
                // If it's the pie chart, hide the HTML text overlay so we can draw crisp vector text instead
                if (isPieChart) {
                    const overlays = el.getElementsByClassName('absolute');
                    Array.from(overlays).forEach((o: Element) => (o as HTMLElement).style.display = 'none');
                }
                // Strip Recharts animations
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
          console.warn(`Failed to capture ${elementId}`, e);
          return null;
        }
      };

      // --- 1. Header Section ---
      // Draw professional blue header bar
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Readiness Audit Report", margin, 16);

      // Date & ID
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(224, 231, 255); // Indigo 100
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const refId = `REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      doc.text(`${dateStr}  |  ${refId}`, pageWidth - margin, 16, { align: 'right' });

      let currentY = 35;

      // --- 2. Executive Summary ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      doc.text("Executive Summary", margin, currentY);

      currentY += 6;
      
      // Background Box for Summary
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.roundedRect(margin, currentY - 4, contentWidth, 25, 2, 2, 'FD');

      // Summary Text (Vector)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.text);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 10);
      doc.text(summaryLines, margin + 5, currentY + 3);

      currentY += 35;

      // --- 3. Score & Pillars (Grid Layout) ---
      
      // LEFT COLUMN: Overall Score
      const col1Width = 60;
      const col2X = margin + col1Width + 15;
      
      // Capture Pie Chart (Donut only, no text)
      const scoreImg = await captureComponent('score-pie-chart', true);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      doc.text("Overall Score", margin, currentY);

      if (scoreImg) {
        doc.addImage(scoreImg, 'PNG', margin + 5, currentY + 5, 50, 50);
      }

      // Draw Vector Score Text (Centered in donut)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      const scoreVal = result.overallScore;
      // Choose color based on score
      if (scoreVal >= 80) doc.setTextColor(22, 163, 74); // Green
      else if (scoreVal >= 50) doc.setTextColor(202, 138, 4); // Yellow
      else doc.setTextColor(220, 38, 38); // Red
      
      doc.text(`${scoreVal}`, margin + 30, currentY + 32, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("OVERALL", margin + 30, currentY + 38, { align: 'center' });

      // RIGHT COLUMN: Pillar Analysis
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.secondary);
      doc.text("Pillar Analysis", col2X, currentY);

      let pillarY = currentY + 10;
      
      // We will draw the bars using vector commands instead of capturing text
      result.categories.forEach((cat) => {
          // Pillar Name
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(cat.name, col2X, pillarY);
          
          // Background Bar
          const barX = col2X + 45;
          const barWidth = 70;
          const barHeight = 4;
          doc.setFillColor(241, 245, 249); // Slate 100
          doc.roundedRect(barX, pillarY - 3, barWidth, barHeight, 1.5, 1.5, 'F');

          // Foreground Bar
          const fillWidth = (cat.score / 100) * barWidth;
          if (cat.score >= 80) doc.setFillColor(34, 197, 94);
          else if (cat.score >= 50) doc.setFillColor(234, 179, 8);
          else doc.setFillColor(239, 68, 68);
          doc.roundedRect(barX, pillarY - 3, fillWidth, barHeight, 1.5, 1.5, 'F');

          // Score Number
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(`${cat.score}`, barX + barWidth + 5, pillarY);

          pillarY += 9;
      });

      currentY += 65;

      // --- 5. Findings Table ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...colors.secondary);
      doc.text("Key Findings", margin, currentY);
      
      currentY += 5;

      const tableData = result.findings.map(f => [
        f.severity.toUpperCase(),
        f.category,
        `${f.title}\n\n${f.description}\n\nRecommendation: ${f.remediation}`
      ]);

      (autoTable as any)(doc, {
        startY: currentY,
        head: [['Severity', 'Category', 'Observation & Remediation']],
        body: tableData,
        theme: 'plain', // Cleaner look than grid
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [71, 85, 105],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3 // Reduced padding to give more horizontal space
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          textColor: [51, 65, 85],
          overflow: 'linebreak',
          cellPadding: 3, // Reduced padding to give more horizontal space
          valign: 'top',
          lineColor: [226, 232, 240],
          lineWidth: { bottom: 0.1 }, // Horizontal lines only
        },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold', fontSize: 8 }, 
          1: { cellWidth: 35, fontStyle: 'normal', textColor: [100, 116, 139] },
          2: { cellWidth: 'auto' }
        },
        didParseCell: (data: any) => {
          // Color code Severity
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

      // Footer (Page Numbers)
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${totalPages}`, 
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
      }

      // Save
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
      
      {/* Report Header */}
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
                {/* Animated Gradient Glow Layer */}
                <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-70 transition duration-500 animate-gradient bg-300% ${isExporting ? 'opacity-80 scale-105 duration-1000' : ''}`}></div>
                
                {/* Animated Gradient Border Layer */}
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-lg opacity-50 group-hover:opacity-100 transition duration-500 animate-gradient bg-300% ${isExporting ? 'opacity-100' : ''}`}></div>

                <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className={`
                        relative flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm border border-transparent
                        ${isExporting 
                            ? 'text-indigo-600 dark:text-indigo-400 cursor-wait' 
                            : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white active:scale-95'
                        }
                    `}
                >
                    {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    ) : (
                        <Download className="w-4 h-4 text-indigo-500 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110 group-active:translate-y-1" />
                    )}
                    <span className="min-w-[9rem] text-center inline-block">
                        {isExporting ? loadingText : "Export PDF Report"}
                    </span>
                </button>
            </div>
        </div>
      </div>

      {/* Top Row: Score & Key Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        <div className="w-full h-full relative z-10">
             <ScoreCard score={result.overallScore} summary={result.summary} />
        </div>
      </div>

      {/* Middle Row: Charts & Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
         <div className="lg:col-span-1 w-full sticky top-24 relative z-10">
            <RiskCharts categories={result.categories} />
         </div>
         <div className="lg:col-span-2 w-full relative z-10">
            <FindingsList findings={result.findings} />
         </div>
      </div>

    </div>
  );
};