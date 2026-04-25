"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MultiSampleWizard from "../MultiSampleWizard";

export default function CreateParserClient({
  initialPages,
  pendingSubmissionId,
}: {
  initialPages?: Array<{ page: number; lines: string[]; text: string }>;
  pendingSubmissionId?: string;
}) {
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
            {pendingSubmissionId ? "Review Submission with AI" : "Create Parser with AI"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {pendingSubmissionId
              ? "AI will analyze the submitted statement and generate a parser configuration."
              : "Upload bank statement PDFs and let AI generate a parser configuration."}
          </p>
        </div>
      </div>
      <MultiSampleWizard
        onClose={() => router.push("/admin/parsers")}
        initialPages={initialPages}
        pendingSubmissionId={pendingSubmissionId}
      />
    </div>
  );
}
