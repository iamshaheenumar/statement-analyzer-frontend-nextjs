"use client";

import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalBackdrop, modalPanel } from "@/lib/motion";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalBackdrop}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            className="relative z-10 w-full max-w-sm bg-surface border border-border rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-5"
            variants={modalPanel}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-danger-muted ring-1 ring-danger/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-danger" />
              </div>
              <h3 className="font-display text-sm font-semibold text-text-primary">{title}</h3>
            </div>
            <p className="text-sm text-text-secondary mb-5">{description}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold text-text-secondary bg-elevated hover:bg-overlay rounded-lg transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-semibold text-white bg-danger hover:bg-danger/80 rounded-lg transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
