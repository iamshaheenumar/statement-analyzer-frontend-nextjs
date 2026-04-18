"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import SaveCardPrompt from "@/features/upload/SaveCardPrompt";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCardsAction } from "@/app/actions/card";

type SavedCard = {
  id: string;
  bank: string;
  cardNumber: string | null;
  cardType: string;
  password: string | null;
  nickname: string | null;
};

type PendingCard = {
  parsedId: string;
  bank: string;
  cardType: string;
  cardNumber: string | null;
  usedPassword: string;
};

export default function UploadPage() {
  const router = useRouter();
  const { parsedList, addParsed, deleteParsed } = useParsedStorage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [autoPassword, setAutoPassword] = useState("");
  const [autoPasswordNote, setAutoPasswordNote] = useState("");
  const [pendingCard, setPendingCard] = useState<PendingCard | null>(null);

  // Load saved cards once user is authenticated
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      getCardsAction().then((cards) => setSavedCards(cards as SavedCard[]));
    });
  }, []);

  // Called by UploadForm when a file is selected
  const handleFileReady = (file: File, cardNumber: string | null) => {
    setAutoPassword("");
    setAutoPasswordNote("");
    if (!cardNumber) return;

    const match = savedCards.find(
      (c) => c.cardNumber?.toUpperCase() === cardNumber.toUpperCase()
    );
    if (match?.password) {
      setAutoPassword(match.password);
      setAutoPasswordNote(match.nickname || `${match.bank} ${cardNumber.slice(-4)}`);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const { extractPdfPages } = await import("@/services/parsePDF");
      const pages = await extractPdfPages(data.file[0], data.password || undefined);
      const res = await axios.post("/api/parse", { pages });
      const saved = await addParsed(res.data);

      const { bank, card_type } = res.data as { bank: string; card_type: string };

      // Extract card number from the filename
      const filename = data.file[0]?.name ?? "";
      const cardNumMatch = filename.match(/(\d{4,8}[Xx*]+\d{4})/);
      const cardNumber = cardNumMatch ? cardNumMatch[1].toUpperCase() : null;

      // Check if user is logged in and card not already saved
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const isLoggedIn = !!session;

      const alreadySaved = cardNumber
        ? savedCards.some((c) => c.cardNumber?.toUpperCase() === cardNumber.toUpperCase())
        : false;

      if (isLoggedIn && !alreadySaved) {
        setPendingCard({
          parsedId: saved?.id ?? "",
          bank,
          cardType: card_type,
          cardNumber,
          usedPassword: data.password || "",
        });
      } else {
        router.push(`/view-parsed?id=${saved?.id}`);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to parse file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCardDone = () => {
    const id = pendingCard?.parsedId;
    setPendingCard(null);
    router.push(`/view-parsed?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Import Statement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload a bank PDF to extract and review your transactions.
          </p>
        </div>

        {pendingCard ? (
          <SaveCardPrompt
            bank={pendingCard.bank}
            cardType={pendingCard.cardType}
            cardNumber={pendingCard.cardNumber}
            usedPassword={pendingCard.usedPassword}
            onDone={handleSaveCardDone}
          />
        ) : (
          <UploadForm
            onSubmit={onSubmit}
            isLoading={isLoading}
            error={error}
            autoPassword={autoPassword}
            autoPasswordNote={autoPasswordNote}
            onFileReady={handleFileReady}
          />
        )}

        {parsedList.length > 0 && !pendingCard && (
          <div className="mt-8">
            <ParsedList
              parsedList={parsedList}
              onSelect={(id) => router.push(`/view-parsed?id=${id}`)}
              onDelete={(id) => deleteParsed(id)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
