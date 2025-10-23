"use client";

import React from "react";
import { Trash2 } from "lucide-react";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{description}</p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-2xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
