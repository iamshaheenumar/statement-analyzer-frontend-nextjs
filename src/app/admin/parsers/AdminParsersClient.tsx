"use client";

import { useState, useTransition } from "react";
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
import MultiSampleWizard from "./MultiSampleWizard";
import UpdateParserWizard from "./UpdateParserWizard";

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
                {parser.keywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 text-xs bg-elevated text-text-secondary border border-border/50 rounded-full font-mono">
                    {kw}
                  </span>
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
              onClick={() => setExpanded((v) => !v)}
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
              ? parser.rawPageContent?.[0]?.lines.join('\n') ?? '(no content)'
              : JSON.stringify(parser.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

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

function ActiveParserCard({
  parser,
  onToggleActive,
  onDelete,
}: {
  parser: ParserRow;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showUpdateWizard, setShowUpdateWizard] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();

  const creditKeywords = (parser.config.creditKeywords as string[] | undefined) ?? [];
  const creditFlag = (parser.config.creditFlag as string | undefined) ?? "";
  const keywordsPage = (parser.config.keywordsPage as number | undefined);
  const columnHeaders = (parser.config.columnHeaders as string[] | undefined) ?? [];

  const meta = parser.config._meta as { confidence?: Record<string, number> } | undefined;
  const confidenceScores = meta?.confidence ? Object.values(meta.confidence) : [];
  const avgConfidence =
    confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : null;

  return (
    <>
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
              {parser.keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 text-xs bg-elevated text-text-secondary border border-border/50 rounded-full font-mono">
                  {kw}
                </span>
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
              onClick={() => setShowUpdateWizard((v) => !v)}
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
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-elevated rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-base px-4 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Detection Keywords</p>
            <p className="text-xs font-mono text-text-primary px-3 py-2 bg-surface border border-border rounded-lg">
              {parser.keywords.join(", ") || <span className="text-text-muted italic">None</span>}
            </p>
            <p className="text-xs text-text-muted mt-1">ALL keywords must appear in the PDF (AND logic) to select this parser.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Credit Keywords</p>
            <p className="text-xs font-mono text-text-primary px-3 py-2 bg-surface border border-border rounded-lg">
              {creditKeywords.length > 0 ? creditKeywords.join(", ") : <span className="text-text-muted italic">None</span>}
            </p>
            <p className="text-xs text-text-muted mt-1">Descriptions matching any keyword are treated as credits (money IN).</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Credit Flag</p>
            <p className="text-xs font-mono text-text-primary px-3 py-2 bg-surface border border-border rounded-lg w-48">
              {creditFlag || <span className="text-text-muted italic">None</span>}
            </p>
            <p className="text-xs text-text-muted mt-1">Token in the amount column that flags a credit row (e.g. &quot;CR&quot;).</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Keyword Search Scope</p>
            <p className="text-xs text-text-primary px-3 py-2 bg-surface border border-border rounded-lg w-fit">
              {keywordsPage === 1 ? "Page 1 only" : "Any page"}
            </p>
          </div>
          {columnHeaders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-secondary mb-1.5">Column Headers</p>
              <p className="text-xs font-mono text-text-primary px-3 py-2 bg-surface border border-border rounded-lg">
                {columnHeaders.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    {showUpdateWizard && (
      <div className="mt-3">
        <UpdateParserWizard parser={parser} onClose={() => setShowUpdateWizard(false)} />
      </div>
    )}
  </>
  );
}

export default function AdminParsersClient({ parsers }: Props) {
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<ParserRow | null>(null);

  const pendingParsers = parsers.filter((p) => p.status === "pending");
  const approvedParsers = parsers.filter((p) => p.status === "approved");
  const rejectedParsers = parsers.filter((p) => p.status === "rejected");

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
          onClick={() => setShowCreatePanel((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-xl transition-colors shadow-[0_0_20px_#00d4ff33]"
        >
          <Bot className="w-4 h-4" />
          Create with AI
        </button>
      </div>

      {showCreatePanel && (
        <MultiSampleWizard onClose={() => setShowCreatePanel(false)} />
      )}
      {reviewSubmission && (
        <MultiSampleWizard
          onClose={() => setReviewSubmission(null)}
          initialPages={reviewSubmission.rawPageContent ?? []}
          pendingSubmissionId={reviewSubmission.id}
        />
      )}

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
            {pendingParsers.map((p) => (
              <PendingParserCard
                key={p.id}
                parser={p}
                onApprove={handleApprove}
                onReject={handleReject}
                onCreateWithAI={(submission) => {
                  setShowCreatePanel(false);
                  setReviewSubmission(submission);
                }}
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
            {approvedParsers.map((p) => (
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
            {rejectedParsers.map((p) => (
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
