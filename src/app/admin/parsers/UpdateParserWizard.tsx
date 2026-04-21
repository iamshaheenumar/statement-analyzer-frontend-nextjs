'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Upload, Loader2, Bot, AlertCircle, CheckCircle2,
  ArrowRight, Minus, Plus, RefreshCw, Pencil,
} from 'lucide-react';
import { updateParserConfigAction } from '@/app/actions/admin';
import type { ParserConfigData } from '@/lib/parsers/configParser';

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

type WizardStep = 'upload' | 'diff';

function existingAsConfig(config: Record<string, unknown>): ParserConfigData {
  return config as unknown as ParserConfigData;
}

function kpLabel(kp: number | undefined): string {
  return kp != null ? `Page ${kp} only` : 'Any page';
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
    { key: 'rowPattern', label: 'Row Pattern', mono: true, ex: existing.rowPattern, pr: proposed.rowPattern },
    {
      key: 'groups', label: 'Group Assignments', mono: true,
      ex: `date=${existing.groups.date} desc=${existing.groups.description} amt=${existing.groups.amount}${existing.groups.creditFlag ? ` flag=${existing.groups.creditFlag}` : ''}`,
      pr: `date=${proposed.groups.date} desc=${proposed.groups.description} amt=${proposed.groups.amount}${proposed.groups.creditFlag ? ` flag=${proposed.groups.creditFlag}` : ''}`,
    },
    { key: 'dateFormat', label: 'Date Format', mono: true, ex: existing.dateFormat, pr: proposed.dateFormat },
    { key: 'creditFlag', label: 'Credit Flag', mono: true, ex: existing.creditFlag || '', pr: proposed.creditFlag || '' },
    { key: 'creditKeywords', label: 'Credit Keywords', ex: (existing.creditKeywords || []).join(', '), pr: (proposed.creditKeywords || []).join(', ') },
    { key: 'periodFrom', label: 'Period From Regex', mono: true, ex: existing.periodFrom || '', pr: proposed.periodFrom || '' },
    { key: 'periodTo', label: 'Period To Regex', mono: true, ex: existing.periodTo || '', pr: proposed.periodTo || '' },
    { key: 'dueDatePattern', label: 'Due Date Regex', mono: true, ex: existing.dueDatePattern || '', pr: proposed.dueDatePattern || '' },
    { key: 'keywordsPage', label: 'Keyword Search Scope', ex: kpLabel(existing.keywordsPage), pr: kpLabel(proposed.keywordsPage) },
    { key: 'columnHeaders', label: 'Column Headers', ex: (existing.columnHeaders || []).join(', '), pr: (proposed.columnHeaders || []).join(', ') },
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
    rowPattern: get('rowPattern'),
    groups,
    dateFormat: get('dateFormat'),
    creditFlag: get('creditFlag') || undefined,
    creditKeywords: creditKws.length ? creditKws : undefined,
    periodFrom: get('periodFrom') || undefined,
    periodTo: get('periodTo') || undefined,
    dueDatePattern: get('dueDatePattern') || undefined,
    columnHeaders: get('columnHeaders').split(',').map(h => h.trim()).filter(Boolean) || undefined,
  };
}

const STATUS_STYLES: Record<FieldStatus, { badge: string; row: string }> = {
  same: {
    badge: 'bg-elevated text-text-muted border-border/50',
    row: '',
  },
  changed: {
    badge: 'bg-warning-muted text-warning border-warning/20',
    row: 'border-l-2 border-warning/40 pl-3',
  },
  added: {
    badge: 'bg-success-muted text-success border-success/20',
    row: 'border-l-2 border-success/40 pl-3',
  },
};

function StatusBadge({ status }: { status: FieldStatus }) {
  const icons = { same: <CheckCircle2 className="w-3 h-3" />, changed: <RefreshCw className="w-3 h-3" />, added: <Plus className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${STATUS_STYLES[status].badge}`}>
      {icons[status]} {status}
    </span>
  );
}

function DiffRow({
  diff, onEdit,
}: {
  diff: FieldDiff;
  onEdit: (key: string, value: string) => void;
}) {
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
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          {expanded ? 'collapse' : 'edit'}
        </button>
      </div>

      {diff.status === 'changed' && (
        <div className="flex items-start gap-2 mb-2 text-xs">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-muted mb-0.5 uppercase font-mono tracking-widest">Existing</p>
            <p className={`${cls} line-through opacity-60`}>{diff.existingValue || <em className="opacity-40">empty</em>}</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-warning mt-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-muted mb-0.5 uppercase font-mono tracking-widest">Proposed</p>
            <p className={cls}>{diff.proposedValue || <em className="opacity-40">empty</em>}</p>
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
        <p className={`${cls} opacity-60`}>{diff.existingValue || <em className="opacity-40 text-xs">empty</em>}</p>
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
          ) : diff.key === 'rowPattern' || diff.mono ? (
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

export default function UpdateParserWizard({
  parser, onClose,
}: {
  parser: ParserRow;
  onClose: () => void;
}) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [diffs, setDiffs] = useState<FieldDiff[]>([]);
  const [saving, startSave] = useTransition();

  const changedCount = diffs.filter(d => d.status !== 'same').length;

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
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Analysis failed');
      }
      const analysis: GuidedAnalysis = await res.json();
      const existing = existingAsConfig(parser.config);
      const proposed = buildProposedConfig(analysis);
      setDiffs(computeDiff(existing, proposed));
      setStep('diff');
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

  function handleSave() {
    const config = rebuildConfig(diffs);
    const keywords = config.keywords;
    startSave(async () => {
      try {
        await updateParserConfigAction(parser.id, config, keywords);
        toast.success(`Parser "${parser.bank}" updated.`);
        onClose();
      } catch (err: unknown) {
        toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
  }

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

      <div className="px-6 py-6">
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Upload a newer statement for <strong className="text-text-primary">{parser.bank}</strong>. AI will analyze it and show you what has changed compared to the current parser configuration.
            </p>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Bank Statement PDF</label>
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border hover:border-warning hover:bg-warning-muted/20 rounded-xl transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-text-muted shrink-0" />
                <span className="text-sm text-text-muted truncate">{file ? file.name : 'Click to select PDF'}</span>
                <input
                  type="file" accept="application/pdf" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">PDF Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-warning hover:bg-warning/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {loading ? 'Analyzing…' : 'Analyze & Compare'}
            </button>
          </div>
        )}

        {step === 'diff' && diffs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {changedCount === 0
                    ? 'No differences found — parser is up to date.'
                    : `${changedCount} field${changedCount !== 1 ? 's' : ''} differ from the current parser.`}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Review each change. Edit any field before saving.
                </p>
              </div>
              {changedCount > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleAcceptAll}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-success-muted text-success hover:bg-success/10 border border-success/20 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept all
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-elevated text-text-muted hover:text-text-secondary border border-border rounded-lg transition-colors"
                  >
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
                <p className="text-xs text-warning">
                  Saving will overwrite the current parser configuration. Make sure all fields are correct before proceeding.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-warning hover:bg-warning/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving…' : 'Save Updates'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
