"use client";

import { useState, useTransition } from "react";
import { deleteStatementAction } from "@/app/actions/deleteStatement";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm) {
      startTransition(async () => {
        try {
          await deleteStatementAction(id);
          setDeleteConfirm(false);
          toast.success("Statement deleted");
        } catch (err: any) {
          console.error(err);
          toast.error("Failed to delete");
        }
      });
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => handleDelete(e)}
        className={`group/delete p-2 rounded-xl transition-all duration-300 ${
          deleteConfirm
            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
            : "bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300"
        }`}
        title={deleteConfirm ? "Click again to confirm" : "Delete statement"}
      >
        {deleteConfirm ? (
          <AlertCircle
            className={`w-4 h-4 text-white ${isPending ? "animate-spin" : ""}`}
          />
        ) : (
          <Trash2 className="w-4 h-4 text-gray-400 group-hover/delete:text-red-500 transition-colors" />
        )}
      </button>

      {/* Delete Confirmation Tooltip */}
      {deleteConfirm && (
        <div className="absolute top-14 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg z-20 whitespace-nowrap animate-pulse">
          Click again to confirm
        </div>
      )}
    </div>
  );
}
