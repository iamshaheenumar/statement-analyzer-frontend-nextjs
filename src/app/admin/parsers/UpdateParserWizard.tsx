'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Upload, Loader2, Bot, AlertCircle, CheckCircle2,
  ArrowRight, Minus, Plus, RefreshCw, Pencil, FlaskConical,
} from 'lucide-react';
import { updateParserConfigAction } from '@/app/actions/admin';
import type { ParserConfigData } from '@/lib/parsers/configParser';
import type { ParseResult, PageContent } from '@/lib/pdf/types';
import PatternField from './PatternField';

interface ParserRow {
  id: string;
  bank: string;
  keywords: string[];
  config: Record<string, unknown>;
}

interface GuidedAnalysis {
  bankName: string;
  cardType: 'credit' | 'debit';
  currency: string;
  columnHeaders?: string[];
  identification: { keywords: string[]; sampleLines: string[] };
  statementPeriod: {
    fromDate: string | null; toDate: string | null; dueDate: string | null;
    fromPattern: string | null; toPattern: string | null; dueDatePattern: string | null;
    sampleLines: string[];
  };
  transactionStructure: {
    rowPattern: string;
    groups: { date: number; description: number; amount: number; creditFlag?: number };
    dateFormat: string;
    sampleMatchedLines: string[]; sampleUnmatchedLines: string[];
  };
  creditDebitRules: {
    creditFlag: string | null; creditKeywords: string[];
    sampleCreditLines: string[]; sampleDebitLines: string[];
  };
  transactions: Array<{ transaction_date: string; description: string; debit: number; credit: number; currency: string }>;
}

type FieldStatus = 'same' | 'changed' | 'added';

interface FieldDiff {
  key: string;
  label: string;
  mono: boolean;
  existingValue: string;
  proposedValue: string;
  status: FieldStatus;
  editValue: string;
}

type AnalyzeStep = 'upload' | 'diff';
type ActiveTab = 'analyze' | 'edit' | 'test';

function existingAsConfig(config: Record<string, unknown>): ParserConfigData {
  return config as unknown as ParserConfigData;
}

function kpLabel(kp: number | undefined): string {
  return kp != null ? `Page ${kp} only` : 'Any page';
}

function normalizePattern(p: string | string[] | undefined): string {
  if (!p) return '';
  return Array.isArray(p) ? p.join('\n') : p;
}

function parsePattern(text: string): string | string[] {
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  return lines.length > 1 ? lines : (lines[0] ?? '');
}

function buildProposedConfig(a: GuidedAnalysis): ParserConfigData {
  const g: ParserConfigData['groups'] = {
    date: a.transactionStructure.groups.date,
    description: a.transactionStructure.groups.description,
    amount: a.transactionStructure.groups.amount,
  };
  if (a.transactionStructure.groups.creditFlag) {
    g.creditFlag = a.transactionStructure.groups.creditFlag;
  }
  return {
    bankName: a.bankName,
    cardType: a.cardType,
    currency: a.currency,
    keywords: a.identification.keywords,
    rowPattern: a.transactionStructure.rowPattern,
    groups: g,
    dateFormat: a.transactionStructure.dateFormat,
    creditKeywords: a.creditDebitRules.creditKeywords.length ? a.creditDebitRules.creditKeywords : undefined,
    creditFlag: a.creditDebitRules.creditFlag || undefined,
    periodFrom: a.statementPeriod.fromPattern || undefined,
    periodTo: a.statementPeriod.toPattern || undefined,
    dueDatePattern: a.statementPeriod.dueDatePattern || undefined,
    columnHeaders: a.columnHeaders?.length ? a.columnHeaders : undefined,
  };
}

