import { getUser } from "@/lib/supabase/server";
import prisma from "@/services/prisma";
import Navbar from "@/components/Navbar";
import { CheckCircle2, Sparkles, AlertCircle, CreditCard, Building2 } from "lucide-react";
import type { ParserConfigData } from "@/lib/parsers/configParser";

type BankInfo = {
  key: string;
  name: string;
  keywords: string[];
  cards: { type: "credit" | "debit"; supported: boolean }[];
  source: "builtin" | "ai";
};

const BUILTIN_BANKS: BankInfo[] = [
  {
    key: "mashreq",
    name: "Mashreq",
    keywords: ["mashreq", "mashreqbank"],
    cards: [{ type: "credit", supported: true }, { type: "debit", supported: false }],
    source: "builtin",
  },
  {
    key: "enbd",
    name: "Emirates NBD",
    keywords: ["emirates nbd", "dubai bank"],
    cards: [{ type: "credit", supported: false }, { type: "debit", supported: true }],
    source: "builtin",
  },
  {
    key: "emiratesislamic",
    name: "Emirates Islamic",
    keywords: ["emirates islamic"],
    cards: [{ type: "credit", supported: true }, { type: "debit", supported: false }],
    source: "builtin",
  },
  {
    key: "rakbank",
    name: "RAKBank",
    keywords: ["rakbank", "national bank of ras al khaimah"],
    cards: [{ type: "credit", supported: true }, { type: "debit", supported: false }],
    source: "builtin",
  },
  {
    key: "cbd",
    name: "Commercial Bank of Dubai (CBD)",
    keywords: ["commercial bank of dubai", "cbd"],
    cards: [{ type: "credit", supported: true }, { type: "debit", supported: false }],
    source: "builtin",
  },
];

async function getAiBanks(userId: string): Promise<BankInfo[]> {
  try {
    const rows = await prisma.parserConfig.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => {
      const config = r.config as ParserConfigData;
      return {
        key: r.id,
        name: r.bank,
        keywords: r.keywords as string[],
        cards: [{ type: config.cardType, supported: true }],
        source: "ai" as const,
      };
    });
  } catch {
    return [];
  }
}

function CardTypeBadge({ type, supported }: { type: string; supported: boolean }) {
  if (!supported) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
        <AlertCircle className="w-3 h-3" />
        {type}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        type === "credit"
          ? "bg-purple-50 text-purple-600 border border-purple-100"
          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
      }`}
    >
      <CheckCircle2 className="w-3 h-3" />
      {type}
    </span>
  );
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
              {bank.source === "ai" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 uppercase tracking-wide">
                  AI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{bank.keywords.join(", ")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {bank.cards.map((c) => (
            <CardTypeBadge key={c.type} type={c.type} supported={c.supported} />
          ))}
        </div>
      </div>
    </li>
  );
}

export default async function BanksPage() {
  const user = await getUser();
  const aiBanks = user ? await getAiBanks(user.id) : [];
  const allBanks = [...BUILTIN_BANKS, ...aiBanks];

  const builtinCount = BUILTIN_BANKS.length;
  const aiCount = aiBanks.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supported Banks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Built-in parsers plus any AI-generated parsers you&apos;ve created.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Banks", value: allBanks.length },
            { label: "Built-in", value: builtinCount },
            { label: "AI-created", value: aiCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Column legend */}
        <div className="flex items-center gap-4 mb-3 px-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Supported
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
            Not supported
          </span>
          <span className="flex items-center gap-1.5 text-xs text-violet-500">
            <Sparkles className="w-3.5 h-3.5" />
            AI-generated
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank</p>
            <div className="flex items-center gap-6 pr-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Card Types
              </p>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {allBanks.map((bank) => (
              <BankRow key={bank.key} bank={bank} />
            ))}
          </ul>
        </div>

        {user && (
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
