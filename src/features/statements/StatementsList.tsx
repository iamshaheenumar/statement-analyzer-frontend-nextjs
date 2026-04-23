"use client";

import { useState, useMemo } from "react";
import { ChevronRight, FileText, Upload, Calendar, Filter } from "lucide-react";
import { DeleteButton } from "./DeleteStatementButton";
import { formatDate } from "@/utils/date";
import { motion } from "framer-motion";
import { staggerContainer, fadeSlideUp } from "@/lib/motion";

type StatementItem = {
  id: string;
  bank: string;
  created_at: string | Date;
  card_type?: string | null;
  currency?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  due_date: Date | null;
  total_amount_due: number | null;
  min_payment_due: number | null;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

type Props = { items: StatementItem[] };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getMonthKey(d: Date | null) {
  if (!d) return null;
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function StatementsList({ items }: Props) {
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const cardOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    for (const item of items) {
      const key = `${item.bank}__${item.card_type || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        const label = item.card_type
          ? `${item.bank} (${item.card_type})`
          : item.bank;
        opts.push({ value: key, label });
      }
    }
    return opts;
  }, [items]);

  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    for (const item of items) {
      const key = getMonthKey(item.from_date);
      if (key && !seen.has(key)) {
        seen.add(key);
        opts.push({ value: key, label: getMonthLabel(key) });
      }
    }
    return opts.sort((a, b) => b.value.localeCompare(a.value));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (cardFilter !== "all") {
        const key = `${item.bank}__${item.card_type || ""}`;
        if (key !== cardFilter) return false;
      }
      if (monthFilter !== "all") {
        if (getMonthKey(item.from_date) !== monthFilter) return false;
      }
      return true;
    });
  }, [items, cardFilter, monthFilter]);

  if (!items || items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl shadow-surface">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-text-muted" />
          </div>
          <p className="font-display text-sm font-semibold text-text-primary mb-1">
            No saved statements
          </p>
          <p className="text-xs text-text-muted mb-5">
            Use &ldquo;Save to Cloud&rdquo; after parsing a PDF to store it here.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  const isCredit = (item: StatementItem) =>
    item.card_type?.toLowerCase() === "credit";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 min-w-0">
          <Filter className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <select
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            className="bg-transparent text-xs text-text-primary font-medium outline-none cursor-pointer"
          >
            <option value="all">All cards</option>
            {cardOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-transparent text-xs text-text-primary font-medium outline-none cursor-pointer"
          >
            <option value="all">All dates</option>
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm font-semibold text-text-primary mb-1">No matching statements</p>
            <p className="text-xs text-text-muted">Try adjusting your filters.</p>
          </div>
        ) : (
          <motion.ul
            className="divide-y divide-border"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {filtered.map((item) => (
              <motion.li key={item.id} className="group flex items-stretch" variants={fadeSlideUp}>
                <a
                  href={`/statements/${item.id}`}
                  className="flex-1 min-w-0 px-4 sm:px-5 py-4 hover:bg-elevated transition-colors duration-100"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-text-primary truncate">{item.bank}</p>
                      {(item.from_date || item.to_date) && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs font-mono text-text-muted">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDate(item.from_date)} – {formatDate(item.to_date)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.card_type && (
                        <span className="hidden sm:inline text-xs font-medium text-text-secondary bg-elevated border border-border px-2 py-0.5 rounded-full capitalize">
                          {item.card_type}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                    </div>
                  </div>

                  {/* Stats row */}
                  {isCredit(item) ? (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <p className="text-[11px] font-mono text-text-muted">Total Due</p>
                        <p className="text-xs font-semibold font-mono text-danger tabular-nums">
                          {item.total_amount_due != null
                            ? `${item.currency || "AED"} ${fmt(item.total_amount_due)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-mono text-text-muted">Min Due</p>
                        <p className="text-xs font-semibold font-mono text-text-primary tabular-nums">
                          {item.min_payment_due != null
                            ? `${item.currency || "AED"} ${fmt(item.min_payment_due)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-mono text-text-muted">Due Date</p>
                        <p className="text-xs font-semibold font-mono text-text-primary tabular-nums">
                          {item.due_date ? formatDate(item.due_date) : "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <p className="text-[11px] font-mono text-text-muted">Debit</p>
                        <p className="text-xs font-semibold font-mono text-danger tabular-nums">
                          {item.currency || "AED"} {fmt(item.summary.total_debit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-mono text-text-muted">Credit</p>
                        <p className="text-xs font-semibold font-mono text-success tabular-nums">
                          {item.currency || "AED"} {fmt(item.summary.total_credit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-mono text-text-muted">Net</p>
                        <p
                          className={`text-xs font-semibold font-mono tabular-nums ${
                            item.summary.net_change >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          {item.summary.net_change >= 0 ? "+" : ""}
                          {item.currency || "AED"} {fmt(item.summary.net_change)}
                        </p>
                      </div>
                    </div>
                  )}
                </a>

                <div className="flex items-start px-3 pt-4">
                  <DeleteButton id={item.id} />
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