function computeDiff(existing: ParserConfigData, proposed: ParserConfigData): FieldDiff[] {
  type FieldSpec = { key: string; label: string; mono?: boolean; ex: string; pr: string };
  const specs: FieldSpec[] = [
    { key: 'bankName', label: 'Bank Name', ex: existing.bankName, pr: proposed.bankName },
    { key: 'cardType', label: 'Card Type', ex: existing.cardType, pr: proposed.cardType },
    { key: 'currency', label: 'Currency', ex: existing.currency || '', pr: proposed.currency || '' },
    { key: 'keywords', label: 'Detection Keywords', ex: existing.keywords.join(', '), pr: proposed.keywords.join(', ') },
    { key: 'rowPattern', label: 'Row Pattern', mono: true, ex: normalizePattern(existing.rowPattern), pr: normalizePattern(proposed.rowPattern) },
    {
      key: 'groups', label: 'Group Assignments', mono: true,
      ex: `date=${existing.groups.date} desc=${existing.groups.description} amt=${existing.groups.amount}${existing.groups.creditFlag ? ` flag=${existing.groups.creditFlag}` : ''}`,
      pr: `date=${proposed.groups.date} desc=${proposed.groups.description} amt=${proposed.groups.amount}${proposed.groups.creditFlag ? ` flag=${proposed.groups.creditFlag}` : ''}`,
    },
    { key: 'dateFormat', label: 'Date Format', mono: true, ex: existing.dateFormat, pr: proposed.dateFormat },
    { key: 'creditFlag', label: 'Credit Flag', mono: true, ex: existing.creditFlag || '', pr: proposed.creditFlag || '' },
    { key: 'creditKeywords', label: 'Credit Keywords', ex: (existing.creditKeywords || []).join(', '), pr: (proposed.creditKeywords || []).join(', ') },
    { key: 'periodFrom', label: 'Period From Regex', mono: true, ex: normalizePattern(existing.periodFrom), pr: normalizePattern(proposed.periodFrom) },
    { key: 'periodTo', label: 'Period To Regex', mono: true, ex: normalizePattern(existing.periodTo), pr: normalizePattern(proposed.periodTo) },
    { key: 'dueDatePattern', label: 'Due Date Regex', mono: true, ex: normalizePattern(existing.dueDatePattern), pr: normalizePattern(proposed.dueDatePattern) },
    { key: 'issuedDatePattern', label: 'Issued Date Regex', mono: true, ex: normalizePattern(existing.issuedDatePattern), pr: normalizePattern(proposed.issuedDatePattern) },
    { key: 'keywordsPage', label: 'Keyword Search Scope', ex: kpLabel(existing.keywordsPage), pr: kpLabel(proposed.keywordsPage) },
    { key: 'columnHeaders', label: 'Column Headers', ex: (existing.columnHeaders || []).join(', '), pr: (proposed.columnHeaders || []).join(', ') },
    { key: 'cardVariantPattern', label: 'Card Variant Pattern', mono: true, ex: existing.cardVariantPattern || '', pr: proposed.cardVariantPattern || '' },
    { key: 'creditLimitPattern', label: 'Credit Limit Pattern', mono: true, ex: existing.creditLimitPattern || '', pr: proposed.creditLimitPattern || '' },
    { key: 'availableCreditPattern', label: 'Available Credit Pattern', mono: true, ex: existing.availableCreditPattern || '', pr: proposed.availableCreditPattern || '' },
    { key: 'minPaymentPattern', label: 'Min Payment Pattern', mono: true, ex: existing.minPaymentPattern || '', pr: proposed.minPaymentPattern || '' },
    { key: 'totalOutstandingPattern', label: 'Total Outstanding Pattern', mono: true, ex: existing.totalOutstandingPattern || '', pr: proposed.totalOutstandingPattern || '' },
    { key: 'totalAmountDuePattern', label: 'Total Amount Due Pattern', mono: true, ex: existing.totalAmountDuePattern || '', pr: proposed.totalAmountDuePattern || '' },
  ];

  return specs.map(f => {
    let status: FieldStatus;
    if (f.ex === f.pr) status = 'same';
    else if (!f.ex && f.pr) status = 'added';
    else status = 'changed';
    return {
      key: f.key,
      label: f.label,
      mono: f.mono ?? false,
      existingValue: f.ex,
      proposedValue: f.pr,
      status,
      editValue: f.pr !== undefined ? f.pr : f.ex,
    };
  });
}

