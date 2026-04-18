"use client";

import { useState, useTransition } from "react";
import { deleteStatementAction } from "@/app/actions/deleteStatement";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirm(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await deleteStatementAction(id);
        toast.success("Statement deleted");
      } catch {
        toast.error("Failed to delete");
      }
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirm(false);
  };

  if (confirm) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <span className="text-xs text-slate-500 whitespace-nowrap">Delete?</span>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      title="Delete statement"
      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
