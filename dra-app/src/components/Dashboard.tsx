import React, { useRef, useState, useMemo } from 'react';
import { AuditResult, Finding, GEMINI_MODEL, HistoryItem, Severity } from '../types';
import { ScoreCard } from './ScoreCard';
import { RiskCharts } from './RiskCharts';
import { FindingsList } from './FindingsList';
import { CostImpact } from './CostImpact';
import { DiagramView } from './DiagramView';
import { RemediationModal } from './RemediationModal';
import { ArchitectCopilotModal } from './ArchitectCopilotModal';
import { DeploymentVerdictBanner } from './DeploymentVerdictBanner';
import { ComplianceMatrix } from './ComplianceMatrix';
import { downloadTextFile } from '../services/remediationService';
import {
  Calendar,
  Loader2,
  ShieldCheck,
  Share2,
  FileText,
  Sparkles,
  GitPullRequest,
  Bot,
  Check,
  GitCompare,
  Scale,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  result: AuditResult;
  isDemo?: boolean;
  originalCode?: string;
  aliasMap?: Record<string, string>;
  comparedBaseline?: HistoryItem | null;
  onClearComparison?: () => void;
  onJumpToLine?: (fileName: string | undefined, line: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  result,
  isDemo = false,
  originalCode,
  aliasMap,
  comparedBaseline,
  onClearComparison,
  onJumpToLine
}) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingText, setLoadingText] = useState('Generating Report...');
  const [showRemediationModal, setShowRemediationModal] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotFinding, setCopilotFinding] = useState<Finding | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const deltaStats = useMemo(() => {
    if (!comparedBaseline) return null;
    const avg = (cats: AuditResult['categories']) =>
      cats.length > 0 ? Math.round(cats.reduce((s, c) => s + c.score, 0) / cats.length) : 100;
    const currScore = avg(result.categories);
    const prevScore = avg(comparedBaseline.result.categories);
    const scoreDiff = currScore - prevScore;

    const currCrit = result.findings.filter((f) => f.severity === Severity.CRITICAL).length;
    const prevCrit = comparedBaseline.result.findings.filter(
      (f) => f.severity === Severity.CRITICAL
    ).length;

    return {
      currScore,
      prevScore,
      scoreDiff,
      critDiff: currCrit - prevCrit,
      totalDiff: result.findings.length - comparedBaseline.result.findings.length,
      baselineDate: new Date(comparedBaseline.timestamp).toLocaleString()
    };
  }, [result, comparedBaseline]);

  const handleShareBrief = async () => {
    const avgScore =
      result.categories.length > 0
        ? Math.round(result.categories.reduce((acc, c) => acc + c.score, 0) / result.categories.length)
        : 100;
    const criticals = result.findings.filter((f) => f.severity === Severity.CRITICAL).length;
    const highs = result.findings.filter((f) => f.severity === Severity.HIGH).length;
    const verdict =
      criticals > 0 ? 'BLOCKED' : highs > 0 || avgScore < 75 ? 'CONDITIONAL' : 'READY';

    const md = [
      `# 🛡️ DRA Deployment Readiness Summary — ${verdict} (${avgScore}/100)`,
      `- **Date:** ${new Date().toISOString()}`,
      `- **Engine:** ${result.model || GEMINI_MODEL}`,
      `- **Findings:** ${criticals} Critical | ${highs} High | ${result.findings.length} Total`,
      result.finops
        ? `- **FinOps Savings Potential:** $${result.finops.potentialMonthlySavingsUsd.toFixed(2)}/mo (${result.finops.region})`
        : '',
      '',
      `## Executive Summary`,
      result.summary,
      '',
      `## Pillar Scores`,
      ...result.categories.map((c) => `- **${c.name}**: ${c.score}/100 (${c.status})`)
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(md);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      downloadTextFile(`dra-snapshot-${Date.now().toString().slice(-6)}.md`, md);
    }
  };

  const drawEnterpriseLogo = (doc: jsPDF, x: number, y: number, size: number) => {
    const r = size / 2;
    doc.setFillColor(79, 70, 229);
    doc.circle(x, y, r * 0.9, 'F');

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.line(x - r / 3, y - r / 4, x, y + r / 2);
    doc.line(x, y + r / 2, x + r / 3, y - r / 4);
    doc.line(x - r / 3, y - r / 4, x, y - r / 2);
    doc.line(x, y - r / 2, x + r / 3, y - r / 4);

    doc.setFillColor(34, 211, 238);
    doc.circle(x + r * 0.75, y - r * 0.75, r * 0.18, 'F');
    doc.setFillColor(16, 185, 129);
    doc.circle(x - r * 0.85, y + r * 0.45, r * 0.14, 'F');
  };

  const handleExportPDF = async () => {
    setLoadingText('Synthesizing Executive Audit Instrument...');
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;

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
        safeBg: [236, 253, 245] as [number, number, number]
      };

      const criticals = result.findings.filter((f) => f.severity === Severity.CRITICAL).length;
      const highs = result.findings.filter((f) => f.severity === Severity.HIGH).length;

      const avgScore =
        result.categories.length > 0
          ? Math.round(
              result.categories.reduce((acc, c) => acc + c.score, 0) / result.categories.length
            )
          : 100;

      let grade = 'A+';
      if (criticals > 0 || avgScore < 50) grade = 'F';
      else if (avgScore < 65) grade = 'D';
      else if (avgScore < 75) grade = 'C';
      else if (avgScore < 85) grade = 'B';
      else if (avgScore < 95) grade = 'A';

      const verdict: 'BLOCKED' | 'CONDITIONAL' | 'READY' =
        criticals > 0 ? 'BLOCKED' : highs > 0 || avgScore < 75 ? 'CONDITIONAL' : 'READY';

      let totalMonthlyWaste = result.finops?.potentialMonthlySavingsUsd || 0;
      if (totalMonthlyWaste === 0) {
        result.findings.forEach((f) => {
          if (f.costSavings) {
            const m = f.costSavings.match(/\$(\d+(\.\d+)?)/);
            if (m && m[1]) totalMonthlyWaste += parseFloat(m[1]);
          }
        });
      }
      const reportId = `DRA-${Date.now().toString().slice(-8)}`;

      const drawPageHeader = (title: string, subtitle: string) => {
        doc.setFillColor(...theme.slate950);
        doc.rect(0, 0, pageWidth, 32, 'F');
        doc.setFillColor(...theme.primary);
        doc.rect(0, 0, pageWidth, 3, 'F');

        drawEnterpriseLogo(doc, margin + 8, 16, 13);
        doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(255, 255, 255);
        doc.text(title, margin + 22, 16);
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...theme.slate400);
        doc.text(subtitle, margin + 22, 22);

        doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...theme.slate400);
        doc.text(`ID: ${reportId}`, pageWidth - margin, 16, { align: 'right' });
        doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...theme.slateMuted);
        doc.text(`GATE: ${verdict}`, pageWidth - margin, 22, { align: 'right' });
      };

      // Cover Page
      doc.setFillColor(...theme.slate950);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setFillColor(...theme.primary);
      doc.rect(0, 0, pageWidth, 5, 'F');
      drawEnterpriseLogo(doc, pageWidth / 2, 65, 44);

      doc.setFont('helvetica', 'bold').setFontSize(24).setTextColor(255, 255, 255);
      doc.text('DEPLOYMENT READINESS', pageWidth / 2, 102, { align: 'center' });
      doc.setFontSize(20).setTextColor(129, 140, 248);
      doc.text('EXECUTIVE AUDIT BRIEF (v3.0)', pageWidth / 2, 112, { align: 'center' });
      doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...theme.slate400);
      doc.text(
        'Hybrid Deterministic AST & AI Cloud Governance Protocol',
        pageWidth / 2,
        121,
        { align: 'center' }
      );

      let stampBg = theme.safeBg;
      let stampText = theme.safe;
      let stampLabel = 'PRODUCTION RELEASE APPROVED';
      let stampSub = 'Zero critical architectural violations detected. Gate cleared.';
      if (verdict === 'BLOCKED') {
        stampBg = [69, 10, 10];
        stampText = [248, 113, 113];
        stampLabel = 'PRODUCTION DEPLOYMENT BLOCKED';
        stampSub = `${criticals} critical security blocker(s) violate automated release criteria.`;
      } else if (verdict === 'CONDITIONAL') {
        stampBg = [69, 39, 10];
        stampText = [251, 191, 36];
        stampLabel = 'CONDITIONAL READINESS - REVIEW REQUIRED';
        stampSub = `${highs} high-severity risk item(s) require CISO / SecOps sign-off.`;
      }

      const stampY = 138;
      doc.setFillColor(stampBg[0], stampBg[1], stampBg[2]);
      doc.setDrawColor(stampText[0], stampText[1], stampText[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin + 10, stampY, contentWidth - 20, 24, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...stampText);
      doc.text(stampLabel, pageWidth / 2, stampY + 10, { align: 'center' });
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(226, 232, 240);
      doc.text(stampSub, pageWidth / 2, stampY + 18, { align: 'center' });

      const metaBoxY = 172;
      doc.setFillColor(15, 23, 42);
      doc.setDrawColor(30, 41, 59);
      doc.roundedRect(margin + 10, metaBoxY, contentWidth - 20, 40, 4, 4, 'FD');
      const col1X = margin + 20;
      const col2X = pageWidth / 2 + 10;
      doc.setFontSize(7).setFont('helvetica', 'bold').setTextColor(...theme.slate400);
      doc.text('AUDIT REPORT ID', col1X, metaBoxY + 11);
      doc.setFontSize(9).setTextColor(255, 255, 255).text(reportId, col1X, metaBoxY + 16.5);
      doc.setFontSize(7).setTextColor(...theme.slate400).text('EVALUATION ENGINE', col2X, metaBoxY + 11);
      doc
        .setFontSize(9)
        .setTextColor(255, 255, 255)
        .text(result.model || GEMINI_MODEL, col2X, metaBoxY + 16.5);
      doc.setFontSize(7).setTextColor(...theme.slate400).text('GENERATION DATE', col1X, metaBoxY + 25.5);
      doc
        .setFontSize(9)
        .setTextColor(255, 255, 255)
        .text(new Date().toLocaleDateString('en-GB'), col1X, metaBoxY + 31);
      doc.setFontSize(7).setTextColor(...theme.slate400).text('CLASSIFICATION', col2X, metaBoxY + 25.5);
      doc
        .setFontSize(9)
        .setTextColor(248, 113, 113)
        .text('RESTRICTED // CISO EYES ONLY', col2X, metaBoxY + 31);

      // Page 2: Scorecard
      doc.addPage();
      drawPageHeader(
        'EXECUTIVE ASSESSMENT & SCORECARD',
        'Deployment Gatekeeper Verdict & Architectural Pillar Evaluation'
      );
      let currentY = 40;
      const cardWidth = (contentWidth - 9) / 4;
      const cardHeight = 22;
      const gateColor =
        verdict === 'BLOCKED' ? theme.danger : verdict === 'CONDITIONAL' ? theme.warning : theme.safe;
      const gateBg =
        verdict === 'BLOCKED'
          ? theme.dangerBg
          : verdict === 'CONDITIONAL'
            ? theme.warningBg
            : theme.safeBg;

      doc.setFillColor(...gateBg).setDrawColor(...gateColor).roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(...gateColor).text('GATE VERDICT', margin + 5, currentY + 7);
      doc.setFontSize(11).text(verdict, margin + 5, currentY + 16);

      doc.setFillColor(...theme.slate100).setDrawColor(...theme.slate200).roundedRect(margin + cardWidth + 3, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFontSize(7).setTextColor(...theme.slate700).text('MATURITY GRADE', margin + cardWidth + 8, currentY + 7);
      doc.setFontSize(11).setTextColor(...theme.primaryDark).text(`${grade} (${avgScore}/100)`, margin + cardWidth + 8, currentY + 16);

      doc.setFillColor(254, 242, 242).setDrawColor(252, 165, 165).roundedRect(margin + (cardWidth + 3) * 2, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFontSize(7).setTextColor(...theme.danger).text('VULNERABILITIES', margin + (cardWidth + 3) * 2 + 5, currentY + 7);
      doc.setFontSize(11).text(`${criticals} Crit · ${highs} High`, margin + (cardWidth + 3) * 2 + 5, currentY + 16);

      doc.setFillColor(236, 253, 245).setDrawColor(167, 243, 208).roundedRect(margin + (cardWidth + 3) * 3, currentY, cardWidth, cardHeight, 3, 3, 'FD');
      doc.setFontSize(7).setTextColor(...theme.safe).text('FINOPS MONTHLY WASTE', margin + (cardWidth + 3) * 3 + 5, currentY + 7);
      doc.setFontSize(11).text(`$${Math.round(totalMonthlyWaste)}/mo`, margin + (cardWidth + 3) * 3 + 5, currentY + 16);

      currentY += cardHeight + 10;
      doc.setFontSize(12).setTextColor(...theme.slate900).setFont('helvetica', 'bold').text('1. Strategic Executive Summary', margin, currentY);
      currentY += 5;
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth - 14);
      const summaryBoxHeight = Math.max(summaryLines.length * 4.8 + 12, 24);
      doc.setFillColor(248, 250, 252).setDrawColor(...theme.slate200).roundedRect(margin, currentY, contentWidth, summaryBoxHeight, 3, 3, 'FD');
      doc.setFontSize(8.5).setTextColor(...theme.slate800).setFont('helvetica', 'normal').text(summaryLines, margin + 7, currentY + 7.5);
      currentY += summaryBoxHeight + 10;

      doc.setFontSize(12).setTextColor(...theme.slate900).setFont('helvetica', 'bold').text('2. Architectural Pillar Performance Matrix', margin, currentY);
      currentY += 5;
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['PILLAR', 'SCORE', 'STATUS', 'STRATEGIC EVALUATION & RISK IMPACT']],
        body: result.categories.map((c) => [
          c.name.toUpperCase(),
          `${c.score}/100`,
          c.status.toUpperCase(),
          c.explanation || 'Benchmark evaluation compliant with standard.'
        ]),
        theme: 'grid',
        headStyles: { fillColor: theme.slate900, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 4 }
      });

      // Technical Findings Page
      doc.addPage();
      drawPageHeader(
        'TECHNICAL FINDINGS & REMEDIATION LOG',
        'Hybrid AST & AI Security Observations and IaC Remediations'
      );
      autoTable(doc, {
        startY: 40,
        margin: { top: 38, left: margin, right: margin, bottom: 18 },
        head: [['SEVERITY', 'RESOURCE CONTEXT', 'OBSERVATION, REMEDIATION & CODE FIX']],
        body: result.findings.map((f) => [
          f.severity.toUpperCase(),
          `${f.fileName || 'main.tf'}:${f.lineNumber || 1}\n[${f.source || 'hybrid'}]`,
          `${f.title}\n\n${f.description}\n\nFix:\n${f.fix || f.remediation}`
        ]),
        theme: 'striped',
        rowPageBreak: 'avoid',
        headStyles: { fillColor: theme.primary, fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 4 }
      });

      // Waived Risk Exceptions (if any)
      if (result.waivedFindings && result.waivedFindings.length > 0) {
        doc.addPage();
        drawPageHeader(
          'ACCEPTED RISK EXCEPTIONS (.DRA.YAML)',
          'Time-Bounded Waivers Attested by Security Governance'
        );
        autoTable(doc, {
          startY: 40,
          margin: { left: margin, right: margin },
          head: [['FINDING', 'SEVERITY', 'REASON', 'APPROVED BY', 'EXPIRES']],
          body: result.waivedFindings.map((w) => [
            w.title,
            w.severity,
            w.waiverReason || 'N/A',
            w.waiverApprovedBy || 'SecOps',
            w.waiverExpires || 'Unbounded'
          ]),
          theme: 'grid',
          headStyles: { fillColor: theme.slate900, fontSize: 8 },
          styles: { fontSize: 7.5 }
        });
      }

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5).setTextColor(...theme.slateMuted);
        doc.text(`DRA v3.0  |  ID: ${reportId}`, margin, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
          align: 'right'
        });
      }

      doc.save(`DRA_Executive_Audit_${reportId}.pdf`);
    } catch (error) {
      console.error('Enterprise PDF Export Failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formattedEngine = (result.model || GEMINI_MODEL)
    .replace('gemini-', 'Gemini ')
    .replace('dra-deterministic-ast-v3', 'Deterministic AST v3')
    .replace('-preview', ' Preview')
    .replace('flash', 'Flash')
    .replace('pro', 'Pro');

  return (
    <div
      ref={dashboardRef}
      className="space-y-8 animate-enter bg-slate-50 dark:bg-slate-950/20 p-6 md:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl"
    >
      {/* Top Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                Audit Summary Report
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" aria-hidden="true" />{' '}
                {new Date().toLocaleDateString()}
              </span>
              <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Engine: {formattedEngine}
              </span>
              {typeof result.staticFindingsCount === 'number' && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {result.staticFindingsCount} AST Rules Anchored
                </span>
              )}
            </div>
          </div>

          {isDemo && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Showcase Mockup
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCopilotFinding(null);
              setCopilotOpen(true);
            }}
            className="flex items-center gap-2.5 px-5 py-3.5 bg-white dark:bg-slate-900 hover:border-indigo-500 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
          >
            <Bot className="w-4 h-4" aria-hidden="true" />
            Ask Architect
          </button>

          <button
            type="button"
            onClick={() => setShowRemediationModal(true)}
            className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-emerald-500/20 transition-all"
          >
            <GitPullRequest className="w-4 h-4" aria-hidden="true" />
            Remediation Diff &amp; Patch
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-70"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="w-4 h-4" aria-hidden="true" />
            )}
            {isExporting ? loadingText : 'Export CISO PDF'}
          </button>

          <button
            type="button"
            onClick={handleShareBrief}
            aria-label="Copy Markdown audit summary to clipboard"
            title="Copy Markdown Executive Summary to clipboard"
            className="flex items-center gap-2 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm text-xs font-bold"
          >
            {shareCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied Brief!</span>
              </>
            ) : (
              <Share2 className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Historical Drift & Delta Comparison Banner */}
      {deltaStats && (
        <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
              <GitCompare className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Historical Drift Comparison vs Baseline ({deltaStats.baselineDate})
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                <span>
                  Maturity Score: {deltaStats.prevScore} → {deltaStats.currScore}{' '}
                  <span
                    className={
                      deltaStats.scoreDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }
                  >
                    ({deltaStats.scoreDiff >= 0 ? `+${deltaStats.scoreDiff}` : deltaStats.scoreDiff} pts)
                  </span>
                </span>
                <span>•</span>
                <span>
                  Critical Blockers:{' '}
                  <span
                    className={
                      deltaStats.critDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }
                  >
                    {deltaStats.critDiff > 0 ? `+${deltaStats.critDiff}` : deltaStats.critDiff}
                  </span>
                </span>
                <span>•</span>
                <span>
                  Total Findings:{' '}
                  {deltaStats.totalDiff > 0 ? `+${deltaStats.totalDiff}` : deltaStats.totalDiff}
                </span>
              </div>
            </div>
          </div>
          {onClearComparison && (
            <button
              type="button"
              onClick={onClearComparison}
              aria-label="Clear baseline comparison"
              className="p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-500"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Deployment Verdict Banner */}
      <DeploymentVerdictBanner findings={result.findings} categories={result.categories} />

      {/* Scorecard & Risk Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-5 h-full">
          <ScoreCard findings={result.findings} summary={result.summary} />
        </div>
        <div className="xl:col-span-7 h-full">
          <RiskCharts categories={result.categories} />
        </div>
      </div>

      {/* Mermaid Topology Diagram */}
      {result.diagram && (
        <div className="w-full">
          <DiagramView code={result.diagram} />
        </div>
      )}

      {/* FinOps Cloud Billing Intelligence */}
      <CostImpact findings={result.findings} finops={result.finops} />

      {/* Regulatory Compliance Matrix */}
      <ComplianceMatrix findings={result.findings} />

      {/* Detailed Findings List */}
      <div className="w-full">
        <FindingsList
          findings={result.findings}
          onJumpToLine={onJumpToLine}
          onAskArchitect={(finding) => {
            setCopilotFinding(finding);
            setCopilotOpen(true);
          }}
        />
      </div>

      {/* Accepted Organization Waivers (.dra.yaml) */}
      {result.waivedFindings && result.waivedFindings.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-800/40 space-y-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Accepted Risk Waivers ({result.waivedFindings.length}) — Logged for CISO Attestation
            </h3>
          </div>
          <div className="divide-y divide-amber-200/50 dark:divide-amber-900/30 text-xs">
            {result.waivedFindings.map((wf) => (
              <div key={wf.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    [{wf.severity}] {wf.title}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Justification: {wf.waiverReason}
                  </p>
                </div>
                <div className="text-right font-mono text-[11px] text-amber-700 dark:text-amber-300">
                  <div>Approved by: {wf.waiverApprovedBy || 'Security Lead'}</div>
                  {wf.waiverExpires && <div>Expires: {wf.waiverExpires}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RemediationModal
        isOpen={showRemediationModal}
        onClose={() => setShowRemediationModal(false)}
        findings={result.findings}
        originalCode={originalCode}
      />

      <ArchitectCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        auditResult={result}
        focusedFinding={copilotFinding}
        rawCode={originalCode}
        aliasMap={aliasMap}
      />
    </div>
  );
};
