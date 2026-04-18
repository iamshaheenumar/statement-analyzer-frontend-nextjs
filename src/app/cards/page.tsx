import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import CardsList from "@/features/cards/CardsList";
import Navbar from "@/components/Navbar";
import { AlertCircle, RefreshCw } from "lucide-react";

async function getCards(userId: string) {
  try {
    const rows = await prisma.bankCard.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { items: rows };
  } catch {
    return { error: true };
  }
}

export default async function CardsPage() {
  const user = await getUser();
  const { items, error } = await getCards(user!.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saved Cards</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cards saved from parsed statements — passwords auto-fill on next upload.
          </p>
        </div>

        {error ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">Could not load cards</p>
              <p className="text-xs text-slate-400 mb-5">
                There was a problem connecting to the database. Please try again.
              </p>
              <a
                href="/cards"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </a>
            </div>
          </div>
        ) : (
          <CardsList items={items ?? []} />
        )}
      </main>
    </div>
  );
}
