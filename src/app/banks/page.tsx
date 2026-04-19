import { getUser } from "@/lib/supabase/server";
import prisma from "@/services/prisma";
import Navbar from "@/components/Navbar";
import { CheckCircle2, Sparkles, CreditCard, Building2 } from "lucide-react";
import type { ParserConfigData } from "@/lib/parsers/configParser";

type BankInfo = {
  key: string;
  name: string;
  keywords: string[];
  cardType: string;
  source: "admin" | "ai";
};

async function getApprovedBanks(): Promise<BankInfo[]> {
  try {
    const rows = await prisma.parserConfig.findMany({
      where: { active: true, status: "approved" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => {
      const config = r.config as ParserConfigData;
      return {
        key: r.id,
        name: r.bank,
        keywords: r.keywords as string[],
        cardType: config.cardType ?? "credit",
        source: (r.source === "admin" ? "admin" : "ai") as "admin" | "ai",
      };
    });
  } catch {
    return [];
  }
}

function BankRow({ bank }: { bank: BankInfo }) {
  return (
    <li className="px-4 sm:px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              bank.source === "ai" ? "bg-violet-50" : "bg-blue-50"
            }`}
          >
            {bank.source === "ai" ? (
              <Sparkles className="w-4 h-4 text-violet-500" />
            ) : (
              <Building2 className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">{bank.name}</p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                  bank.source === "ai"
                    ? "bg-violet-50 text-violet-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {bank.source === "ai" ? "AI" : "Admin"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{bank.keywords.join(", ")}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            bank.cardType === "credit"
              ? "bg-purple-50 text-purple-600 border border-purple-100"
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          {bank.cardType}
        </span>
      </div>
    </li>
  );
}

export default async function BanksPage() {
  const user = await getUser();
  const banks = await getApprovedBanks();

  const adminBanks = banks.filter((b) => b.source === "admin");
  const aiBanks = banks.filter((b) => b.source === "ai");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supported Banks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All parsers are managed by the admin and stored in the database.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Banks", value: banks.length },
            { label: "Admin-created", value: adminBanks.length },
            { label: "AI-created", value: aiBanks.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Card Type
            </p>
          </div>

          {banks.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-400">No approved parsers yet.</p>
              {user && (
                <p className="text-xs text-slate-400 mt-2">
                  Upload a statement and use AI to add a bank, or ask an admin to create one.
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {banks.map((bank) => (
                <BankRow key={bank.key} bank={bank} />
              ))}
            </ul>
          )}
        </div>

        {user && banks.length > 0 && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            Don&apos;t see your bank?{" "}
            <a href="/upload" className="text-violet-600 hover:underline font-medium">
              Upload a statement
            </a>{" "}
            and use AI to add it.
          </p>
        )}
      </main>
    </div>
  );
}
