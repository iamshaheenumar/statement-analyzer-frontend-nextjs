import { getUser } from "@/lib/supabase/server";
import prisma from "@/services/prisma";
import ParsersList from "@/features/parsers/ParsersList";
import Navbar from "@/components/Navbar";
import { AlertCircle, RefreshCw } from "lucide-react";

async function getParsers(userId: string) {
  try {
    const items = await prisma.parserConfig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { items };
  } catch {
    return { error: true };
  }
}

export default async function ParsersPage() {
  const user = await getUser();
  const { items, error } = await getParsers(user!.id);

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="font-display text-xl font-bold text-text-primary tracking-tight">My Parsers</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            AI-generated parsers for banks not in the built-in library.
          </p>
        </div>

        {error ? (
          <div className="bg-surface border border-border rounded-2xl shadow-surface">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-danger-muted ring-1 ring-danger/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5 text-danger" />
              </div>
              <p className="font-display text-sm font-semibold text-text-primary mb-1">Could not load parsers</p>
              <p className="text-xs text-text-muted mb-5">There was a problem connecting to the database.</p>
              <a
                href="/parsers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-overlay border border-border text-text-secondary text-sm font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </a>
            </div>
          </div>
        ) : (
          <ParsersList items={items ?? []} />
        )}
      </main>
    </div>
  );
}
