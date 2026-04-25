'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Upload, X, Loader2, Bot, Check, ChevronRight, ChevronLeft,
  AlertCircle, CheckCircle2, FlaskConical, Save, FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import { createAdminParserAction } from '@/app/actions/admin';
import type { ParserConfigData } from '@/lib/parsers/configParser';
import type { ParseResult, PageContent } from '@/lib/pdf/types';
import PatternField from './PatternField';

// ── Types ──────────────────────────────────────────────────────────────────────

type PdfPage = { page: number; lines: string[] };

interface SampleState {
  file: File;
  pages: PdfPage[] | null;
  extracting: boolean;
  error: string | null;
}

interface AnalysisResult {
  bankName: string;
  cardType: 'credit' | 'debit';
  currency: string;
  cardVariant: string | null;
  identification: { keywords: string[]; sampleLines: string[] };
  statementPeriod: {
    fromDate: string | null; toDate: string | null;
    issuedDate: string | null; dueDate: string | null;
    fromPattern: string | null; toPattern: string | null;
    issuedDatePattern: string | null; dueDatePattern: string | null;
    sampleLines: string[];
  };
  summaryFields: {
    cardVariantPattern: string | null;
    creditLimit: number | null; creditLimitPattern: string | null;
    availableCredit: number | null; availableCreditPattern: string | null;
    minPaymentDue: number | null; minPaymentPattern: string | null;
    totalOutstanding: number | null; totalOutstandingPattern: string | null;
    totalAmountDue: number | null; totalAmountDuePattern: string | null;
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
  suggestedConfig: ParserConfigData;
  confidence: Record<string, number>;
  alternativePatterns: Record<string, string[]>;
  sampleHints: { matchedLines: string[]; unmatchedLines: string[]; creditLines: string[]; debitLines: string[] };
}

interface TestResult {
  filename: string;
  result: ParseResult;
  score: number;
  expanded: boolean;
}

type WizardStep = 'upload' | 'analyze' | 'review' | 'test' | 'save';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'review', label: 'Review Config' },
  { id: 'test', label: 'Test Results' },
  { id: 'save', label: 'Save' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcScore(result: ParseResult, config: ParserConfigData): number {
  let score = result.transactions.length > 0 ? 50 : 0;
  if (result.from_date) score += 15;
  if (result.to_date) score += 15;

  const optionalChecks = [
    [config.cardVariantPattern, result.card_variant],
    [config.creditLimitPattern, result.credit_limit],
    [config.availableCreditPattern, result.available_credit],
    [config.minPaymentPattern, result.min_payment_due],
    [config.totalOutstandingPattern, result.total_outstanding],
    [config.totalAmountDuePattern, result.total_amount_due],
  ] as [unknown, unknown][];

  const defined = optionalChecks.filter(([pattern]) => !!pattern);
  const found = defined.filter(([, val]) => val !== null && val !== undefined);

  if (defined.length > 0) {
    score += Math.round((found.length / defined.length) * 20);
  } else {
    score += 20;
  }

  return score;
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

// ── Step bar ───────────────────────────────────────────────────────────────────

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

// ── Main Wizard ────────────────────────────────────────────────────────────────

export default function MultiSampleWizard({
  onClose,
  initialPages,
  pendingSubmissionId,
}: {
  onClose: () => void;
  initialPages?: Array<{ page: number; lines: string[]; text?: string }>;
  pendingSubmissionId?: string;
}) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [sharedPassword, setSharedPassword] = useState('');
  const [samples, setSamples] = useState<SampleState[]>(() => {
    if (initialPages && initialPages.length > 0) {
      return [{
        file: new File([], 'Submitted Statement.pdf'),
        pages: initialPages.map(p => ({ page: p.page, lines: p.lines })),
        extracting: false,
        error: null,
      }];
    }
    return [];
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editableConfig, setEditableConfig] = useState<ParserConfigData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [saveAsActive, setSaveAsActive] = useState(true);
  const [saving, startSave] = useTransition();

  // Auto-advance from upload if initialPages provided
  useEffect(() => {
    if (initialPages && initialPages.length > 0) {
      setStep('analyze');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-run analysis when entering analyze step
  useEffect(() => {
    if (step === 'analyze' && !analysisResult && !analyzing) {
      runAnalysis();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-run tests when entering test step
  useEffect(() => {
    if (step === 'test' && editableConfig) {
      runTests();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  async function extractAtIndex(index: number, file: File, password: string) {
    if (!file.size) return; // pre-loaded pages (initialPages case)
    setSamples(prev => prev.map((s, i) => i === index ? { ...s, extracting: true, error: null } : s));
    try {
      const { extractPdfPages } = await import('@/services/parsePDF');
      const pages = await extractPdfPages(file, password || undefined);
      setSamples(prev => prev.map((s, i) => i === index ? { ...s, pages, extracting: false } : s));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setSamples(prev => prev.map((s, i) => i === index ? { ...s, extracting: false, error: msg } : s));
    }
  }

  function addFiles(files: FileList | File[]) {
    const newSamples: SampleState[] = Array.from(files)
      .filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
      .slice(0, 5 - samples.length)
      .map(f => ({ file: f, pages: null, extracting: false, error: null }));
    setSamples(prev => {
      newSamples.forEach((s, i) => {
        const idx = prev.length + i;
        setTimeout(() => extractAtIndex(idx, s.file, sharedPassword), 0);
      });
      return [...prev, ...newSamples];
    });
  }

  function removeSample(index: number) {
    setSamples(prev => prev.filter((_, i) => i !== index));
  }

  async function retryAllFailed(password: string) {
    samples.forEach((s, i) => {
      if (s.error || (!s.pages && !s.extracting)) {
        extractAtIndex(i, s.file, password);
      }
    });
  }

  async function runAnalysis() {
    const ready = samples.filter(s => s.pages && s.pages.length > 0);
    if (ready.length === 0) return;

    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch('/api/ai-analyze-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          samples: ready.map(s => ({
            filename: s.file.name || 'statement.pdf',
            pages: s.pages!,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((data?.error as string) ?? 'Analysis failed');
      }

      const result: AnalysisResult = await res.json();
      setAnalysisResult(result);
      setEditableConfig(result.suggestedConfig);
      setStep('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAnalyzeError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  function runTests() {
    if (!editableConfig) return;
    import('@/lib/parsers/configParser').then(({ parseWithConfig }) => {
      const results: TestResult[] = samples
        .filter(s => s.pages && s.pages.length > 0)
        .map(s => {
          const pages: PageContent[] = s.pages!.map(p => ({ ...p, text: p.lines.join('\n') }));
          const result = parseWithConfig(pages, editableConfig!);
          return {
            filename: s.file.name || 'statement.pdf',
            result,
            score: calcScore(result, editableConfig!),
            expanded: false,
          };
        });
      setTestResults(results);
    });
  }

  function updateConfig(patch: Partial<ParserConfigData>) {
    setEditableConfig(prev => prev ? { ...prev, ...patch } : prev);
  }

  function handleSave() {
    if (!editableConfig) return;
    const firstSamplePages = samples[0]?.pages;
    startSave(async () => {
      try {
        await createAdminParserAction({
          bank: editableConfig.bankName,
          keywords: editableConfig.keywords,
          config: editableConfig,
          rawPageContent: firstSamplePages?.map(p => ({ ...p, text: p.lines.join('\n') })),
          pendingSubmissionId,
          active: saveAsActive,
        });
        toast.success(`Parser "${editableConfig.bankName}" saved.`);
        onClose();
      } catch (err: unknown) {
        toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
  }

  const readySamples = samples.filter(s => s.pages && s.pages.length > 0);
  const canAnalyze = readySamples.length > 0 && !samples.some(s => s.extracting);

  return (
    <div className="border border-accent/20 rounded-2xl bg-surface shadow-surface overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-accent/5">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold font-display text-text-primary">Multi-Sample Parser Wizard</h3>
        </div>
        <button onClick={onClose} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
          Cancel
        </button>
      </div>

      <div className="px-6 py-6">
        <StepBar current={step} />

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Upload 1–5 PDF statements from the same bank. More samples = better pattern coverage.
            </p>

            {/* Shared password — shown once for all files */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                PDF Password <span className="text-text-muted font-normal">(leave blank if not protected)</span>
              </label>
              <input
                type="password"
                value={sharedPassword}
                onChange={e => {
                  const pw = e.target.value;
                  setSharedPassword(pw);
                }}
                onBlur={() => retryAllFailed(sharedPassword)}
                placeholder="Shared password for all uploaded PDFs"
                className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted"
              />
            </div>

            <label
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 rounded-xl transition-colors cursor-pointer"
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <Upload className="w-6 h-6 text-text-muted" />
              <span className="text-sm text-text-muted">Drop PDFs here or click to select</span>
              <span className="text-xs text-text-muted">{5 - samples.length} slot{5 - samples.length !== 1 ? 's' : ''} remaining</span>
              <input
                type="file" accept="application/pdf" multiple className="hidden"
                onChange={e => e.target.files && addFiles(e.target.files)}
              />
            </label>

            {samples.length > 0 && (
              <div className="space-y-2">
                {samples.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-xl bg-base">
                    <FileText className="w-4 h-4 text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-text-primary truncate">{s.file.name || 'Submitted Statement.pdf'}</p>
                        {s.extracting && <Loader2 className="w-3 h-3 animate-spin text-text-muted shrink-0" />}
                        {s.pages && !s.extracting && (
                          <span className="text-[11px] text-success shrink-0">{s.pages.length} pages ready</span>
                        )}
                        {s.error && (
                          <span className="text-[11px] text-danger shrink-0 truncate">{s.error}</span>
                        )}
                      </div>
                      {s.error && (
                        <button
                          onClick={() => extractAtIndex(i, s.file, sharedPassword)}
                          className="mt-1 text-[11px] text-accent hover:underline"
                        >
                          Retry with current password
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => removeSample(i)}
                      className="p-1 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => { setStep('analyze'); }}
                disabled={!canAnalyze}
                className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
              >
                Analyze {readySamples.length > 1 ? `${readySamples.length} Samples` : 'Sample'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {step === 'analyze' && (
          <div className="space-y-4">
            {analyzing && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <p className="text-sm text-text-secondary">
                  Analysing {readySamples.length} sample{readySamples.length !== 1 ? 's' : ''} with AI…
                </p>
                <p className="text-xs text-text-muted">This takes 15–30 seconds</p>
              </div>
            )}
            {analyzeError && !analyzing && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-danger-muted/40 border border-danger/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
                  <p className="text-xs text-danger">{analyzeError}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setStep('upload'); setAnalyzeError(null); }}
                    className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={runAnalysis}
                    className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Bot className="w-4 h-4" /> Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review Config */}
        {step === 'review' && editableConfig && analysisResult && (
          <div className="space-y-5">
            <p className="text-sm text-text-secondary">
              Review and edit the generated config. Confidence badges show how consistently each pattern matched across your {readySamples.length} sample{readySamples.length !== 1 ? 's' : ''}.
            </p>

            {/* Identity */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Bank Identity</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Bank Name</label>
                  <input
                    value={editableConfig.bankName}
                    onChange={e => updateConfig({ bankName: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Card Type</label>
                  <div className="flex gap-2 mt-1">
                    {(['credit', 'debit'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateConfig({ cardType: t })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          editableConfig.cardType === t ? 'bg-accent text-black border-accent' : 'bg-elevated text-text-muted border-border'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Currency</label>
                  <input
                    value={editableConfig.currency || ''}
                    onChange={e => updateConfig({ currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Date Format</label>
                  <input
                    value={editableConfig.dateFormat}
                    onChange={e => updateConfig({ dateFormat: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Detection Keywords (comma-separated)</label>
                <input
                  value={editableConfig.keywords.join(', ')}
                  onChange={e => updateConfig({ keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 text-sm text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </section>

            {/* Transactions */}
            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Transaction Pattern</h4>
              <PatternField
                label="Row Pattern"
                value={editableConfig.rowPattern}
                confidence={analysisResult.confidence.rowPattern}
                sampleLines={[...analysisResult.sampleHints.matchedLines, ...analysisResult.sampleHints.unmatchedLines]}
                onChange={v => updateConfig({ rowPattern: v })}
              />
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Group Assignments <span className="text-text-muted font-normal">(date= desc= amt= flag=)</span>
                </label>
                <input
                  value={`date=${editableConfig.groups.date} desc=${editableConfig.groups.description} amt=${editableConfig.groups.amount}${editableConfig.groups.creditFlag != null ? ` flag=${editableConfig.groups.creditFlag}` : ''}`}
                  onChange={e => {
                    const m = e.target.value.match(/date=(\d+).*desc=(\d+).*amt=(\d+)(?:.*flag=(\d+))?/);
                    if (!m) return;
                    const groups: ParserConfigData['groups'] = { date: +m[1], description: +m[2], amount: +m[3] };
                    if (m[4]) groups.creditFlag = +m[4];
                    updateConfig({ groups });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </section>

            {/* Dates */}
            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Statement Dates</h4>
              <PatternField
                label="Period From Pattern"
                value={editableConfig.periodFrom ?? ''}
                confidence={analysisResult.confidence.periodFrom}
                sampleLines={analysisResult.statementPeriod.sampleLines}
                onChange={v => updateConfig({ periodFrom: v || undefined })}
                window={editableConfig.periodFromWindow}
                onWindowChange={v => updateConfig({ periodFromWindow: v })}
              />
              <PatternField
                label="Period To Pattern"
                value={editableConfig.periodTo ?? ''}
                confidence={analysisResult.confidence.periodTo}
                sampleLines={analysisResult.statementPeriod.sampleLines}
                onChange={v => updateConfig({ periodTo: v || undefined })}
                window={editableConfig.periodToWindow}
                onWindowChange={v => updateConfig({ periodToWindow: v })}
              />
              <PatternField
                label="Issued Date Pattern"
                value={editableConfig.issuedDatePattern ?? ''}
                confidence={analysisResult.confidence.issuedDate}
                sampleLines={analysisResult.statementPeriod.sampleLines}
                onChange={v => updateConfig({ issuedDatePattern: v || undefined })}
                window={editableConfig.issuedDateWindow}
                onWindowChange={v => updateConfig({ issuedDateWindow: v })}
              />
              <PatternField
                label="Due Date Pattern"
                value={editableConfig.dueDatePattern ?? ''}
                confidence={analysisResult.confidence.dueDate}
                sampleLines={analysisResult.statementPeriod.sampleLines}
                onChange={v => updateConfig({ dueDatePattern: v || undefined })}
                window={editableConfig.dueDateWindow}
                onWindowChange={v => updateConfig({ dueDateWindow: v })}
              />
            </section>

            {/* Credit/Debit rules */}
            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Credit / Debit Rules</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Credit Flag Token</label>
                  <input
                    value={editableConfig.creditFlag || ''}
                    onChange={e => updateConfig({ creditFlag: e.target.value || undefined })}
                    placeholder="CR"
                    className="w-full px-3 py-2 text-xs font-mono text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Credit Keywords (comma-sep)</label>
                  <input
                    value={(editableConfig.creditKeywords || []).join(', ')}
                    onChange={e => updateConfig({ creditKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) || undefined })}
                    placeholder="refund, cashback, reversal"
                    className="w-full px-3 py-2 text-xs text-text-primary border border-border rounded-lg bg-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </section>

            {/* Summary fields */}
            {editableConfig.cardType === 'credit' && (
              <section className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Summary Field Patterns</h4>
                {([
                  ['Credit Limit', 'creditLimitPattern', 'creditLimit', 'creditLimitWindow'],
                  ['Available Credit', 'availableCreditPattern', 'availableCredit', 'availableCreditWindow'],
                  ['Min Payment', 'minPaymentPattern', 'minPayment', 'minPaymentWindow'],
                  ['Total Outstanding', 'totalOutstandingPattern', 'totalOutstanding', 'totalOutstandingWindow'],
                  ['Total Amount Due', 'totalAmountDuePattern', 'totalAmountDue', 'totalAmountDueWindow'],
                ] as [string, keyof ParserConfigData, string, keyof ParserConfigData][]).map(([label, key, confKey, windowKey]) => (
                  <PatternField
                    key={key as string}
                    label={`${label} Pattern`}
                    value={(editableConfig[key] as string | string[]) || ''}
                    confidence={analysisResult.confidence[confKey]}
                    sampleLines={analysisResult.summaryFields.sampleLines}
                    onChange={v => updateConfig({ [key]: v || undefined })}
                    window={editableConfig[windowKey] as number | undefined}
                    onWindowChange={v => updateConfig({ [windowKey]: v })}
                  />
                ))}
              </section>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => { setTestResults([]); setStep('test'); }}
                className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-lg transition-colors"
              >
                <FlaskConical className="w-4 h-4" /> Run Tests
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Test Results */}
        {step === 'test' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Config tested client-side against each uploaded sample. No network call.
            </p>

            {testResults.length === 0 && (
              <div className="flex items-center justify-center py-10 gap-3 text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Running tests…</span>
              </div>
            )}

            {testResults.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-base border-b border-border">
                      <th className="text-left px-4 py-2.5 font-semibold text-text-muted">File</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-text-muted">Txns</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-text-muted hidden sm:table-cell">Date Range</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-text-muted">Score</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {testResults.map((tr, i) => (
                      <>
                        <tr key={i} className="bg-surface hover:bg-elevated transition-colors">
                          <td className="px-4 py-2.5 text-text-primary font-medium truncate max-w-[160px]">{tr.filename}</td>
                          <td className="px-4 py-2.5 text-right text-text-secondary">{tr.result.transactions.length}</td>
                          <td className="px-4 py-2.5 text-right text-text-muted hidden sm:table-cell">
                            {tr.result.from_date && tr.result.to_date
                              ? `${tr.result.from_date} – ${tr.result.to_date}`
                              : '—'}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-bold ${scoreColor(tr.score)}`}>{tr.score}%</td>
                          <td className="px-2 py-2.5">
                            <button
                              onClick={() => setTestResults(prev => prev.map((r, j) => j === i ? { ...r, expanded: !r.expanded } : r))}
                              className="p-1 text-text-muted hover:text-text-secondary hover:bg-elevated rounded-lg transition-colors"
                            >
                              {tr.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                        {tr.expanded && (
                          <tr key={`${i}-exp`}>
                            <td colSpan={5} className="bg-base px-4 py-3">
                              <div className="max-h-48 overflow-y-auto">
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr className="text-text-muted">
                                      <th className="text-left pb-1">Date</th>
                                      <th className="text-left pb-1">Description</th>
                                      <th className="text-right pb-1">Debit</th>
                                      <th className="text-right pb-1">Credit</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {tr.result.transactions.slice(0, 30).map((t, ti) => (
                                      <tr key={ti}>
                                        <td className="py-0.5 text-text-muted pr-3 whitespace-nowrap">{t.transaction_date}</td>
                                        <td className="py-0.5 text-text-primary pr-3 truncate max-w-[200px]">{t.description}</td>
                                        <td className="py-0.5 text-right text-text-secondary pr-3">{t.debit ? t.debit.toFixed(2) : ''}</td>
                                        <td className="py-0.5 text-right text-success">{t.credit ? t.credit.toFixed(2) : ''}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => setStep('review')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Edit
              </button>
              <button
                onClick={() => setStep('save')}
                disabled={testResults.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
              >
                Looks Good <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Save */}
        {step === 'save' && editableConfig && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="p-4 bg-base border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Bank</span>
                <span className="text-sm font-bold text-text-primary">{editableConfig.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Card Type</span>
                <span className="text-sm text-text-secondary capitalize">{editableConfig.cardType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Samples Analysed</span>
                <span className="text-sm text-text-secondary">{readySamples.length}</span>
              </div>
              {analysisResult && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Overall Confidence</span>
                    <span className={`text-sm font-bold ${scoreColor(Math.round(analysisResult.confidence.overall * 100))}`}>
                      {Math.round(analysisResult.confidence.overall * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-elevated rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${analysisResult.confidence.overall >= 0.8 ? 'bg-success' : analysisResult.confidence.overall >= 0.5 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${Math.round(analysisResult.confidence.overall * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save mode toggle */}
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-2">Save as</p>
              <div className="flex gap-2">
                {[
                  { label: 'Active', value: true, desc: 'Immediately used for parsing' },
                  { label: 'Pending Review', value: false, desc: 'Saved but not active yet' },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setSaveAsActive(opt.value)}
                    className={`flex-1 px-4 py-3 text-left rounded-xl border transition-colors ${
                      saveAsActive === opt.value
                        ? 'bg-accent/10 border-accent text-text-primary'
                        : 'bg-elevated border-border text-text-muted hover:border-accent/50'
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[11px] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => setStep('test')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : `Save ${saveAsActive ? 'as Active' : 'as Pending'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
