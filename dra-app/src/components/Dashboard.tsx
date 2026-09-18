import React, { useRef, useState } from 'react';
import { AuditResult, Severity } from '../types';
import { ScoreCard } from './ScoreCard';
import { RiskCharts } from './RiskCharts';
import { FindingsList } from './FindingsList';
import { CostImpact } from './CostImpact';
import { DiagramView } from './DiagramView';
import { RemediationModal } from './RemediationModal';
import { DeploymentVerdictBanner } from './DeploymentVerdictBanner';
import { ComplianceMatrix } from './ComplianceMatrix';
import { Download, Calendar, Loader2, ShieldCheck, Share2, FileText, Sparkles, GitPullRequest } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  result: AuditResult;
  isDemo?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ result, isDemo = false }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingText, setLoadingText] = useState("Generating Report...");
  const [showRemediationModal, setShowRemediationModal] = useState(false);

  // High-fidelity Logo recreation for PDF
  const drawEnterpriseLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    
    // Soft Shadow Glow
    doc.setFillColor(79, 70, 229, 0.08); 
    doc.circle(x, y, r * 1.3, 'F');

    // Morphing Hex Layers
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

    // Deep layer
    drawHex(x, y, r, [79, 70, 229], 0.15);
    // Core layer
    drawHex(x, y, r * 0.9, [79, 70, 229], 1);

    // Shield Icon Inlay
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.line(x - r/3, y - r/4, x, y + r/2);
    doc.line(x, y + r/2, x + r/3, y - r/4);
    doc.line(x - r/3, y - r/4, x, y - r/2);
    doc.line(x, y - r/2, x + r/3, y - r/4);

    // Accent Orbs
    doc.setFillColor(34, 211, 238); // Cyan
    doc.circle(x + r * 0.75, y - r * 0.75, r * 0.18, 'F');
    doc.setFillColor(16, 185, 129); // Emerald
    doc.circle(x - r * 0.85, y + r * 0.45, r * 0.14, 'F');
    doc.setFillColor(245, 158, 11); // Amber
    doc.circle(x + r * 0.4, y + r * 0.85, r * 0.12, 'F');
  };

  const handleExportPDF = async () => {
    setLoadingText("Synthesizing Executive Audit Instrument...");
    setIsExporting(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - (margin * 2);

      const theme = {
        primary: [79, 70, 229] as [number, number, number],
        primaryDark: [67, 56, 202] as [number, number, number],
        slate950: [2, 6, 23] as [number, number, number],
        slate900: [15, 23, 42] as [number, number, number],
        slate800: [30, 41, 59] as [number, number, number],
        slate700: [51, 65, 85] as [number, number, number],
        slate400: [148, 163, 184] as [number, number, number],
        slate200: [226, 232, 240] as [number, number, number],
        slate100: [241, 245, 249] as [number, number, number],
        slateMuted: [100, 116, 139] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number],
        dangerBg: [254, 242, 242] as [number, number, number],
        warning: [217, 119, 6] as [number, number, number],
        warningBg: [255, 251, 235] as [number, number, number],
        safe: [16, 185, 129] as [number, number, number],
        safeBg: [236, 253, 245] as [number, number, number],
      };

      // Calculate Metrics
      const criticals = result.findings.filter(f => f.severity === Severity.CRITICAL).length;
      const highs = result.findings.filter(f => f.severity === Severity.HIGH).length;
      const mediums = result.findings.filter(f => f.severity === Severity.MEDIUM).length;
      const lows = result.findings.filter(f => f.severity === Severity.LOW).length;

      const avgScore = result.categories.length > 0
        ? Math.round(result.categories.reduce((acc, c) => acc + c.score, 0) / result.categories.length)
        : 100;

      let grade = 'A+';
      if (criticals > 0 || avgScore < 50) grade = 'F';
      else if (avgScore < 65) grade = 'D';
      else if (avgScore < 75) grade = 'C';
      else if (avgScore < 85) grade = 'B';
      else if (avgScore < 95) grade = 'A';

      const verdict: 'BLOCKED' | 'CONDITIONAL' | 'READY' = criticals > 0 ? 'BLOCKED' : (highs > 0 || avgScore < 75 ? 'CONDITIONAL' : 'READY');
      const blastRadius = criticals > 0 ? 'CRITICAL' : (highs > 0 ? 'MODERATE' : 'LOW');

      let totalMonthlyWaste = 0;
      result.findings.forEach(f => {
        if (f.costSavings) {
          const m = f.costSavings.match(/\$(\d+(\.\d+)?)/);
          if (m && m[1]) totalMonthlyWaste += parseFloat(m[1]);
        }
      });
      const autoFixesCount = result.findings.filter(f => f.fix).length;
      const reportId = `DRA-${Date.now().toString().slice(-8)}`;

      // Helper for content page header banner
      const drawPageHeader = (title: string, subtitle: string) => {
        doc.setFillColor(...theme.slate950);
        doc.rect(0, 0, pageWidth, 32, 'F');
        doc.setFillColor(...theme.primary);
        doc.rect(0, 0, pageWidth, 3, 'F');

        drawEnterpriseLogo(doc, margin + 8, 16, 13);
        
        doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(255, 255, 255);
        doc.text(title, margin + 22, 16);
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...theme.slate400);
        doc.text(subtitle, margin + 22, 22);

        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...theme.slate400);
        doc.text(`ID: ${reportId}`, pageWidth - margin, 16, { align: 'right' });
        doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...theme.slateMuted);
        doc.text(`GATE: ${verdict}`, pageWidth - margin, 22, { align: 'right' });
      };

      // =========================================================================
      // --- PAGE 1: EXECUTIVE COVER PAGE ---
      // =========================================================================
      doc.setFillColor(...theme.slate950);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Top accent bar
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Decorative ambient glow behind logo
      doc.setFillColor(79, 70, 229, 0.05);
      doc.circle(pageWidth / 2, 65, 45, 'F');

      // Central Hex Shield Logo
      drawEnterpriseLogo(doc, pageWidth / 2, 65, 44);
      
      // Main Document Title
      doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(255, 255, 255);
      doc.text("DEPLOYMENT READINESS", pageWidth / 2, 102, { align: 'center' });
      doc.setFontSize(20).setTextColor(129, 140, 248); // Indigo-400
      doc.text("EXECUTIVE AUDIT BRIEF", pageWidth / 2, 112, { align: 'center' });
      
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...theme.slate400);
      doc.text("Cloud Infrastructure Security, Reliability & Compliance Governance Protocol", pageWidth / 2, 121, { align: 'center' });
      
      // Center Divider Accent Line
      doc.setDrawColor(...theme.primary);
      doc.setLineWidth(1.2);
      doc.line(pageWidth / 2 - 30, 129, pageWidth / 2 + 30, 129);

      // Verdict Stamp Box
      let stampBg = theme.safeBg;
      let stampText = theme.safe;
      let stampLabel = "PRODUCTION RELEASE APPROVED";
      let stampSub = "Zero critical architectural violations detected. Gate cleared.";
      if (verdict === 'BLOCKED') {
        stampBg = [69, 10, 10]; // Dark red
        stampText = [248, 113, 113];
        stampLabel = "PRODUCTION DEPLOYMENT BLOCKED";
        stampSub = `${criticals} critical security blocker${criticals === 1 ? '' : 's'} violate${criticals === 1 ? 's' : ''} automated release criteria.`;
      } else if (verdict === 'CONDITIONAL') {
        stampBg = [69, 39, 10]; // Dark amber
        stampText = [251, 191, 36];
        stampLabel = "CONDITIONAL READINESS - REVIEW REQUIRED";
        stampSub = `${highs} high-severity risk item${highs === 1 ? '' : 's'} require${highs === 1 ? 's' : ''} CISO / SecOps sign-off.`;
      }

      const stampY = 138;
      doc.setFillColor(stampBg[0], stampBg[1], stampBg[2]);
      doc.setDrawColor(stampText[0], stampText[1], stampText[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin + 10, stampY, contentWidth - 20, 24, 4, 4, 'FD');

      doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(stampText[0], stampText[1], stampText[2]);
      doc.text(stampLabel, pageWidth / 2, stampY + 10, { align: 'center' });
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(226, 232, 240);
      doc.text(stampSub, pageWidth / 2, stampY + 18, { align: 'center' });

      // Report Metadata Matrix (2x2 Grid with clean vertical alignment)
      const metaBoxY = 172;
      const metaBoxHeight = 40;
      doc.setFillColor(15, 23, 42); // slate-900
      doc.setDrawColor(30, 41, 59); // slate-800
      doc.setLineWidth(0.6);
      doc.roundedRect(margin + 10, metaBoxY, contentWidth - 20, metaBoxHeight, 4, 4, 'FD');

      const col1X = margin + 20;
      const col2X = pageWidth / 2 + 10;
      const row1LabelY = metaBoxY + 11;
      const row1ValY = metaBoxY + 16.5;
      const row2LabelY = metaBoxY + 25.5;
      const row2ValY = metaBoxY + 31;

      // Col 1, Row 1
      doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(...theme.slate400);
      doc.text("AUDIT REPORT ID", col1X, row1LabelY);
      doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      doc.text(reportId, col1X, row1ValY);

      // Col 2, Row 1
      doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(...theme.slate400);
      doc.text("EVALUATION ENGINE", col2X, row1LabelY);
      doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      const engineName = (result.model || 'Gemini 3.5 Flash')
        .replace('gemini-', 'Gemini ')
        .replace('flash', 'Flash')
        .replace('pro', 'Pro')
        .replace('-preview', ' Preview');
      doc.text(engineName, col2X, row1ValY);

      // Col 1, Row 2
      doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(...theme.slate400);
      doc.text("GENERATION DATE", col1X, row2LabelY);
      doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), col1X, row2ValY);

      // Col 2, Row 2
      doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(...theme.slate400);
      doc.text("CLASSIFICATION", col2X, row2LabelY);
      doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(248, 113, 113); // red-400
      doc.text("RESTRICTED // CISO EYES ONLY", col2X, row2ValY);

      // Confidentiality Disclaimer Bottom
      doc.setFontSize(8.5).setFont("helvetica", "bold").setTextColor(255, 255, 255);
      doc.text("PROPRIETARY & CONFIDENTIAL", pageWidth / 2, pageHeight - 24, { align: 'center' });
      doc.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(...theme.slate400);
      doc.text("This document contains proprietary infrastructure audit intelligence generated by Deployment Readiness Auditor.", pageWidth / 2, pageHeight - 18, { align: 'center' });
      doc.text("Unauthorized electronic distribution, copying, or dissemination is strictly prohibited.", pageWidth / 2, pageHeight - 13, { align: 'center' });

      // =========================================================================
      // --- PAGE 2: EXECUTIVE ASSESSMENT & PILLAR SCORECARD ---
      // =========================================================================
      doc.addPage();
      drawPageHeader("EXECUTIVE ASSESSMENT & SCORECARD", "Deployment Gatekeeper Verdict & Architectural Pillar Evaluation");
      
      let currentY = 40;

      // 4 Executive KPI Cards
      const cardWidth = (contentWidth - 9) / 4;
      const cardHeight = 22;

      // Card 1: Gate
      let gateColor = verdict === 'BLOCKED' ? theme.danger : (verdict === 'CONDITIONAL' ? theme.warning : theme.safe);
      let gateBg = verdict === 'BLOCKED' ? theme.dangerBg : (verdict === 'CONDITIONAL' ? theme.warningBg : theme.safeBg);
      doc.setFillColor(...gateBg);
      doc.setDrawColor(...gateColor);
      doc.setLineWidth(0.6);
      doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...gateColor).text("GATE VERDICT", margin + 5, currentY + 7);
      doc.setFontSize(11).text(verdict, margin + 5, currentY + 16);

      // Card 2: Maturity Grade
      doc.setFillColor(...theme.slate100);
      doc.setDrawColor(...theme.slate200);
      doc.roundedRect(margin + cardWidth + 3, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...theme.slate700).text("MATURITY GRADE", margin + cardWidth + 8, currentY + 7);
      doc.setFontSize(11).setTextColor(...theme.primaryDark).text(`${grade} (${avgScore}/100)`, margin + cardWidth + 8, currentY + 16);

      // Card 3: Vulnerabilities
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.roundedRect(margin + (cardWidth + 3) * 2, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...theme.danger).text("VULNERABILITIES", margin + (cardWidth + 3) * 2 + 5, currentY + 7);
      doc.setFontSize(11).text(`${criticals} Crit · ${highs} High`, margin + (cardWidth + 3) * 2 + 5, currentY + 16);

      // Card 4: FinOps Waste
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(margin + (cardWidth + 3) * 3, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...theme.safe).text("FINOPS MONTHLY WASTE", margin + (cardWidth + 3) * 3 + 5, currentY + 7);
      doc.setFontSize(11).text(`$${Math.round(totalMonthlyWaste)}/mo`, margin + (cardWidth + 3) * 3 + 5, currentY + 16);

      currentY += cardHeight + 10;

      // Section 1: Executive Summary Callout
      doc.setFontSize(12).setTextColor(...theme.slate900).setFont("helvetica", "bold");
      doc.text("1. Strategic Executive Summary", margin, currentY);
      currentY += 5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(...theme.slate200);
      doc.setLineWidth(0.4);
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 14);
      const summaryBoxHeight = Math.max((summaryLines.length * 4.8) + 12, 24);
      doc.roundedRect(margin, currentY, contentWidth, summaryBoxHeight, 3, 3, 'FD');
      doc.setFontSize(8.5).setTextColor(...theme.slate800).setFont("helvetica", "normal");
      doc.text(summaryLines, margin + 7, currentY + 7.5);
      
      currentY += summaryBoxHeight + 12;

      // Section 2: Architectural Pillar Performance Matrix
      doc.setFontSize(12).setTextColor(...theme.slate900).setFont("helvetica", "bold");
      doc.text("2. Architectural Pillar Performance Matrix", margin, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['PILLAR', 'SCORE', 'STATUS', 'STRATEGIC EVALUATION & RISK IMPACT']],
        body: result.categories.map(c => [
          c.name.toUpperCase(),
          `${c.score}/100`,
          c.status.toUpperCase(),
          { content: c.explanation || "Benchmark evaluation compliant with standard.", styles: { fontSize: 8 } }
        ]),
        theme: 'grid',
        headStyles: { fillColor: theme.slate900, fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 4 },
        styles: { fontSize: 8, cellPadding: 4.5, valign: 'middle' },
        columnStyles: { 
          0: { cellWidth: 42, fontStyle: 'bold' }, 
          1: { cellWidth: 24, halign: 'center' }, 
          2: { cellWidth: 28, halign: 'center' }, 
          3: { cellWidth: 'auto' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw as string;
            if (val === 'CRITICAL') {
              data.cell.styles.textColor = theme.danger;
              data.cell.styles.fillColor = [254, 242, 242];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'WARNING') {
              data.cell.styles.textColor = theme.warning;
              data.cell.styles.fillColor = [255, 251, 235];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'SAFE') {
              data.cell.styles.textColor = theme.safe;
              data.cell.styles.fillColor = [236, 253, 245];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // =========================================================================
      // --- PAGE 3: REGULATORY COMPLIANCE & FINOPS GOVERNANCE ---
      // =========================================================================
      doc.addPage();
      drawPageHeader("REGULATORY COMPLIANCE & FINOPS AUDIT", "Cross-Framework Verification & Cost Efficiency Projections");
      currentY = 40;

      // Extract compliance records with proper formatting
      const complianceRows: any[] = [];
      result.findings.forEach(f => {
        if (f.compliance && f.compliance.length > 0) {
          f.compliance.forEach(c => {
            complianceRows.push([
              c.standard,
              c.controlId,
              f.severity,
              { content: c.description, styles: { fontSize: 7.5 } },
              { content: c.impact || 'Audit non-compliance risk.', styles: { fontSize: 7.5, fontStyle: 'italic' as const } },
              { content: `${f.fileName || 'main.tf'}${f.lineNumber ? `:${f.lineNumber}` : ''}`, styles: { fontSize: 7.5, halign: 'center' as const } }
            ]);
          });
        }
      });

      doc.setFontSize(12).setTextColor(...theme.slate900).setFont("helvetica", "bold");
      doc.text("3. Multi-Framework Regulatory Compliance Matrix", margin, currentY);
      currentY += 6;

      if (complianceRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['FRAMEWORK', 'CONTROL', 'SEVERITY', 'REQUIREMENT DESCRIPTION', 'SECURITY & AUDIT IMPACT', 'RESOURCE']],
          body: complianceRows,
          theme: 'striped',
          headStyles: { fillColor: theme.primary, fontSize: 8, fontStyle: 'bold', cellPadding: 4, halign: 'center' },
          styles: { fontSize: 7.5, cellPadding: 4, valign: 'middle' },
          columnStyles: {
            0: { cellWidth: 32, fontStyle: 'bold' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 24, halign: 'center' },
            3: { cellWidth: 44 },
            4: { cellWidth: 36 },
            5: { cellWidth: 18, halign: 'center' }
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
              const val = data.cell.raw as string;
              if (val === Severity.CRITICAL || val === 'CRITICAL') {
                data.cell.styles.textColor = theme.danger;
                data.cell.styles.fillColor = [254, 242, 242];
                data.cell.styles.fontStyle = 'bold';
              } else if (val === Severity.HIGH || val === 'HIGH') {
                data.cell.styles.textColor = theme.warning;
                data.cell.styles.fillColor = [255, 251, 235];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;
      } else {
        doc.setFontSize(8.5).setTextColor(...theme.slateMuted).setFont("helvetica", "italic");
        doc.text("No regulatory framework violations identified for this infrastructure scope.", margin, currentY);
        currentY += 12;
      }

      // Section 4: FinOps Cost Waste Optimization Table
      if (currentY > pageHeight - 65) {
        doc.addPage();
        drawPageHeader("FINOPS GOVERNANCE & COST OPTIMIZATION", "Resource Sizing & Monthly Waste Remediation");
        currentY = 40;
      }

      doc.setFontSize(12).setTextColor(...theme.slate900).setFont("helvetica", "bold");
      doc.text("4. FinOps Cost Waste & Remediation Projection", margin, currentY);
      currentY += 6;

      const costFindings = result.findings.filter(f => f.costSavings || f.category.toLowerCase().includes('cost'));
      const costRows = (costFindings.length > 0 ? costFindings : result.findings.slice(0, 3)).map(f => [
        f.title,
        f.costSavings || '$0/mo',
        f.fileName || 'main.tf',
        f.remediation
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['COST / SIZING OBSERVATION', 'POTENTIAL SAVINGS', 'TARGET RESOURCE', 'FINOPS RECOMMENDATION']],
        body: costRows,
        theme: 'grid',
        headStyles: { fillColor: theme.slate900, fontSize: 8, fontStyle: 'bold', cellPadding: 4, halign: 'center' },
        styles: { fontSize: 7.5, cellPadding: 4, valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 46, fontStyle: 'bold' },
          1: { cellWidth: 28, halign: 'center', textColor: theme.safe, fontStyle: 'bold' },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 'auto' }
        }
      });

      // =========================================================================
      // --- SECTION 5: TECHNICAL OBSERVATION LOG & REMEDIATION HCL ---
      // =========================================================================
      currentY = (doc as any).lastAutoTable.finalY + 12;
      
      // If remaining height on Page 3 is too small to start findings, move to Page 4
      if (currentY > pageHeight - 80) {
        doc.addPage();
        drawPageHeader("TECHNICAL FINDINGS & REMEDIATION LOG", "Actionable Security Observations and Infrastructure as Code Fixes");
        currentY = 40;
      }

      doc.setFontSize(12).setTextColor(...theme.slate900).setFont("helvetica", "bold");
      doc.text("5. Comprehensive Technical Observations Log", margin, currentY);
      currentY += 6;

      const technicalRows = result.findings.map(f => {
        const complianceText = f.compliance?.map(c => `• ${c.standard}: ${c.controlId} - ${c.description}`).join('\n') || 'Architectural Best Practice.';
        const context = `FILE: ${f.fileName || 'main.tf'}\nLINE: ${f.lineNumber || 'N/A'}\nPILLAR: ${f.category}`;
        
        let observationContent = `${f.title.toUpperCase()}\n\n${f.description}\n\nREMEDIATION STRATEGY:\n${f.remediation}\n\nCOMPLIANCE CONTROLS:\n${complianceText}`;
        
        if (f.fix) {
          observationContent += `\n\nCODE REMEDIATION (HCL):\n${f.fix}`;
        }

        return [
          { content: `${f.severity.toUpperCase()}`, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
          { content: context, styles: { fontSize: 7.5, fontStyle: 'italic' as const } },
          { content: observationContent, styles: { fontSize: 7.5 } }
        ];
      });

      const findingStartPage = doc.internal.pages.length - 1;

      autoTable(doc, {
        startY: currentY,
        margin: { top: 38, left: margin, right: margin, bottom: 18 },
        head: [['SEVERITY', 'RESOURCE CONTEXT', 'OBSERVATION, REMEDIATION & CODE FIX']],
        body: technicalRows,
        theme: 'striped',
        rowPageBreak: 'avoid', // Crucial: prevents individual findings from being sliced across page breaks!
        headStyles: { fillColor: theme.primary, fontSize: 8, fontStyle: 'bold', cellPadding: 4, halign: 'center' },
        styles: { fontSize: 7.5, cellPadding: 4.5, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 24, halign: 'center' },
          1: { cellWidth: 34 }, 
          2: { cellWidth: 'auto' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const val = data.cell.text[0];
            if (val.includes('CRITICAL')) {
              data.cell.styles.fillColor = [254, 242, 242];
              data.cell.styles.textColor = theme.danger;
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('HIGH')) {
              data.cell.styles.fillColor = [255, 251, 235];
              data.cell.styles.textColor = theme.warning;
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('MEDIUM')) {
              data.cell.styles.fillColor = [240, 249, 255];
              data.cell.styles.textColor = [3, 105, 161];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: (data) => {
          // If autoTable created a new page during pagination, draw header banner
          if (data.pageNumber > findingStartPage) {
            drawPageHeader("TECHNICAL FINDINGS & REMEDIATION LOG", "Actionable Security Observations and Infrastructure as Code Fixes");
          }
        }
      });

      // =========================================================================
      // --- SECTION 6: GOVERNANCE SIGN-OFF BLOCK ---
      // =========================================================================
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      // If remaining height on current page is insufficient for sign-off block (needs 46mm), add page
      if (finalY > pageHeight - 55) {
        doc.addPage();
        drawPageHeader("GOVERNANCE & AUDIT SIGN-OFF", "Formal Release Gate Attestation & Approvals");
        finalY = 42;
      }

      doc.setFontSize(11).setTextColor(...theme.slate900).setFont("helvetica", "bold");
      doc.text("6. Formal Enterprise Governance & Release Sign-Off", margin, finalY);
      finalY += 6;

      const signBoxWidth = (contentWidth - 8) / 3;
      const signBoxHeight = 35;

      const roles = [
        { role: "LEAD INFRASTRUCTURE AUDITOR", desc: "Technical Verification & Static Analysis", action: "[ X ] AUDIT COMPLETED" },
        { role: "CHIEF INFORMATION SECURITY OFFICER", desc: "Security Gate Attestation", action: verdict === 'BLOCKED' ? "[ X ] RELEASE REJECTED" : "[   ] RELEASE APPROVED" },
        { role: "VP OF ENGINEERING / RELEASE LEAD", desc: "Deployment Promotion Authorization", action: "[   ] OVERRIDE / PROCEED" },
      ];

      roles.forEach((r, idx) => {
        const boxX = margin + idx * (signBoxWidth + 4);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(...theme.slate200);
        doc.setLineWidth(0.4);
        doc.roundedRect(boxX, finalY, signBoxWidth, signBoxHeight, 3, 3, 'FD');

        doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...theme.slate900);
        doc.text(r.role, boxX + 4, finalY + 6);
        doc.setFont("helvetica", "normal").setFontSize(6.5).setTextColor(...theme.slateMuted);
        doc.text(r.desc, boxX + 4, finalY + 10);

        // Signature Line
        doc.setDrawColor(...theme.slate400);
        doc.setLineWidth(0.3);
        doc.line(boxX + 4, finalY + 22, boxX + signBoxWidth - 4, finalY + 22);
        doc.setFont("helvetica", "italic").setFontSize(6).setTextColor(...theme.slateMuted);
        doc.text("Signature & Date", boxX + 4, finalY + 26);

        // Attestation Box
        doc.setFont("helvetica", "bold").setFontSize(6.5).setTextColor(...theme.primaryDark);
        doc.text(r.action, boxX + 4, finalY + 32);
      });

      // =========================================================================
      // --- RUNNING FOOTER ON ALL CONTENT PAGES (PAGE 2 ONWARDS) ---
      // =========================================================================
      const totalPages = doc.internal.pages.length - 1;
      const exportDateStr = new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric'
      });

      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Subtle divider line
        doc.setDrawColor(...theme.slate200);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        
        doc.setFontSize(7.5).setTextColor(...theme.slateMuted);
        
        // Left zone: System & Report ID
        doc.setFont("helvetica", "normal");
        doc.text(`DRA Auditor v2.5  |  ID: ${reportId}  |  ${exportDateStr}`, margin, pageHeight - 7.5);
        
        // Center zone: Confidentiality Classification
        doc.setFont("helvetica", "bold");
        doc.text(`STRICTLY CONFIDENTIAL`, pageWidth / 2, pageHeight - 7.5, { align: 'center' });
        
        // Right zone: Page numbering
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
      }

      doc.save(`DRA_Executive_Audit_${reportId}.pdf`);
    } catch (error) {
      console.error("Enterprise PDF Export Failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="space-y-8 animate-enter bg-slate-50 dark:bg-slate-950/20 p-6 md:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex items-center gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Audit Summary Report</h2>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> {new Date().toLocaleDateString()}</span>
                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Architecture Integrity Verified</span>
                    <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                    <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Engine: {(result.model || 'gemini-3.5-flash').replace('gemini-', 'Gemini ').replace('-preview', ' Preview').replace('flash', 'Flash').replace('pro', 'Pro').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                </div>
            </div>
            {isDemo && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Showcase Mockup
              </div>
            )}
        </div>
        <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRemediationModal(true)}
              className="group relative flex items-center gap-2.5 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-black shadow-xl transition-all shadow-emerald-500/20 active:scale-95"
              title="View and download automated HCL fixes & Git patches"
            >
              <GitPullRequest className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Remediation Bundle</span>
            </button>
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

      {/* Deployment Verdict & Executive Gatekeeper Banner */}
      <DeploymentVerdictBanner findings={result.findings} categories={result.categories} />

      {/* Primary Scorecard & Risk Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-5 h-full">
             <ScoreCard findings={result.findings} summary={result.summary} />
        </div>
        <div className="xl:col-span-7 h-full">
            <RiskCharts categories={result.categories} />
        </div>
      </div>

      {/* Interactive Mermaid Topology Diagram */}
      {result.diagram && (
        <div className="w-full">
          <DiagramView code={result.diagram} />
        </div>
      )}

      {/* FinOps Cost Optimization */}
      <CostImpact findings={result.findings} />

      {/* Regulatory Compliance Matrix */}
      <ComplianceMatrix findings={result.findings} />
      
      {/* Detailed Technical Findings Log */}
      <div className="w-full">
         <FindingsList findings={result.findings} />
      </div>

      {/* Automated Remediation Modal */}
      <RemediationModal
        isOpen={showRemediationModal}
        onClose={() => setShowRemediationModal(false)}
        findings={result.findings}
      />
    </div>
  );
};