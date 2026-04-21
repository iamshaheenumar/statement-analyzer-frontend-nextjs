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
  updateParserRulesAction,
  toggleParserActiveAction,
  deleteParserAdminAction,
} from "@/app/actions/admin";
import CreateParserWizard from "./CreateParserWizard";
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

function ActiveParserCard({
  parser,
  onToggleActive,
  onUpdateRules,
  onDelete,
}: {
  parser: ParserRow;
  onToggleActive: (id: string, active: boolean) => void;
  onUpdateRules: (id: string, creditKeywords: string[], creditFlag: string, keywordsPage: number | undefined, detectionKeywords: string[], columnHeaders?: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showUpdateWizard, setShowUpdateWizard] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const existingCreditKeywords = (parser.config.creditKeywords as string[] | undefined) ?? [];
  const existingFlag = (parser.config.creditFlag as string | undefined) ?? "";
  const existingKeywordsPage = (parser.config.keywordsPage as number | undefined);
  const existingColumnHeaders = (parser.config.columnHeaders as string[] | undefined) ?? [];

  const [detectionKeywordsText, setDetectionKeywordsText] = useState(parser.keywords.join(", "));
  const [creditKeywordsText, setCreditKeywordsText] = useState(existingCreditKeywords.join(", "));
  const [creditFlag, setCreditFlag] = useState(existingFlag);
  const [keywordsPageMode, setKeywordsPageMode] = useState<"any" | "page1">(
    existingKeywordsPage === 1 ? "page1" : "any"
  );
  const [columnHeadersText, setColumnHeadersText] = useState(existingColumnHeaders.join(", "));

  function handleSaveRules() {
    const detection = detectionKeywordsText.split(",").map((k) => k.trim()).filter(Boolean);
    const credit = creditKeywordsText.split(",").map((k) => k.trim()).filter(Boolean);
    const kp = keywordsPageMode === "page1" ? 1 : undefined;
    const colHeaders = columnHeadersText.split(",").map((h) => h.trim()).filter(Boolean);
    startSave(() => onUpdateRules(parser.id, credit, creditFlag, kp, detection, colHeaders));
  }

  return (
    <>
    <div className="border border-border rounded-2xl bg-surface shadow-surface overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-sm font-bold text-text-primary">{parser.bank}</p>
              <StatusBadge status={parser.status} />
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
            <textarea
              value={detectionKeywordsText}
              onChange={(e) => setDetectionKeywordsText(e.target.value)}
              placeholder="commercial bank of dubai, cbd.ae, statement of account"
              rows={2}
              className="w-full px-3 py-2 text-xs text-text-primary border border-border rounded-lg bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <p className="text-xs text-text-muted mt-1">Comma-separated. ALL keywords must appear in the PDF (AND logic) to select this parser.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Credit Keywords</p>
            <textarea
              value={creditKeywordsText}
              onChange={(e) => setCreditKeywordsText(e.target.value)}
              placeholder="refund, cashback, credit, reversal"
              rows={2}
              className="w-full px-3 py-2 text-xs text-text-primary border border-border rounded-lg bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <p className="text-xs text-text-muted mt-1">Comma-separated. Descriptions matching any keyword are treated as credits (money IN).</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Credit Flag</p>
            <input
              type="text"
              value={creditFlag}
              onChange={(e) => setCreditFlag(e.target.value)}
              placeholder="CR"
              className="w-48 px-3 py-2 text-xs text-text-primary border border-border rounded-lg bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent font-mono"
            />
            <p className="text-xs text-text-muted mt-1">Token in the amount column that flags a credit row (e.g. &quot;CR&quot;).</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Keyword Search Scope</p>
            <div className="flex gap-2">
              {(["any", "page1"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setKeywordsPageMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    keywordsPageMode === mode
                      ? "bg-accent text-black border-accent"
                      : "bg-elevated text-text-muted border-border hover:text-text-secondary"
                  }`}
                >
                  {mode === "any" ? "Any page" : "Page 1 only"}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1">
              &ldquo;Page 1 only&rdquo; restricts keyword matching to the cover page — useful when the bank name only appears in the header.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-1.5">Column Headers</p>
            <input
              type="text"
              value={columnHeadersText}
              onChange={(e) => setColumnHeadersText(e.target.value)}
              placeholder="Date, Transaction Description, Transaction Currency, Transaction Amount, FX Rate, Total Amount (AED)"
              className="w-full px-3 py-2 text-xs text-text-primary border border-border rounded-lg bg-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-text-muted mt-1">
              Comma-separated column names in order of regex capture groups. When set, the original statement table is shown before saving.
            </p>
          </div>
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-xs font-semibold rounded-lg transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Rules"}
          </button>
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

  async function handleUpdateRules(id: string, creditKeywords: string[], creditFlag: string, keywordsPage: number | undefined, detectionKeywords: string[], columnHeaders?: string[]) {
    try { await updateParserRulesAction(id, creditKeywords, creditFlag, keywordsPage, detectionKeywords, columnHeaders); toast.success("Rules saved."); }
    catch { toast.error("Failed to save rules."); }
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
        <CreateParserWizard onClose={() => setShowCreatePanel(false)} />
      )}
      {reviewSubmission && (
        <CreateParserWizard
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
                onUpdateRules={handleUpdateRules}
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
