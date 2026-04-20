'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Upload, Loader2, Bot, Check, ChevronRight, ChevronLeft,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import { createAdminParserAction } from '@/app/actions/admin';
import type { ParserConfigData } from '@/lib/parsers/configParser';

interface GuidedAnalysis {
  bankName: string;
  cardType: 'credit' | 'debit';
  currency: string;
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

type WizardStep = 'upload' | 'bank' | 'dates' | 'transactions' | 'rules' | 'preview';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'bank', label: 'Bank Identity' },
  { id: 'dates', label: 'Statement Dates' },
  { id: 'transactions', label: 'Transaction Pattern' },
  { id: 'rules', label: 'Dr / Cr Rules' },
  { id: 'preview', label: 'Preview & Save' },
];

function StepBar({ current }: { current: WizardStep }) {
  const ci = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center mb-6 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            i < ci ? 'bg-elevated text-text-primary' :
            i === ci ? 'bg-accent text-black' :
            'bg-base text-text-muted border border-border'
          }`}>
            {i < ci ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 h-px mx-1 shrink-0 ${i < ci ? 'bg-elevated' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SampleBox({ lines, label, variant = 'neutral' }: {
  lines: string[]; label: string;
  variant?: 'neutral' | 'match' | 'nomatch' | 'credit' | 'debit';
}) {
  if (!lines.length) return null;
  const cls = {
    neutral: 'bg-base border-border text-text-secondary',
    match: 'bg-success-muted border-success/20 text-success',
    nomatch: 'bg-danger-muted border-danger/20 text-danger',
    credit: 'bg-success-muted border-success/20 text-success',
    debit: 'bg-warning-muted border-warning/20 text-warning',
  }[variant];
  return (
    <div>
      <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-1.5">{label}</p>
      <div className="space-y-1">
        {lines.map((l, i) => (
          <code key={i} className={`block text-xs rounded px-2.5 py-1.5 overflow-x-auto whitespace-pre font-mono border ${cls}`}>{l}</code>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

const BASE = 'w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-text-muted transition';
const MONO = BASE + ' font-mono';

function AiNote({ text }: { text: string }) {
  return (
    <p className="text-xs text-accent bg-accent-muted border border-accent/20 rounded-lg px-3 py-2">{text}</p>
  );
}

function NavButtons({
  onBack, onNext, nextDisabled, isLast, onSave, saving,
}: {
  onBack?: () => void; onNext?: () => void; nextDisabled?: boolean;
  isLast?: boolean; onSave?: () => void; saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
      <button
        onClick={onBack}
        disabled={!onBack}
        className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      {isLast ? (
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-success hover:bg-success/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save Parser'}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function UploadStep({
  file, setFile, password, setPassword, loading, onAnalyze,
}: {
  file: File | null; setFile: (f: File | null) => void;
  password: string; setPassword: (p: string) => void;
  loading: boolean; onAnalyze: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Upload a sample statement PDF. AI will analyze it and walk you through each detail — bank identity, dates, transaction pattern, and debit/credit rules — step by step.
      </p>
      <Field label="Bank Statement PDF">
        <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border hover:border-accent hover:bg-accent-muted/30 rounded-xl transition-colors cursor-pointer">
          <Upload className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-sm text-text-muted truncate">{file ? file.name : 'Click to select PDF'}</span>
          <input
            type="file" accept="application/pdf" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </Field>
      <Field label="PDF Password" hint="Leave blank if the PDF is not password-protected.">
        <input
          type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Optional"
          className={BASE}
        />
      </Field>
      <button
        onClick={onAnalyze}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors shadow-[0_0_20px_#00d4ff33]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
        {loading ? 'Analyzing statement with AI…' : 'Analyze with AI'}
      </button>
    </div>
  );
}

function BankStep({
  analysis, bankName, setBankName, cardType, setCardType,
  currency, setCurrency, keywords, setKeywords, onBack, onNext,
}: {
  analysis: GuidedAnalysis;
  bankName: string; setBankName: (v: string) => void;
  cardType: 'credit' | 'debit'; setCardType: (v: 'credit' | 'debit') => void;
  currency: string; setCurrency: (v: string) => void;
  keywords: string; setKeywords: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <AiNote text="AI identified these details from the statement. Review and correct anything that looks wrong." />
      <Field label="Bank Name">
        <input value={bankName} onChange={(e) => setBankName(e.target.value)}
          className={BASE} placeholder="e.g. HDFC Bank" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Card Type">
          <select value={cardType} onChange={(e) => setCardType(e.target.value as 'credit' | 'debit')}
            className={BASE}>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </Field>
        <Field label="Currency" hint="ISO code (AED, INR, USD…)">
          <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className={BASE} placeholder="AED" maxLength={3} />
        </Field>
      </div>
      <Field label="Detection Keywords" hint="Comma-separated. Unique words/phrases from this bank's PDFs used to auto-match future uploads.">
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)}
          className={BASE} placeholder="hdfc bank, credit card statement" />
      </Field>
      <SampleBox lines={analysis.identification.sampleLines} label="Lines containing these keywords" variant="match" />
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!bankName.trim()} />
    </div>
  );
}

function DatesStep({
  analysis,
  fromDate, setFromDate, toDate, setToDate, dueDate, setDueDate,
  fromPattern, setFromPattern, toPattern, setToPattern,
  dueDatePattern, setDueDatePattern,
  onBack, onNext,
}: {
  analysis: GuidedAnalysis;
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  dueDate: string; setDueDate: (v: string) => void;
  fromPattern: string; setFromPattern: (v: string) => void;
  toPattern: string; setToPattern: (v: string) => void;
  dueDatePattern: string; setDueDatePattern: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <AiNote text="AI extracted the statement period and due date. The regex patterns are used to pull these from any future statement of this type." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Statement From">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={BASE} />
        </Field>
        <Field label="Statement To">
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={BASE} />
        </Field>
        <Field label="Payment Due Date">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={BASE} />
        </Field>
      </div>
      <Field label="From Date Regex" hint="Group 1 must capture the from-date string. Leave blank if not present.">
        <input value={fromPattern} onChange={(e) => setFromPattern(e.target.value)}
          className={MONO} placeholder={`Statement From\\s*([\\d/]+)`} />
      </Field>
      <Field label="To Date Regex" hint="Group 1 must capture the to-date string.">
        <input value={toPattern} onChange={(e) => setToPattern(e.target.value)}
          className={MONO} placeholder={`Statement To\\s*([\\d/]+)`} />
      </Field>
      <Field label="Due Date Regex" hint="Optional. Group 1 captures the payment due date.">
        <input value={dueDatePattern} onChange={(e) => setDueDatePattern(e.target.value)}
          className={MONO} placeholder={`Payment Due.*?([\\d/]+)`} />
      </Field>
      <SampleBox lines={analysis.statementPeriod.sampleLines} label="Sample lines containing these dates" />
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function TransactionsStep({
  analysis,
  rowPattern, setRowPattern,
  groupDate, setGroupDate, groupDesc, setGroupDesc,
  groupAmount, setGroupAmount, groupCreditFlag, setGroupCreditFlag,
  dateFormat, setDateFormat,
  onBack, onNext,
}: {
  analysis: GuidedAnalysis;
  rowPattern: string; setRowPattern: (v: string) => void;
  groupDate: string; setGroupDate: (v: string) => void;
  groupDesc: string; setGroupDesc: (v: string) => void;
  groupAmount: string; setGroupAmount: (v: string) => void;
  groupCreditFlag: string; setGroupCreditFlag: (v: string) => void;
  dateFormat: string; setDateFormat: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const allSamples = [
    ...analysis.transactionStructure.sampleMatchedLines.map(l => ({ line: l, expected: true })),
    ...analysis.transactionStructure.sampleUnmatchedLines.map(l => ({ line: l, expected: false })),
  ];

  let regexError = '';
  const testResults = allSamples.map(({ line, expected }) => {
    try {
      const re = new RegExp(rowPattern);
      const m = line.match(re);
      return { line, matched: !!m, expected, groups: m ? Array.from(m).slice(1) : [] };
    } catch (e: any) {
      if (!regexError) regexError = e.message;
      return { line, matched: false, expected, groups: [] };
    }
  });

  return (
    <div className="space-y-4">
      <AiNote text="The row pattern must match each transaction line and capture date, description, and amount in numbered groups. Edit it and watch the live test update." />

      <Field label="Row Pattern (regex)" hint="JavaScript regex — no forward-slash delimiters. Each capture group maps to a field number below.">
        <textarea
          value={rowPattern} onChange={(e) => setRowPattern(e.target.value)}
          rows={3} className={MONO + ' resize-none'}
          placeholder={`(\\d{2}/\\d{2}/\\d{4})\\s+(.+?)\\s+([\\d,.]+)\\s*(CR)?`}
        />
        {regexError && (
          <p className="flex items-center gap-1 text-xs text-danger mt-1">
            <AlertCircle className="w-3 h-3" /> Invalid regex: {regexError}
          </p>
        )}
      </Field>

      {allSamples.length > 0 && (
        <div>
          <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-1.5">Live Pattern Test</p>
          <div className="space-y-2">
            {testResults.map((r, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2 ${
                r.matched ? 'bg-success-muted border-success/20' : 'bg-base border-border'
              }`}>
                <div className="flex items-start gap-2">
                  {r.matched
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-border mt-0.5 shrink-0" />
                  }
                  <div className="min-w-0 flex-1">
                    <code className="text-xs font-mono text-text-secondary break-all">{r.line}</code>
                    {!r.expected && (
                      <span className="ml-2 text-xs text-text-muted">(should not match)</span>
                    )}
                  </div>
                </div>
                {r.matched && r.groups.length > 0 && (
                  <div className="mt-1.5 ml-5 flex flex-wrap gap-1">
                    {r.groups.map((g, gi) => (
                      <span key={gi} className="text-xs bg-surface border border-success/20 rounded px-1.5 py-0.5 font-mono text-success">
                        [{gi + 1}] {g || '—'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-text-secondary mb-2">Group Assignments</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Date — group #">
            <input type="number" min={1} value={groupDate}
              onChange={(e) => setGroupDate(e.target.value)} className={BASE} />
          </Field>
          <Field label="Description — group #">
            <input type="number" min={1} value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)} className={BASE} />
          </Field>
          <Field label="Amount — group #">
            <input type="number" min={1} value={groupAmount}
              onChange={(e) => setGroupAmount(e.target.value)} className={BASE} />
          </Field>
          <Field label="Credit flag — group #" hint="Optional">
            <input type="number" min={1} value={groupCreditFlag}
              onChange={(e) => setGroupCreditFlag(e.target.value)}
              placeholder="—" className={BASE} />
          </Field>
        </div>
      </div>

      <Field label="Date Format" hint="How transaction dates appear in the row (e.g. DD/MM/YYYY, DD-MMM-YYYY, MM/DD/YY)">
        <input value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
          className={MONO} placeholder="DD/MM/YYYY" />
      </Field>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!rowPattern.trim() || !!regexError} />
    </div>
  );
}

function RulesStep({
  analysis, creditFlag, setCreditFlag, creditKeywords, setCreditKeywords,
  onBack, onNext,
}: {
  analysis: GuidedAnalysis;
  creditFlag: string; setCreditFlag: (v: string) => void;
  creditKeywords: string; setCreditKeywords: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <AiNote text="A transaction is a credit (money IN) if its description contains a credit keyword OR if the amount column contains the credit flag token." />
      <Field label="Credit Flag" hint="A token in the amount column that marks a credit row (e.g. 'CR'). Leave blank if the statement doesn't use one.">
        <input value={creditFlag} onChange={(e) => setCreditFlag(e.target.value)}
          className={MONO} placeholder="CR" />
      </Field>
      <Field label="Credit Keywords" hint="Comma-separated words in the description that mean money coming IN — payments, refunds, reversals, cashback.">
        <textarea value={creditKeywords} onChange={(e) => setCreditKeywords(e.target.value)}
          rows={2} className={BASE + ' resize-none'}
          placeholder="PAYMENT RECEIVED, REFUND, REVERSAL, CASHBACK" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SampleBox lines={analysis.creditDebitRules.sampleCreditLines} label="Sample credit lines (money IN)" variant="credit" />
        <SampleBox lines={analysis.creditDebitRules.sampleDebitLines} label="Sample debit lines (money OUT)" variant="debit" />
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function PreviewStep({
  analysis, bankName, cardType, currency,
  fromDate, toDate, dueDate,
  onBack, onSave, saving,
}: {
  analysis: GuidedAnalysis;
  bankName: string; cardType: string; currency: string;
  fromDate: string; toDate: string; dueDate: string;
  onBack: () => void; onSave: () => void; saving: boolean;
}) {
  const preview = analysis.transactions.slice(0, 10);
  return (
    <div className="space-y-4">
      <AiNote text="All steps complete. Review the summary and transaction preview, then save the parser." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'Bank', value: bankName },
          { label: 'Type', value: cardType },
          { label: 'Currency', value: currency },
          { label: 'From', value: fromDate || '—' },
          { label: 'To', value: toDate || '—' },
          { label: 'Due Date', value: dueDate || '—' },
          { label: 'Transactions', value: String(analysis.transactions.length) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-elevated border border-border rounded-xl px-3 py-2.5">
            <p className="text-[11px] font-mono text-text-muted uppercase tracking-wide font-medium">{label}</p>
            <p className="font-display text-sm font-bold text-text-primary mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-2">
            First {preview.length} transactions
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-base border-b border-border">
                  <th className="text-left px-3 py-2 font-mono font-semibold text-text-muted whitespace-nowrap">Date</th>
                  <th className="text-left px-3 py-2 font-mono font-semibold text-text-muted">Description</th>
                  <th className="text-right px-3 py-2 font-mono font-semibold text-text-muted">Debit</th>
                  <th className="text-right px-3 py-2 font-mono font-semibold text-text-muted">Credit</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((tx, i) => (
                  <tr key={i} className="border-t border-border hover:bg-elevated">
                    <td className="px-3 py-2 text-text-secondary font-mono whitespace-nowrap">{tx.transaction_date}</td>
                    <td className="px-3 py-2 text-text-secondary max-w-[200px] truncate">{tx.description}</td>
                    <td className="px-3 py-2 text-right text-danger font-mono tabular-nums whitespace-nowrap">
                      {tx.debit ? tx.debit.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-success font-mono tabular-nums whitespace-nowrap">
                      {tx.credit ? tx.credit.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysis.transactions.length > 10 && (
            <p className="text-xs text-text-muted font-mono mt-1.5 text-center">
              +{analysis.transactions.length - 10} more transactions
            </p>
          )}
        </div>
      )}

      <NavButtons onBack={onBack} isLast onSave={onSave} saving={saving} />
    </div>
  );
}

export default function CreateParserWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GuidedAnalysis | null>(null);

  const [bankName, setBankName] = useState('');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [currency, setCurrency] = useState('AED');
  const [keywords, setKeywords] = useState('');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fromPattern, setFromPattern] = useState('');
  const [toPattern, setToPattern] = useState('');
  const [dueDatePattern, setDueDatePattern] = useState('');

  const [rowPattern, setRowPattern] = useState('');
  const [groupDate, setGroupDate] = useState('1');
  const [groupDesc, setGroupDesc] = useState('2');
  const [groupAmount, setGroupAmount] = useState('3');
  const [groupCreditFlag, setGroupCreditFlag] = useState('');
  const [dateFormat, setDateFormat] = useState('');

  const [creditFlag, setCreditFlag] = useState('');
  const [creditKeywords, setCreditKeywords] = useState('');

  const [saving, startSave] = useTransition();

  function populate(a: GuidedAnalysis) {
    setBankName(a.bankName);
    setCardType(a.cardType);
    setCurrency(a.currency);
    setKeywords(a.identification.keywords.join(', '));
    setFromDate(a.statementPeriod.fromDate || '');
    setToDate(a.statementPeriod.toDate || '');
    setDueDate(a.statementPeriod.dueDate || '');
    setFromPattern(a.statementPeriod.fromPattern || '');
    setToPattern(a.statementPeriod.toPattern || '');
    setDueDatePattern(a.statementPeriod.dueDatePattern || '');
    setRowPattern(a.transactionStructure.rowPattern);
    setGroupDate(String(a.transactionStructure.groups.date));
    setGroupDesc(String(a.transactionStructure.groups.description));
    setGroupAmount(String(a.transactionStructure.groups.amount));
    setGroupCreditFlag(a.transactionStructure.groups.creditFlag
      ? String(a.transactionStructure.groups.creditFlag) : '');
    setDateFormat(a.transactionStructure.dateFormat);
    setCreditFlag(a.creditDebitRules.creditFlag || '');
    setCreditKeywords(a.creditDebitRules.creditKeywords.join(', '));
  }

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
      const data: GuidedAnalysis = await res.json();
      setAnalysis(data);
      populate(data);
      setStep('bank');
    } catch (err: unknown) {
      toast.error(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  function buildConfig(): ParserConfigData {
    const g: ParserConfigData['groups'] = {
      date: parseInt(groupDate) || 1,
      description: parseInt(groupDesc) || 2,
      amount: parseInt(groupAmount) || 3,
    };
    if (groupCreditFlag) g.creditFlag = parseInt(groupCreditFlag);
    return {
      bankName,
      cardType,
      currency: currency || 'AED',
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      rowPattern,
      groups: g,
      dateFormat,
      creditKeywords: creditKeywords ? creditKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
      creditFlag: creditFlag || undefined,
      periodFrom: fromPattern || undefined,
      periodTo: toPattern || undefined,
      dueDatePattern: dueDatePattern || undefined,
    };
  }

  function handleSave() {
    const config = buildConfig();
    startSave(async () => {
      try {
        await createAdminParserAction({ bank: bankName, keywords: config.keywords, config });
        toast.success(`Parser for "${bankName}" created and activated.`);
        onClose();
      } catch (err: unknown) {
        toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
  }

  function goNext() {
    const i = STEPS.findIndex(s => s.id === step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].id);
  }
  function goBack() {
    const i = STEPS.findIndex(s => s.id === step);
    if (i > 0) setStep(STEPS[i - 1].id);
  }

  return (
    <div className="border border-accent/20 rounded-2xl bg-surface shadow-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-accent-muted">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-bold font-display text-text-primary">AI-Guided Parser Setup</h3>
        </div>
        <button onClick={onClose} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
          Cancel
        </button>
      </div>

      <div className="px-6 pt-5">
        <StepBar current={step} />
      </div>

      <div className="px-6 pb-6">
        {step === 'upload' && (
          <UploadStep
            file={file} setFile={setFile}
            password={password} setPassword={setPassword}
            loading={loading} onAnalyze={handleAnalyze}
          />
        )}
        {step === 'bank' && analysis && (
          <BankStep
            analysis={analysis}
            bankName={bankName} setBankName={setBankName}
            cardType={cardType} setCardType={setCardType}
            currency={currency} setCurrency={setCurrency}
            keywords={keywords} setKeywords={setKeywords}
            onBack={goBack} onNext={goNext}
          />
        )}
        {step === 'dates' && analysis && (
          <DatesStep
            analysis={analysis}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
            dueDate={dueDate} setDueDate={setDueDate}
            fromPattern={fromPattern} setFromPattern={setFromPattern}
            toPattern={toPattern} setToPattern={setToPattern}
            dueDatePattern={dueDatePattern} setDueDatePattern={setDueDatePattern}
            onBack={goBack} onNext={goNext}
          />
        )}
        {step === 'transactions' && analysis && (
          <TransactionsStep
            analysis={analysis}
            rowPattern={rowPattern} setRowPattern={setRowPattern}
            groupDate={groupDate} setGroupDate={setGroupDate}
            groupDesc={groupDesc} setGroupDesc={setGroupDesc}
            groupAmount={groupAmount} setGroupAmount={setGroupAmount}
            groupCreditFlag={groupCreditFlag} setGroupCreditFlag={setGroupCreditFlag}
            dateFormat={dateFormat} setDateFormat={setDateFormat}
            onBack={goBack} onNext={goNext}
          />
        )}
        {step === 'rules' && analysis && (
          <RulesStep
            analysis={analysis}
            creditFlag={creditFlag} setCreditFlag={setCreditFlag}
            creditKeywords={creditKeywords} setCreditKeywords={setCreditKeywords}
            onBack={goBack} onNext={goNext}
          />
        )}
        {step === 'preview' && analysis && (
          <PreviewStep
            analysis={analysis}
            bankName={bankName} cardType={cardType} currency={currency}
            fromDate={fromDate} toDate={toDate} dueDate={dueDate}
            onBack={goBack} onSave={handleSave} saving={saving}
          />
        )}
      </div>
    </div>
  );
}
