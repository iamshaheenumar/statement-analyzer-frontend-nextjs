"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import UpdateParserWizard from "../../UpdateParserWizard";

interface ParserRow {
  id: string;
  bank: string;
  keywords: string[];
  config: Record<string, unknown>;
}

export default function UpdateParserClient({ parser }: { parser: ParserRow }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/parsers")}
          className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-elevated rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary tracking-tight">
            Update Parser
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Updating <strong className="text-text-primary">{parser.bank}</strong> parser configuration.
          </p>
        </div>
      </div>
      <UpdateParserWizard parser={parser} onClose={() => router.push("/admin/parsers")} />
    </div>
  );
}
