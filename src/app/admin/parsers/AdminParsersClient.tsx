"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  Bot,
  Pencil,
} from "lucide-react";
import {
  approveParserAction,
  rejectParserAction,
  toggleParserActiveAction,
  deleteParserAdminAction,
} from "@/app/actions/admin";
import type { ParserConfigData } from "@/lib/parsers/configParser";

interface ParserRow {
  id: string;
  userId: string | null;
  bank: string;
  keywords: string[];
  config: Record<string, unknown>;
  source: string;
  active: boolean;
  status: string;
  createdAt: string;
  rawPageContent: Array<{ page: number; lines: string[]; text: string }> | null;
  statementCount: number;
}

interface Props {
  parsers: ParserRow[];
}

// ── Shared display helpers ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-warning-muted text-warning border-warning/20",
    approved: "bg-success-muted text-success border-success/20",
    rejected: "bg-danger-muted text-danger border-danger/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${colors[status] ?? "bg-elevated text-text-secondary border-border"}`}>
      {status}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="px-2 py-0.5 text-[11px] bg-elevated text-text-secondary border border-border/50 rounded-full font-mono">
      {children}
    </span>
  );
}

function CodeVal({ children, block = false }: { children: string; block?: boolean }) {
  if (!children) return <span className="text-xs text-text-muted italic">Not set</span>;
  if (block) {
    return (
      <pre className="text-[11px] font-mono text-text-secondary bg-surface border border-border rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {children}
      </pre>
    );
  }
  return (
    <span className="text-xs font-mono text-text-primary bg-surface border border-border rounded px-2 py-0.5 break-all">
      {children}
    </span>
  );
}

function Empty() {
  return <span className="text-xs text-text-muted italic">Not set</span>;
}

function normalizePattern(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p.join("\n") : p;
}

// ── Full config detail panel (read-only) ──────────────────────────────────────

