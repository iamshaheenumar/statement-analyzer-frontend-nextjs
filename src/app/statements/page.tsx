import prisma from "@/services/prisma";
import StatementsList from "@/features/statements/StatementsList";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import HeaderCard from "@/features/statements/HeaderCard";

async function getStatements() {
  try {
    const rows = await prisma.statement.findMany({
      orderBy: { createdAt: "desc" },
    });

    const items = rows.map((s) => ({
      id: s.id,
      bank: s.bank,
      created_at: s.createdAt,
      card_type: s.card_type,
      from_date: s.from_date,
      to_date: s.to_date,
      summary: {
        record_count: s.recordCount,
        total_debit: Number(s.totalDebit),
        total_credit: Number(s.totalCredit),
        net_change: Number(s.netChange),
      },
    }));

    return { items };
  } catch (err: any) {
    console.error("Error loading statements:", err);
    return { error: err?.message || "Failed to list statements" };
  }
}

export default async function StatementsPage() {
  const { items, error } = await getStatements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <HeaderCard />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700">
                  Error Loading Statements
                </p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statements List */}
        {!error && (
          <Suspense
            fallback={
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8 text-center">
                <div className="inline-flex items-center gap-3 text-gray-600">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="font-medium">
                    Loading saved statements...
                  </span>
                </div>
              </div>
            }
          >
            <StatementsList items={items || []} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
