"use client";

import { useState, useTransition } from "react";
import { Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";
import { submitUserParserAction } from "@/app/actions/submitParser";
import type { PageContent } from "@/lib/pdf/types";

interface Props {
  rawPageContent: PageContent[];
}

export default function UnknownBankBanner({ rawPageContent }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, startSubmit] = useTransition();

  function handleSubmit() {
    if (!rawPageContent.length) return;
    startSubmit(async () => {
      await submitUserParserAction(rawPageContent);
      setSubmitted(true);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-warning-muted border border-warning/20">
      <div className="flex items-center gap-2.5 min-w-0">
        <Sparkles className="w-4 h-4 text-warning shrink-0" />
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">Bank not recognized.</span>{" "}
          {submitted
            ? "Submitted for review — we'll add support for this bank soon."
            : "Original statement columns are unavailable for this entry."}
        </p>
      </div>
      {submitted ? (
        <CheckCircle className="w-4 h-4 text-success shrink-0" />
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {rawPageContent.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-semibold bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for Review"}
            </button>
          )}
          <Link
            href="/upload"
            className="px-3 py-1.5 text-xs font-semibold bg-warning text-black hover:bg-warning/90 rounded-lg transition-colors"
          >
            Re-upload
          </Link>
        </div>
      )}
    </div>
  );
}
