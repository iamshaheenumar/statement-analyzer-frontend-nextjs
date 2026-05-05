"use client";

import { useTransition, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { ParsedDataWithId } from "@/features/dashboard/types";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import { saveStatementAction } from "@/app/actions/saveStatement";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import SavingModal from "./SavingModal";

type Props = {
  parsedData?: ParsedDataWithId | null;
  saving?: boolean;
  onSavingChange?: (value: boolean) => void;
  className?: string;
};

export default function SaveToCloudButton({ parsedData, className }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savePhase, setSavePhase] = useState<"saving" | "success">("saving");
  const [savedId, setSavedId] = useState<string | null>(null);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { deleteParsed } = useParsedStorage();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  const handleViewStatement = () => {
    if (redirectTimeout.current) clearTimeout(redirectTimeout.current);
    if (savedId) router.push(`/statements/${savedId}`);
  };

  const handleClick = () => {
    if (!parsedData || isPending) return;

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setModalOpen(true);
    setSavePhase("saving");

    startTransition(async () => {
      const result = await saveStatementAction(parsedData);
      if (result && "error" in result) {
        setModalOpen(false);
        setSavePhase("saving");
        if (result.code === "AUTH") {
          router.push("/login");
        } else {
          toast.error(result.error || "Unable to save. Please try again.");
        }
        return;
      }
      await deleteParsed(parsedData.id);
      setSavedId(result.id);
      setSavePhase("success");
      redirectTimeout.current = setTimeout(() => {
        router.push(`/statements/${result.id}`);
      }, 1200);
    });
  };

  if (isLoggedIn === null) {
    return (
      <button
        disabled
        className={["inline-flex items-center gap-2 px-4 py-2 bg-elevated text-text-muted text-sm font-semibold rounded-lg", className]
          .filter(Boolean)
          .join(" ")}
      >
        <CloudUpload className="w-4 h-4" />
        Save to Cloud
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        onClick={handleClick}
        className={["inline-flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-overlay border border-border text-text-secondary hover:text-text-primary text-sm font-semibold rounded-lg transition-colors", className]
          .filter(Boolean)
          .join(" ")}
      >
        <LogIn className="w-4 h-4" />
        Sign in to Save
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!parsedData || isPending}
        className={["inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors", className]
          .filter(Boolean)
          .join(" ")}
      >
        <CloudUpload className="w-4 h-4" />
        Save to Cloud
      </button>

      <SavingModal
        open={modalOpen}
        phase={savePhase}
        transactionCount={parsedData?.summary.record_count}
        onViewStatement={handleViewStatement}
      />
    </>
  );
}
