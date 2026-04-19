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
} from "lucide-react";
import {
  approveParserAction,
  rejectParserAction,
  updateParserRulesAction,
  toggleParserActiveAction,
  deleteParserAdminAction,
} from "@/app/actions/admin";
import CreateParserWizard from "./CreateParserWizard";

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
}

interface Props {
  parsers: ParserRow[];
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${colors[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

// ─── Pending Parser Card ──────────────────────────────────────────────────────

function PendingParserCard({
  parser,
  onApprove,
  onReject,
}: {
  parser: ParserRow;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [approving, startApprove] = useTransition();
  const [rejecting, startReject] = useTransition();

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-sm font-bold text-slate-900">{parser.bank}</p>
              <StatusBadge status={parser.status} />
              <span className="text-xs text-slate-400">
                {parser.source === "ai" ? "AI-generated" : parser.source}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {parser.keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Submitted {new Date(parser.createdAt).toLocaleDateString()} ·{" "}
              {parser.userId ? `User ${parser.userId.slice(0, 8)}…` : "Anonymous"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => startApprove(() => onApprove(parser.id))}
              disabled={approving || rejecting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Approve
            </button>
            <button
              onClick={() => startReject(() => onReject(parser.id))}
              disabled={approving || rejecting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Config JSON</p>
          <pre className="text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap break-all font-mono bg-white border border-slate-200 rounded-lg p-3">
            {JSON.stringify(parser.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Active Parser Card ───────────────────────────────────────────────────────

function ActiveParserCard({
  parser,
  onToggleActive,
  onUpdateRules,
  onDelete,
}: {
  parser: ParserRow;
  onToggleActive: (id: string, active: boolean) => void;
  onUpdateRules: (id: string, creditKeywords: string[], creditFlag: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const existingKeywords = (parser.config.creditKeywords as string[] | undefined) ?? [];
  const existingFlag = (parser.config.creditFlag as string | undefined) ?? "";

  const [creditKeywordsText, setCreditKeywordsText] = useState(existingKeywords.join(", "));
  const [creditFlag, setCreditFlag] = useState(existingFlag);

  function handleSaveRules() {
    const keywords = creditKeywordsText.split(",").map((k) => k.trim()).filter(Boolean);
    startSave(() => onUpdateRules(parser.id, keywords, creditFlag));
  }

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <p className="text-sm font-bold text-slate-900">{parser.bank}</p>
              <StatusBadge status={parser.status} />
              {parser.source === "admin" && (
                <span className="text-xs text-slate-400">Admin-created</span>
              )}
              {parser.source === "ai" && (
                <span className="text-xs text-slate-400">AI-generated</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {parser.keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
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
                  ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200"
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
              onClick={() => startDelete(() => onDelete(parser.id))}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Credit Keywords</p>
            <textarea
              value={creditKeywordsText}
              onChange={(e) => setCreditKeywordsText(e.target.value)}
              placeholder="refund, cashback, credit, reversal"
              rows={2}
              className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">Comma-separated. Descriptions matching any keyword are treated as credits (money IN).</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Credit Flag</p>
            <input
              type="text"
              value={creditFlag}
              onChange={(e) => setCreditFlag(e.target.value)}
              placeholder="CR"
              className="w-48 px-3 py-2 text-xs text-slate-900 border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-slate-400 mt-1">Token in the amount column that flags a credit row (e.g. &quot;CR&quot;).</p>
          </div>
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Rules"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminParsersClient({ parsers }: Props) {
  const [showCreatePanel, setShowCreatePanel] = useState(false);

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

  async function handleUpdateRules(id: string, creditKeywords: string[], creditFlag: string) {
    try { await updateParserRulesAction(id, creditKeywords, creditFlag); toast.success("Rules saved."); }
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Parsers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All parsers are stored in the database. Approve user submissions or create new ones with AI.
          </p>
        </div>
        <button
          onClick={() => setShowCreatePanel((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Bot className="w-4 h-4" />
          Create with AI
        </button>
      </div>

      {showCreatePanel && <CreateParserWizard onClose={() => setShowCreatePanel(false)} />}

      {/* Pending review */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Pending Review</h2>
          {pendingParsers.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
              {pendingParsers.length}
            </span>
          )}
        </div>
        {pendingParsers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-10 text-center">
            <p className="text-sm text-slate-400">No parsers pending review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingParsers.map((p) => (
              <PendingParserCard key={p.id} parser={p} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        )}
      </section>

      {/* Active parsers */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Active Parsers</h2>
        {approvedParsers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-10 text-center">
            <p className="text-sm text-slate-400">No approved parsers yet. Create one with AI above.</p>
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
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Rejected ({rejectedParsers.length})
          </h2>
          <div className="space-y-2">
            {rejectedParsers.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-slate-700">{p.bank}</p>
                  <StatusBadge status="rejected" />
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
