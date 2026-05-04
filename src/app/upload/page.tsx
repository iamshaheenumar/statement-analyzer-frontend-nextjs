"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import type { SavedCard } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import SaveCardPrompt from "@/features/upload/SaveCardPrompt";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCardsAction } from "@/app/actions/card";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

type PendingCard = {
  parsedId: string;
  bank: string;
  cardType: string;
  cardVariant: string | null;
  usedPassword: string;
};

type Stage =
  | { type: "idle" }
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
    const { data: { session } } = await supabase.auth.getSession();
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
    selectedCard: SavedCard | null,
  ) {
    const { bank, card_type: cardType, card_variant: cardVariant } = result;

    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const isLoggedIn = !!session;

    if (isLoggedIn && selectedCard === null) {
      setStage({
        type: "save_card",
        pending: { parsedId, bank, cardType, cardVariant: cardVariant ?? null, usedPassword },
      });
      return;
    }

    router.push(`/view-parsed/${parsedId}`);
  }

  const runAiParse = async (pages: any[], password: string, selectedCard: SavedCard | null) => {
    setError(null);
    try {
      const res = await axios.post("/api/ai-parse", { pages });
      const result = res.data;
      const saved = await addParsed(result);
      await handleParseSuccess(result, saved.id, password, selectedCard);
    } catch (err: any) {
      setError(err.response?.data?.error || "AI parsing failed. Please try again.");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);
    try {
      const { extractPdfPages } = await import("@/services/parsePDF");
      const pages = await extractPdfPages(data.file[0], data.password || undefined);
      const selectedCard = data.bankSelection.type === "saved_card" ? data.bankSelection.card : null;
      await runAiParse(pages, data.password || "", selectedCard);
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

  const handleSaveCardDone = () => {
    if (stage.type !== "save_card") return;
    const id = stage.pending.parsedId;
    refreshCards();
    setStage({ type: "idle" });
    router.push(`/view-parsed/${id}`);
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

        {stage.type === "save_card" ? (
          <SaveCardPrompt
            bank={stage.pending.bank}
            cardType={stage.pending.cardType}
            cardVariant={stage.pending.cardVariant}
            usedPassword={stage.pending.usedPassword}
            onDone={handleSaveCardDone}
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
              onSelect={(id) => router.push(`/view-parsed/${id}`)}
              onDelete={(id) => deleteParsed(id)}
            />
          </div>
        )}
      </motion.main>
    </div>
  );
}
