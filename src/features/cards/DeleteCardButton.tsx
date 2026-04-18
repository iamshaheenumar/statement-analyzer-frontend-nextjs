"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCardAction } from "@/app/actions/card";

export function DeleteCardButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (confirm) {
      startTransition(async () => {
        try {
          await deleteCardAction(id);
          toast.success("Card deleted");
        } catch {
          toast.error("Failed to delete card");
        }
      });
    } else {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={confirm ? "Click again to confirm" : "Delete card"}
      className={`p-1.5 rounded-lg transition-colors ${
        confirm
          ? "bg-red-500 text-white"
          : "text-slate-300 hover:text-red-500 hover:bg-red-50"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
