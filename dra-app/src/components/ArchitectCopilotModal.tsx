import React, { useState } from 'react';
import { Bot, Send, Sparkles, Loader2, ShieldAlert } from 'lucide-react';
import { AuditResult, ChatMessage, Finding } from '../types';
import { anonymizeHcl, deanonymizeText } from '../services/dlpService';
import { ModalDialog } from './ModalDialog';

interface ArchitectCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: AuditResult;
  focusedFinding?: Finding | null;
  rawCode?: string;
  aliasMap?: Record<string, string>;
}

export const ArchitectCopilotModal: React.FC<ArchitectCopilotModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  focusedFinding,
  rawCode,
  aliasMap = {}
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const quickPrompts = focusedFinding
    ? [
        `How do I apply "${focusedFinding.title}" without downtime or state replacement?`,
        `Explain the real-world attack path and blast radius for this finding.`,
        `Write a complete production Terraform module snippet resolving this control.`
      ]
    : [
        'Prioritize the top 3 changes I should merge first to unblock production.',
        'How can I cut monthly GCP spend on this architecture using CUDs & Private Google Access?',
        'Design a zero-trust VPC & IAM boundary refactor for these resources.'
      ];

  const sendQuestion = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setQuestion('');
    setIsLoading(true);

    try {
      const dlpQ = anonymizeHcl(trimmed);
      const dlpSnippet = rawCode ? anonymizeHcl(rawCode.slice(0, 4000)) : null;
      const mergedMap = { ...aliasMap, ...dlpQ.aliasMap, ...(dlpSnippet?.aliasMap || {}) };

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: dlpQ.sanitizedCode,
          finding: focusedFinding || undefined,
          auditSummary: auditResult.summary,
          codeSnippet: dlpSnippet?.sanitizedCode,
          history: messages,
          llmProvider: auditResult.provider,
          llmModel: auditResult.model
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }

      const restoredAnswer = deanonymizeText(data.answer, mergedMap);
      setMessages([
        ...updatedHistory,
        { role: 'assistant', content: restoredAnswer, timestamp: Date.now() }
      ]);
    } catch (err: any) {
      setMessages([
        ...updatedHistory,
        {
          role: 'assistant',
          content: `⚠️ Architect Co-Pilot Error: ${err.message || 'Failed to generate guidance.'}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Ask the Principal Cloud Architect"
      subtitle={
        focusedFinding
          ? `Focused on: [${focusedFinding.severity}] ${focusedFinding.title}`
          : 'Interactive GCP Well-Architected & Terraform Migration Co-Pilot'
      }
      icon={<Bot className="w-6 h-6" />}
      maxWidthClass="max-w-3xl"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(question);
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about zero-downtime state moves, IAM least privilege, PSC, or FinOps..."
            aria-label="Question for Principal Cloud Architect"
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
            Ask
          </button>
        </form>
      }
    >
      <div className="space-y-5">
        {focusedFinding && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                {focusedFinding.title} ({focusedFinding.fileName || 'main.tf'}:{focusedFinding.lineNumber || 1})
              </p>
              <p className="text-slate-600 dark:text-slate-300">{focusedFinding.description}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendQuestion(qp)}
              disabled={isLoading}
              className="text-left text-xs px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
              <span>{qp}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 min-h-[220px]">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Select a suggested prompt above or type a specific Terraform / Google Cloud question below.
              All prompts are automatically scrubbed by Client-Side DLP before transmission.
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white ml-8'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mr-4 font-sans'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1.5">
                  {m.role === 'user' ? 'You' : 'DRA Principal Architect'}
                </div>
                {m.content}
              </div>
            ))
          )}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" aria-hidden="true" />
              Synthesizing zero-downtime architecture guidance...
            </div>
          )}
        </div>
      </div>
    </ModalDialog>
  );
};