function ParserConfigDetail({ parser }: { parser: ParserRow }) {
  const cfg = parser.config as ParserConfigData;
  const meta = cfg._meta;
  const confidence = meta?.confidence ?? {};
  const hasConfidence = Object.keys(confidence).filter(k => k !== "overall").length > 0;

  const periodFrom = normalizePattern(cfg.periodFrom);
  const periodTo = normalizePattern(cfg.periodTo);
  const issuedDate = normalizePattern(cfg.issuedDatePattern);
  const dueDate = normalizePattern(cfg.dueDatePattern);
  const rowPat = normalizePattern(cfg.rowPattern);
  const isMultiPattern = Array.isArray(cfg.rowPattern) && cfg.rowPattern.length > 1;

  const summaryFields: { label: string; key: keyof ParserConfigData; winKey: keyof ParserConfigData }[] = [
    { label: "Card Variant", key: "cardVariantPattern", winKey: "cardVariantWindow" },
    { label: "Credit Limit", key: "creditLimitPattern", winKey: "creditLimitWindow" },
    { label: "Available Credit", key: "availableCreditPattern", winKey: "availableCreditWindow" },
    { label: "Min Payment Due", key: "minPaymentPattern", winKey: "minPaymentWindow" },
    { label: "Total Outstanding", key: "totalOutstandingPattern", winKey: "totalOutstandingWindow" },
    { label: "Total Amount Due", key: "totalAmountDuePattern", winKey: "totalAmountDueWindow" },
  ];

  const confLabels: Record<string, string> = {
    rowPattern: "Row Pattern",
    periodFrom: "Period From",
    periodTo: "Period To",
    issuedDate: "Issued Date",
    dueDate: "Due Date",
    creditLimit: "Credit Limit",
    availableCredit: "Available Credit",
    minPayment: "Min Payment",
    totalOutstanding: "Total Outstanding",
    totalAmountDue: "Total Amount Due",
    cardVariant: "Card Variant",
  };

  return (
    <div className="border-t border-border bg-base divide-y divide-border/40">
      {/* Quick identity row */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Card Type", value: cfg.cardType, mono: false, capitalize: true },
          { label: "Currency", value: cfg.currency || "AED", mono: true },
          { label: "Date Format", value: cfg.dateFormat, mono: true },
          { label: "Source", value: parser.source, mono: false, capitalize: true },
        ].map(({ label, value, mono, capitalize }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">{label}</p>
            <p className={`text-sm font-bold text-text-primary mt-0.5 ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Detection */}
      <div className="px-5 py-4 space-y-3">
        <SectionLabel>Detection</SectionLabel>
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5">
            Keywords <span className="text-text-muted font-normal">(ALL must match)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {parser.keywords.length > 0
              ? parser.keywords.map(kw => <Chip key={kw}>{kw}</Chip>)
              : <Empty />}
          </div>
          <p className="text-[11px] text-text-muted mt-1.5">
            Scope: {cfg.keywordsPage === 1 ? "Page 1 only" : "Any page"}
          </p>
        </div>
        {cfg.columnHeaders && cfg.columnHeaders.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Column Headers</p>
            <div className="flex flex-wrap gap-1.5">
              {cfg.columnHeaders.map(h => <Chip key={h}>{h}</Chip>)}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Pattern */}
      <div className="px-5 py-4 space-y-3">
        <SectionLabel>Transaction Pattern</SectionLabel>
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5">
            Row Pattern
            {isMultiPattern && (
              <span className="ml-2 text-text-muted font-normal">
                ({(cfg.rowPattern as string[]).length} alternatives — tried in order)
              </span>
            )}
          </p>
          <CodeVal block>{rowPat}</CodeVal>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1">Group Assignments</p>
            <CodeVal>
              {`date=${cfg.groups.date} desc=${cfg.groups.description} amt=${cfg.groups.amount}${cfg.groups.creditFlag != null ? ` flag=${cfg.groups.creditFlag}` : ""}`}
            </CodeVal>
          </div>
        </div>
      </div>

      {/* Credit / Debit Rules */}
      <div className="px-5 py-4 space-y-3">
        <SectionLabel>Credit / Debit Rules</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Credit Flag Token</p>
            {cfg.creditFlag ? <CodeVal>{cfg.creditFlag}</CodeVal> : <Empty />}
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Credit Keywords</p>
            {cfg.creditKeywords && cfg.creditKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {cfg.creditKeywords.map(kw => <Chip key={kw}>{kw}</Chip>)}
              </div>
            ) : <Empty />}
          </div>
        </div>
      </div>

      {/* Date Patterns */}
      <div className="px-5 py-4 space-y-3">
        <SectionLabel>Date Patterns</SectionLabel>
        <div className="space-y-3">
          {[
            { label: "Period From", text: periodFrom, win: cfg.periodFromWindow },
            { label: "Period To", text: periodTo, win: cfg.periodToWindow },
            { label: "Issued Date", text: issuedDate, win: cfg.issuedDateWindow },
            { label: "Due Date", text: dueDate, win: cfg.dueDateWindow },
          ].map(({ label, text, win }) => (
            <div key={label} className="grid grid-cols-[130px_1fr] gap-3 items-start">
              <div>
                <p className="text-xs font-semibold text-text-secondary">{label}</p>
                {win !== undefined && win !== null && (
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    window: {win > 0 ? `+${win}` : win}
                  </p>
                )}
              </div>
              {text ? <CodeVal block={text.includes("\n")}>{text}</CodeVal> : <Empty />}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Field Patterns (credit only) */}
      {cfg.cardType === "credit" && (
        <div className="px-5 py-4 space-y-3">
          <SectionLabel>Summary Field Patterns</SectionLabel>
          <div className="space-y-3">
            {summaryFields.map(({ label, key, winKey }) => {
              const val = cfg[key] as string | undefined;
              const win = cfg[winKey] as number | undefined;
              return (
                <div key={key} className="grid grid-cols-[140px_1fr] gap-3 items-start">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">{label}</p>
                    {win !== undefined && win !== null && (
                      <p className="text-[11px] text-text-muted font-mono mt-0.5">
                        window: {win > 0 ? `+${win}` : win}
                      </p>
                    )}
                  </div>
                  {val ? <CodeVal>{val}</CodeVal> : <Empty />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confidence Scores */}
      {hasConfidence && (
        <div className="px-5 py-4 space-y-2">
          <SectionLabel>Confidence Scores</SectionLabel>
          <div className="space-y-2">
            {Object.entries(confidence)
              .filter(([k]) => k !== "overall")
              .map(([key, val]) => {
                const pct = Math.round(val * 100);
                const barColor = pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
                const textColor = pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[11px] text-text-muted w-36 shrink-0">
                      {confLabels[key] ?? key}
                    </span>
                    <div className="flex-1 bg-elevated rounded-full h-1">
                      <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[11px] font-semibold w-8 text-right tabular-nums ${textColor}`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
          </div>
          {confidence.overall !== undefined && (
            <div className="pt-2 mt-2 border-t border-border/50 flex items-center gap-3">
              <span className="text-[11px] font-semibold text-text-secondary w-36 shrink-0">Overall</span>
              <div className="flex-1 bg-elevated rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${confidence.overall >= 0.8 ? "bg-success" : confidence.overall >= 0.5 ? "bg-warning" : "bg-danger"}`}
                  style={{ width: `${Math.round(confidence.overall * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] font-bold w-8 text-right tabular-nums ${confidence.overall >= 0.8 ? "text-success" : confidence.overall >= 0.5 ? "text-warning" : "text-danger"}`}>
                {Math.round(confidence.overall * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer meta */}
      <div className="px-5 py-3 bg-base/50 flex items-center gap-4 text-[11px] text-text-muted">
        <span>Created {new Date(parser.createdAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>{parser.statementCount} {parser.statementCount === 1 ? "statement" : "statements"} parsed</span>
        {parser.userId && (
          <>
            <span>·</span>
            <span>User {parser.userId.slice(0, 8)}…</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Pending parser card ────────────────────────────────────────────────────────

function PendingParserCard({
  parser,
  onApprove,
  onReject,
  onCreateWithAI,
}: {
  parser: ParserRow;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCreateWithAI: (parser: ParserRow) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [approving, startApprove] = useTransition();
  const [rejecting, startReject] = useTransition();

  const isUserSubmission = parser.source === "user";

  return (
    <div className="border border-border rounded-2xl bg-surface shadow-surface overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-sm font-bold text-text-primary">{parser.bank}</p>
              <StatusBadge status={parser.status} />
              <span className="text-xs text-text-muted font-mono">
                {isUserSubmission ? "User submission" : parser.source === "ai" ? "AI-generated" : parser.source}
              </span>
            </div>
            {parser.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {parser.keywords.map(kw => (
                  <Chip key={kw}>{kw}</Chip>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted font-mono">
              Submitted {new Date(parser.createdAt).toLocaleDateString()} ·{" "}
              {parser.userId ? `User ${parser.userId.slice(0, 8)}…` : "Anonymous"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isUserSubmission ? (
              <>
                <button
                  onClick={() => onCreateWithAI(parser)}
                  disabled={!parser.rawPageContent}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-black hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Create with AI
                </button>
                <button
                  onClick={() => startReject(() => onReject(parser.id))}
                  disabled={rejecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-danger-muted text-danger hover:bg-danger/10 border border-danger/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Dismiss
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startApprove(() => onApprove(parser.id))}
                  disabled={approving || rejecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-success-muted text-success hover:bg-success/10 border border-success/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => startReject(() => onReject(parser.id))}
                  disabled={approving || rejecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-danger-muted text-danger hover:bg-danger/10 border border-danger/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reject
                </button>
              </>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-elevated rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border bg-base px-4 py-3">
          <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-2">
            {isUserSubmission ? "Raw Page Content (first page)" : "Config JSON"}
          </p>
          <pre className="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all font-mono bg-surface border border-border rounded-lg p-3 max-h-64">
            {isUserSubmission
              ? parser.rawPageContent?.[0]?.lines.join("\n") ?? "(no content)"
              : JSON.stringify(parser.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Confidence badge (for card header) ────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const colors =
    pct >= 80
      ? "bg-success-muted text-success border-success/20"
      : pct >= 50
      ? "bg-warning-muted text-warning border-warning/20"
      : "bg-danger-muted text-danger border-danger/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${colors}`}>
      {pct}% confidence
    </span>
  );
}

// ── Active parser card ─────────────────────────────────────────────────────────

function ActiveParserCard({
  parser,
  onToggleActive,
  onDelete,
}: {
  parser: ParserRow;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();

  const meta = parser.config._meta as { confidence?: Record<string, number> } | undefined;
  const confidenceScores = meta?.confidence ? Object.values(meta.confidence) : [];
  const avgConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : null;

  return (
    <div className="border border-border rounded-2xl bg-surface shadow-surface overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-sm font-bold text-text-primary">{parser.bank}</p>
              <StatusBadge status={parser.status} />
              {avgConfidence !== null && <ConfidenceBadge value={avgConfidence} />}
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border bg-elevated text-text-secondary border-border/50">
                {parser.statementCount} {parser.statementCount === 1 ? "statement" : "statements"}
              </span>
              {parser.source === "admin" && (
                <span className="text-xs text-text-muted">Admin-created</span>
              )}
              {parser.source === "ai" && (
                <span className="text-xs text-text-muted">AI-generated</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {parser.keywords.map(kw => (
                <Chip key={kw}>{kw}</Chip>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => startToggle(() => onToggleActive(parser.id, !parser.active))}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                parser.active
                  ? "bg-success-muted text-success hover:bg-success/10 border-success/20"
                  : "bg-elevated text-text-muted hover:bg-overlay border-border"
              }`}
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : parser.active ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
              {parser.active ? "Active" : "Inactive"}
            </button>
            <button
              onClick={() => router.push(`/admin/parsers/${parser.id}/update`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-warning-muted text-warning hover:bg-warning/10 border border-warning/20 rounded-lg transition-colors"
              title="Update parser from new statement"
            >
              <Pencil className="w-3.5 h-3.5" /> Update
            </button>
            <button
              onClick={() => startDelete(() => onDelete(parser.id))}
              disabled={deleting}
              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-elevated rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && <ParserConfigDetail parser={parser} />}
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────

export default function AdminParsersClient({ parsers }: Props) {
  const router = useRouter();

  const pendingParsers = parsers.filter(p => p.status === "pending");
  const approvedParsers = parsers.filter(p => p.status === "approved");
  const rejectedParsers = parsers.filter(p => p.status === "rejected");

  async function handleApprove(id: string) {
    try { await approveParserAction(id); toast.success("Parser approved."); }
    catch { toast.error("Failed to approve parser."); }
  }

  async function handleReject(id: string) {
    try { await rejectParserAction(id); toast.success("Parser rejected."); }
    catch { toast.error("Failed to reject parser."); }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      await toggleParserActiveAction(id, active);
      toast.success(active ? "Parser activated." : "Parser deactivated.");
    } catch { toast.error("Failed to update parser."); }
  }

  async function handleDelete(id: string) {
    try { await deleteParserAdminAction(id); toast.success("Parser deleted."); }
    catch { toast.error("Failed to delete parser."); }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary tracking-tight">Parsers</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            All parsers are stored in the database. Approve user submissions or create new ones with AI.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/parsers/create")}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-xl transition-colors shadow-[0_0_20px_#00d4ff33]"
        >
          <Bot className="w-4 h-4" />
          Create with AI
        </button>
      </div>

      {/* Pending review */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">Pending Review</h2>
          {pendingParsers.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-warning-muted text-warning border border-warning/20 rounded-full">
              {pendingParsers.length}
            </span>
          )}
        </div>
        {pendingParsers.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl shadow-surface px-5 py-10 text-center">
            <p className="text-sm text-text-muted">No parsers pending review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingParsers.map(p => (
              <PendingParserCard
                key={p.id}
                parser={p}
                onApprove={handleApprove}
                onReject={handleReject}
                onCreateWithAI={submission =>
                  router.push(`/admin/parsers/create?submissionId=${submission.id}`)
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Active parsers */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Active Parsers</h2>
        {approvedParsers.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl shadow-surface px-5 py-10 text-center">
            <p className="text-sm text-text-muted">No approved parsers yet. Create one with AI above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedParsers.map(p => (
              <ActiveParserCard
                key={p.id}
                parser={p}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Rejected */}
      {rejectedParsers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            Rejected ({rejectedParsers.length})
          </h2>
          <div className="space-y-2">
            {rejectedParsers.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-xl shadow-surface">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-text-secondary">{p.bank}</p>
                  <StatusBadge status="rejected" />
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
