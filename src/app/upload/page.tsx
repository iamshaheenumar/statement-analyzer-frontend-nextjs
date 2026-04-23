"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import type { SavedCard } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import SaveCardPrompt from "@/features/upload/SaveCardPrompt";
import SaveParserPrompt from "@/features/upload/SaveParserPrompt";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCardsAction } from "@/app/actions/card";
import { Sparkles, Loader2 } from "lucide-react";
import type { ParserConfigData } from "@/lib/parsers/configParser";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

type PendingCard = {
  parsedId: string;
  bank: string;
  cardType: string;
  cardVariant: string | null;
  usedPassword: string;
};

type PendingParser = {
  parsedId: string;
  bank: string;
  cardType: string;
  suggestedConfig: ParserConfigData;
};

type Stage =
  | { type: "idle" }
  | { type: "unknown_bank"; pages: any[]; password: string }
  | { type: "ai_parsing" }
  | { type: "save_parser"; pending: PendingParser }
  | { type: "save_card"; pending: PendingCard }
  | { type: "done"; parsedId: string };

export default function UploadPage() {
  const router = useRouter();
  const { parsedList, addParsed, deleteParsed } = useParsedStorage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  const refreshCards = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const cards = await getCardsAction();
    setSavedCards(cards as SavedCard[]);
  };

  useEffect(() => {
    refreshCards();
  }, []);

  async function handleParseSuccess(
    result: any,
    parsedId: string,
    usedPassword: string,
  ) {
    const {
      bank,
      card_type: cardType,
      card_variant: cardVariant,
      parsedBy,
      suggestedConfig,
    } = result;

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isLoggedIn = !!session;

    const cardAlreadySaved = savedCards.some(
      (c) =>
        c.bank === bank &&
        c.cardType === cardType &&
        (c.cardVariant ?? null) === (cardVariant ?? null),
    );

    if (isLoggedIn && parsedBy === "ai" && suggestedConfig) {
      setStage({
        type: "save_parser",
        pending: { parsedId, bank, cardType, suggestedConfig },
      });
      return;
    }

    if (isLoggedIn && !cardAlreadySaved) {
      setStage({
        type: "save_card",
        pending: {
          parsedId,
          bank,
          cardType,
          cardVariant: cardVariant ?? null,
          usedPassword,
        },
      });
      return;
    }

    router.push(`/view-parsed?id=${parsedId}`);
  }

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const { extractPdfPages } = await import("@/services/parsePDF");
      const pages = await extractPdfPages(
        data.file[0],
        data.password || undefined,
      );
      const res = await axios.post("/api/parse", { pages });
      const result = res.data;

      if (result.parsedBy === "generic" || result.bank === "unknown") {
        setStage({
          type: "unknown_bank",
          pages,
          password: data.password || "",
        });
        return;
      }

      const saved = await addParsed(result);
      await handleParseSuccess(result, saved.id, data.password || "");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to parse file",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiParse = async () => {
    if (stage.type !== "unknown_bank") return;
    const { pages, password } = stage;
    setStage({ type: "ai_parsing" });
    setError(null);

    try {
      const res = await axios.post("/api/ai-parse", { pages });
      const result = res.data;
      const saved = await addParsed(result);
      await handleParseSuccess(result, saved.id, password);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "AI parsing failed. Please try again.",
      );
      setStage({ type: "unknown_bank", pages, password });
    }
  };

  const handleSaveParserDone = async () => {
    if (stage.type !== "save_parser") return;
    const { parsedId } = stage.pending;

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      setStage({
        type: "save_card",
        pending: {
          parsedId,
          bank: stage.pending.bank,
          cardType: stage.pending.cardType,
          cardVariant: null,
          usedPassword: "",
        },
      });
    } else {
      router.push(`/view-parsed?id=${parsedId}`);
    }
  };

  const handleSaveCardDone = () => {
    if (stage.type !== "save_card") return;
    const id = stage.pending.parsedId;
    refreshCards();
    setStage({ type: "idle" });
    router.push(`/view-parsed?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <motion.main
        className="max-w-xl mx-auto px-4 py-12"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <div className="mb-7">
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
            Import Statement
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload a bank PDF to extract and review your transactions.
          </p>
        </div>

        {stage.type === "save_parser" ? (
          <SaveParserPrompt
            bank={stage.pending.bank}
            cardType={stage.pending.cardType}
            suggestedConfig={stage.pending.suggestedConfig}
            onDone={handleSaveParserDone}
          />
        ) : stage.type === "save_card" ? (
          <SaveCardPrompt
            bank={stage.pending.bank}
            cardType={stage.pending.cardType}
            cardVariant={stage.pending.cardVariant}
            usedPassword={stage.pending.usedPassword}
            onDone={handleSaveCardDone}
          />
        ) : stage.type === "unknown_bank" || stage.type === "ai_parsing" ? (
          <UnknownBankPanel
            isLoading={stage.type === "ai_parsing"}
            error={error}
            onAiParse={handleAiParse}
            onBack={() => {
              setStage({ type: "idle" });
              setError(null);
            }}
          />
        ) : (
          <UploadForm
            onSubmit={onSubmit}
            isLoading={isLoading}
            error={error}
            savedCards={savedCards}
          />
        )}

        {stage.type === "idle" && parsedList.length > 0 && (
          <div className="mt-8">
            <ParsedList
              parsedList={parsedList}
              onSelect={(id) => router.push(`/view-parsed?id=${id}`)}
              onDelete={(id) => deleteParsed(id)}
            />
          </div>
        )}
      </motion.main>
    </div>
  );
}

function UnknownBankPanel({
  isLoading,
  error,
  onAiParse,
  onBack,
}: {
  isLoading: boolean;
  error: string | null;
  onAiParse: () => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      <div className="px-6 py-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent-muted ring-1 ring-accent/20 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-accent" />
        </div>
        <h2 className="font-display text-base font-bold text-text-primary mb-1">
          Bank not recognized
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          This bank isn&apos;t in our built-in library yet. Use AI to parse the
          statement — it reads any format and learns the pattern for next time.
        </p>

        {error && (
          <p className="text-xs text-danger mb-4 bg-danger-muted px-3 py-2 rounded-lg border border-danger/20">
            {error}
          </p>
        )}

        <button
          onClick={onAiParse}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-black text-sm font-semibold transition-colors disabled:opacity-60 shadow-[0_0_20px_#00d4ff33]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isLoading ? "Parsing with AI…" : "Parse with AI"}
        </button>

        <button
          onClick={onBack}
          disabled={isLoading}
          className="mt-3 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Upload a different file
        </button>
      </div>
    </div>
  );
}
