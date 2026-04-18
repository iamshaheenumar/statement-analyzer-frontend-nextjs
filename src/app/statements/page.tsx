import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import StatementsList from "@/features/statements/StatementsList";
import Navbar from "@/components/Navbar";
import { AlertCircle } from "lucide-react";

async function getStatements(userId: string) {
  try {
    const rows = await prisma.statement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return {
      items: rows.map((s) => ({
        id: s.id,
        bank: s.bank,
        created_at: s.createdAt,
        card_type: s.card_type,
        currency: s.currency,
        from_date: s.from_date,
        to_date: s.to_date,
        summary: {
          record_count: s.recordCount,
          total_debit: Number(s.totalDebit),
          total_credit: Number(s.totalCredit),
          net_change: Number(s.netChange),
        },
      })),
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to list statements" };
  }
}

export default async function StatementsPage() {
  const user = await getUser();
  const { items, error } = await getStatements(user!.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saved Statements</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cloud-saved statements from your parsed PDFs
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to load statements</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!error && <StatementsList items={items ?? []} />}
      </main>
    </div>
  );
}
