"use client";

import { useState, useTransition } from "react";
import { deleteStatementAction } from "@/app/actions/deleteStatement";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm) {
      startTransition(async () => {
        try {
          await deleteStatementAction(id);
          toast.success("Statement deleted");
        } catch {
          toast.error("Failed to delete");
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
      title={confirm ? "Click again to confirm" : "Delete statement"}
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