function rebuildConfig(diffs: FieldDiff[]): ParserConfigData {
  const get = (key: string) => diffs.find(d => d.key === key)?.editValue ?? '';

  const groupsStr = get('groups');
  const gm = groupsStr.match(/date=(\d+).*desc=(\d+).*amt=(\d+)(?:.*flag=(\d+))?/);
  const groups: ParserConfigData['groups'] = {
    date: gm ? parseInt(gm[1]) : 1,
    description: gm ? parseInt(gm[2]) : 2,
    amount: gm ? parseInt(gm[3]) : 3,
  };
  if (gm?.[4]) groups.creditFlag = parseInt(gm[4]);

  const kws = get('keywords').split(',').map(k => k.trim()).filter(Boolean);
  const creditKws = get('creditKeywords').split(',').map(k => k.trim()).filter(Boolean);
  const kpRaw = get('keywordsPage').toLowerCase();
  const keywordsPage: number | undefined = kpRaw.includes('page 1') ? 1 : undefined;

  return {
    bankName: get('bankName'),
    cardType: (get('cardType') as 'credit' | 'debit') || 'credit',
    currency: get('currency') || 'AED',
    keywords: kws,
    keywordsPage,
    rowPattern: parsePattern(get('rowPattern')),
    groups,
    dateFormat: get('dateFormat'),
    creditFlag: get('creditFlag') || undefined,
    creditKeywords: creditKws.length ? creditKws : undefined,
    periodFrom: parsePattern(get('periodFrom')) || undefined,
    periodTo: parsePattern(get('periodTo')) || undefined,
    dueDatePattern: parsePattern(get('dueDatePattern')) || undefined,
    issuedDatePattern: parsePattern(get('issuedDatePattern')) || undefined,
    columnHeaders: get('columnHeaders').split(',').map(h => h.trim()).filter(Boolean) || undefined,
    cardVariantPattern: get('cardVariantPattern') || undefined,
    creditLimitPattern: get('creditLimitPattern') || undefined,
    availableCreditPattern: get('availableCreditPattern') || undefined,
    minPaymentPattern: get('minPaymentPattern') || undefined,
    totalOutstandingPattern: get('totalOutstandingPattern') || undefined,
    totalAmountDuePattern: get('totalAmountDuePattern') || undefined,
  };
}

const STATUS_STYLES: Record<FieldStatus, { badge: string; row: string }> = {
  same: { badge: 'bg-elevated text-text-muted border-border/50', row: '' },
  changed: { badge: 'bg-warning-muted text-warning border-warning/20', row: 'border-l-2 border-warning/40 pl-3' },
  added: { badge: 'bg-success-muted text-success border-success/20', row: 'border-l-2 border-success/40 pl-3' },
};

