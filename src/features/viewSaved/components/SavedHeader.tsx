import {
  Calendar,
  FileText,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Statement = {
  id: string;
  bank: string;
  card_type?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  created_at: Date;
  summary?: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

export default function SavedHeader({ statement }: { statement: Statement }) {
  const fromDate = statement.from_date
    ? format(new Date(statement.from_date), "MMM dd, yyyy")
    : "N/A";

  const toDate = statement.to_date
    ? format(new Date(statement.to_date), "MMM dd, yyyy")
    : "N/A";

  const createdAt = format(new Date(statement.created_at), "MMM dd, yyyy");

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
      {/* Header title + Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
              Saved Statement
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{statement.bank}</span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {fromDate} – {toDate}
                </span>
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/statements"
          className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Statements
          </span>
        </Link>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Optional Summary */}
        {statement.summary && (
          <>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Records
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {statement.summary.record_count}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Credit
                </p>
                <p className="text-sm font-semibold text-green-700 truncate">
                  {statement.summary.total_credit.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl border border-red-200/50 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Debit
                </p>
                <p className="text-sm font-semibold text-red-700 truncate">
                  {statement.summary.total_debit.toLocaleString()}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Created date */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Created
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {createdAt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