function StatusBadge({ status }: { status: FieldStatus }) {
  const icons = { same: <CheckCircle2 className="w-3 h-3" />, changed: <RefreshCw className="w-3 h-3" />, added: <Plus className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${STATUS_STYLES[status].badge}`}>
      {icons[status]} {status}
    </span>
  );
}

function DiffRow({ diff, onEdit }: { diff: FieldDiff; onEdit: (key: string, value: string) => void }) {
  const [expanded, setExpanded] = useState(diff.status !== 'same');
  const cls = diff.mono
    ? 'font-mono text-[11px] text-text-secondary bg-base border border-border rounded px-2 py-1 break-all'
    : 'text-sm text-text-secondary';

  return (
    <div className={`py-3 ${STATUS_STYLES[diff.status].row}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">{diff.label}</span>
          <StatusBadge status={diff.status} />
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-[11px] text-text-muted hover:text-text-secondary transition-colors">
          {expanded ? 'collapse' : 'edit'}
        </button>
      </div>

      {diff.status === 'changed' && (
        <div className="flex items-start gap-2 mb-2 text-xs">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-muted mb-0.5 uppercase font-mono tracking-widest">Existing</p>
            <p className={`${cls} line-through opacity-60 whitespace-pre-wrap`}>{diff.existingValue || <em className="opacity-40">empty</em>}</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-warning mt-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-muted mb-0.5 uppercase font-mono tracking-widest">Proposed</p>
            <p className={`${cls} whitespace-pre-wrap`}>{diff.proposedValue || <em className="opacity-40">empty</em>}</p>
          </div>
        </div>
      )}

      {diff.status === 'added' && (
        <div className="mb-2">
          <p className="text-[11px] text-text-muted mb-0.5 uppercase font-mono tracking-widest">New value</p>
          <p className={cls}>{diff.proposedValue}</p>
        </div>
      )}

      {diff.status === 'same' && !expanded && (
        <p className={`${cls} opacity-60 whitespace-pre-wrap`}>{diff.existingValue || <em className="opacity-40 text-xs">empty</em>}</p>
      )}

      {expanded && (
        <div className="mt-2">
          <p className="text-[11px] text-text-muted mb-1 uppercase font-mono tracking-widest">Edit final value</p>
          {diff.key === 'keywordsPage' ? (
            <div className="flex gap-2">
              {(['Any page', 'Page 1 only'] as const).map(label => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onEdit(diff.key, label)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    diff.editValue === label
                      ? 'bg-accent text-black border-accent'
                      : 'bg-elevated text-text-muted border-border hover:text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : diff.mono ? (
            <textarea
              value={diff.editValue}
              onChange={e => onEdit(diff.key, e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          ) : (
            <input
              value={diff.editValue}
              onChange={e => onEdit(diff.key, e.target.value)}
              className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}
        </div>
      )}
    </div>
  );
}

function calcScore(result: ParseResult, config: ParserConfigData): number {
  let score = result.transactions.length > 0 ? 50 : 0;
  if (result.from_date) score += 15;
  if (result.to_date) score += 15;
  const checks = [
    [config.cardVariantPattern, result.card_variant],
    [config.creditLimitPattern, result.credit_limit],
    [config.availableCreditPattern, result.available_credit],
    [config.minPaymentPattern, result.min_payment_due],
    [config.totalOutstandingPattern, result.total_outstanding],
    [config.totalAmountDuePattern, result.total_amount_due],
  ] as [unknown, unknown][];
  const defined = checks.filter(([p]) => !!p);
  const found = defined.filter(([, v]) => v !== null && v !== undefined);
  score += defined.length > 0 ? Math.round((found.length / defined.length) * 20) : 20;
  return score;
}

export default function UpdateParserWizard({ parser, onClose }: { parser: ParserRow; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');

  // ── Analyze tab state ──────────────────────────────────────────────────────
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffs, setDiffs] = useState<FieldDiff[]>([]);
  const [saving, startSave] = useTransition();

  const changedCount = diffs.filter(d => d.status !== 'same').length;

  // ── Edit tab state ─────────────────────────────────────────────────────────
  const [editConfig, setEditConfig] = useState<ParserConfigData>(() => existingAsConfig(parser.config));
  const [editSaving, startEditSave] = useTransition();

  // ── Test tab state ─────────────────────────────────────────────────────────
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testPassword, setTestPassword] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ result: ParseResult; score: number } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // ── Analyze tab handlers ───────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    try {
      const { extractPdfPages } = await import('@/services/parsePDF');
      const pages = await extractPdfPages(file, password || undefined);
      const res = await fetch('/api/ai-parse-guided', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((data?.error as string) ?? 'Analysis failed');
      }
      const analysis: GuidedAnalysis = await res.json();
      const existing = existingAsConfig(parser.config);
      const proposed = buildProposedConfig(analysis);
      setDiffs(computeDiff(existing, proposed));
      setAnalyzeStep('diff');
    } catch (err: unknown) {
      toast.error(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  function handleEditField(key: string, value: string) {
    setDiffs(prev => prev.map(d => d.key === key ? { ...d, editValue: value } : d));
  }

  function handleAcceptAll() {
    setDiffs(prev => prev.map(d => ({ ...d, editValue: d.proposedValue || d.existingValue })));
  }

  function handleRejectAll() {
    setDiffs(prev => prev.map(d => ({ ...d, editValue: d.existingValue })));
  }

  function handleSaveAnalyzed() {
    const config = rebuildConfig(diffs);
    startSave(async () => {
      try {
        await updateParserConfigAction(parser.id, config, config.keywords);
        toast.success(`Parser "${parser.bank}" updated.`);
        onClose();
      } catch (err: unknown) {
        toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
  }

  // ── Edit tab handlers ──────────────────────────────────────────────────────

  function updateEditConfig(patch: Partial<ParserConfigData>) {
    setEditConfig(prev => ({ ...prev, ...patch }));
  }

  function handleSaveEdit() {
    startEditSave(async () => {
      try {
        await updateParserConfigAction(parser.id, editConfig, editConfig.keywords);
        toast.success(`Parser "${parser.bank}" updated.`);
        onClose();
      } catch (err: unknown) {
        toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
  }

  // ── Test tab handlers ──────────────────────────────────────────────────────

  async function handleTest() {
    if (!testFile) return;
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      const { extractPdfPages } = await import('@/services/parsePDF');
      const rawPages = await extractPdfPages(testFile, testPassword || undefined);
      const pages: PageContent[] = rawPages.map(p => ({ ...p, text: p.lines.join('\n') }));
      const { parseWithConfig } = await import('@/lib/parsers/configParser');
      // Use editConfig if user has made edits, otherwise use existing
      const configToTest = editConfig;
      const result = parseWithConfig(pages, configToTest);
      setTestResult({ result, score: calcScore(result, configToTest) });
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTestLoading(false);
    }
  }

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'analyze', label: 'Analyze New Statement', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'edit', label: 'Edit Config', icon: <Pencil className="w-3.5 h-3.5" /> },
    { id: 'test', label: 'Test Statement', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="border border-warning/20 rounded-2xl bg-surface shadow-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-warning-muted/30">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-bold font-display text-text-primary">
            Update Parser — <span className="text-warning">{parser.bank}</span>
          </h3>
        </div>
        <button onClick={onClose} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
          Cancel
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border bg-base px-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-warning text-warning'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-6">
        {/* ── Analyze tab ──────────────────────────────────────────────────── */}
        {activeTab === 'analyze' && (
          <>
            {analyzeStep === 'upload' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Upload a newer statement for <strong className="text-text-primary">{parser.bank}</strong>. AI will analyze it and show what changed compared to the current config.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Statement PDF</label>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border hover:border-warning hover:bg-warning-muted/20 rounded-xl transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="text-sm text-text-muted truncate">{file ? file.name : 'Click to select PDF'}</span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">PDF Password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted"
                  />
                </div>
                <button
                  onClick={handleAnalyze} disabled={!file || loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-warning hover:bg-warning/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {loading ? 'Analyzing…' : 'Analyze & Compare'}
                </button>
              </div>
            )}

            {analyzeStep === 'diff' && diffs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {changedCount === 0
                        ? 'No differences found — parser is up to date.'
                        : `${changedCount} field${changedCount !== 1 ? 's' : ''} differ from the current parser.`}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">Review each change. Edit any field before saving.</p>
                  </div>
                  {changedCount > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={handleAcceptAll} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-success-muted text-success hover:bg-success/10 border border-success/20 rounded-lg transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept all
                      </button>
                      <button onClick={handleRejectAll} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-elevated text-text-muted hover:text-text-secondary border border-border rounded-lg transition-colors">
                        <Minus className="w-3.5 h-3.5" /> Keep existing
                      </button>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-base px-4">
                  {diffs.map(diff => (
                    <DiffRow key={diff.key} diff={diff} onEdit={handleEditField} />
                  ))}
                </div>

                {changedCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-warning-muted/40 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-warning">Saving will overwrite the current parser configuration. Make sure all fields are correct.</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button onClick={() => setAnalyzeStep('upload')} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors">
                    Back
                  </button>
                  <button
                    onClick={handleSaveAnalyzed} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 bg-warning hover:bg-warning/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving…' : 'Save Updates'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Edit Config tab ───────────────────────────────────────────────── */}
        {activeTab === 'edit' && (
          <div className="space-y-5">
            <p className="text-sm text-text-secondary">
              Edit regex patterns directly. Use the Test Statement tab to verify changes before saving.
            </p>

            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Identity</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Bank Name</label>
                  <input
                    value={editConfig.bankName}
                    onChange={e => updateEditConfig({ bankName: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Card Type</label>
                  <div className="flex gap-2 mt-1">
                    {(['credit', 'debit'] as const).map(t => (
                      <button key={t} onClick={() => updateEditConfig({ cardType: t })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${editConfig.cardType === t ? 'bg-accent text-black border-accent' : 'bg-elevated text-text-muted border-border'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Detection Keywords (comma-separated)</label>
                <input
                  value={editConfig.keywords.join(', ')}
                  onChange={e => updateEditConfig({ keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Currency</label>
                  <input
                    value={editConfig.currency || ''}
                    onChange={e => updateEditConfig({ currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Date Format</label>
                  <input
                    value={editConfig.dateFormat}
                    onChange={e => updateEditConfig({ dateFormat: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Transaction Pattern</h4>
              <PatternField
                label="Row Pattern"
                value={editConfig.rowPattern}
                onChange={v => updateEditConfig({ rowPattern: v })}
              />
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Group Assignments <span className="text-text-muted font-normal">(date= desc= amt= flag=)</span>
                </label>
                <input
                  value={`date=${editConfig.groups.date} desc=${editConfig.groups.description} amt=${editConfig.groups.amount}${editConfig.groups.creditFlag != null ? ` flag=${editConfig.groups.creditFlag}` : ''}`}
                  onChange={e => {
                    const m = e.target.value.match(/date=(\d+).*desc=(\d+).*amt=(\d+)(?:.*flag=(\d+))?/);
                    if (!m) return;
                    const groups: ParserConfigData['groups'] = { date: +m[1], description: +m[2], amount: +m[3] };
                    if (m[4]) groups.creditFlag = +m[4];
                    updateEditConfig({ groups });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Date Patterns</h4>
              <PatternField label="Period From" value={editConfig.periodFrom ?? ''} onChange={v => updateEditConfig({ periodFrom: v || undefined })} />
              <PatternField label="Period To" value={editConfig.periodTo ?? ''} onChange={v => updateEditConfig({ periodTo: v || undefined })} />
              <PatternField label="Issued Date" value={editConfig.issuedDatePattern ?? ''} onChange={v => updateEditConfig({ issuedDatePattern: v || undefined })} />
              <PatternField label="Due Date" value={editConfig.dueDatePattern ?? ''} onChange={v => updateEditConfig({ dueDatePattern: v || undefined })} />
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Summary Field Patterns</h4>
              <p className="text-xs text-text-muted">Each regex must capture the value in group 1, e.g. <code className="font-mono bg-elevated px-1 rounded">Credit Limit[:\s]+([\d,]+)</code></p>
              <PatternField label="Card Variant" value={editConfig.cardVariantPattern ?? ''} onChange={v => updateEditConfig({ cardVariantPattern: v || undefined })} />
              <PatternField label="Credit Limit" value={editConfig.creditLimitPattern ?? ''} onChange={v => updateEditConfig({ creditLimitPattern: v || undefined })} />
              <PatternField label="Available Credit" value={editConfig.availableCreditPattern ?? ''} onChange={v => updateEditConfig({ availableCreditPattern: v || undefined })} />
              <PatternField label="Min Payment Due" value={editConfig.minPaymentPattern ?? ''} onChange={v => updateEditConfig({ minPaymentPattern: v || undefined })} />
              <PatternField label="Total Outstanding" value={editConfig.totalOutstandingPattern ?? ''} onChange={v => updateEditConfig({ totalOutstandingPattern: v || undefined })} />
              <PatternField label="Total Amount Due" value={editConfig.totalAmountDuePattern ?? ''} onChange={v => updateEditConfig({ totalAmountDuePattern: v || undefined })} />
            </section>

            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Credit / Debit Rules</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Credit Flag</label>
                  <input
                    value={editConfig.creditFlag || ''}
                    onChange={e => updateEditConfig({ creditFlag: e.target.value || undefined })}
                    placeholder="CR"
                    className="w-full px-3 py-2 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Credit Keywords</label>
                  <input
                    value={(editConfig.creditKeywords || []).join(', ')}
                    onChange={e => updateEditConfig({ creditKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) || undefined })}
                    placeholder="refund, cashback, reversal"
                    className="w-full px-3 py-2 text-xs text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => setActiveTab('test')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors border border-border"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Test first
              </button>
              <button
                onClick={handleSaveEdit} disabled={editSaving}
                className="flex items-center gap-2 px-5 py-2 bg-warning hover:bg-warning/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
              >
                {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editSaving ? 'Saving…' : 'Save Config'}
              </button>
            </div>
          </div>
        )}

        {/* ── Test Statement tab ────────────────────────────────────────────── */}
        {activeTab === 'test' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Upload a PDF to test the current config (including any edits made in Edit Config).
            </p>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Statement PDF</label>
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 rounded-xl transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-text-muted shrink-0" />
                <span className="text-sm text-text-muted truncate">{testFile ? testFile.name : 'Click to select PDF'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={e => { setTestFile(e.target.files?.[0] ?? null); setTestResult(null); }} />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">PDF Password</label>
              <input
                type="password" value={testPassword} onChange={e => setTestPassword(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted"
              />
            </div>
            <button
              onClick={handleTest} disabled={!testFile || testLoading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
            >
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              {testLoading ? 'Running…' : 'Run Test'}
            </button>

            {testError && (
              <div className="flex items-start gap-2 p-3 bg-danger-muted/40 border border-danger/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                <p className="text-xs text-danger">{testError}</p>
              </div>
            )}

            {testResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Transactions', value: testResult.result.transactions.length },
                    { label: 'Date Range', value: testResult.result.from_date && testResult.result.to_date ? `${testResult.result.from_date} – ${testResult.result.to_date}` : '—' },
                    { label: 'Score', value: `${testResult.score}%` },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-base border border-border rounded-xl">
                      <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>

                {testResult.result.transactions.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead className="bg-base sticky top-0">
                          <tr className="border-b border-border">
                            <th className="text-left px-3 py-2 font-semibold text-text-muted">Date</th>
                            <th className="text-left px-3 py-2 font-semibold text-text-muted">Description</th>
                            <th className="text-right px-3 py-2 font-semibold text-text-muted">Debit</th>
                            <th className="text-right px-3 py-2 font-semibold text-text-muted">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {testResult.result.transactions.map((t, i) => (
                            <tr key={i} className="bg-surface hover:bg-elevated">
                              <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">{t.transaction_date}</td>
                              <td className="px-3 py-1.5 text-text-primary truncate max-w-[200px]">{t.description}</td>
                              <td className="px-3 py-1.5 text-right text-text-secondary">{t.debit ? t.debit.toFixed(2) : ''}</td>
                              <td className="px-3 py-1.5 text-right text-success">{t.credit ? t.credit.toFixed(2) : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {testResult.result.transactions.length === 0 && (
                  <div className="flex items-start gap-2 p-3 bg-warning-muted/40 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-warning">
                      No transactions found. Check the Row Pattern in{' '}
                      <button onClick={() => setActiveTab('edit')} className="underline font-semibold">Edit Config</button>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
