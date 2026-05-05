"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, CheckCircle2, ArrowRight } from "lucide-react";
import { modalBackdrop, modalPanel, savingPhaseContent } from "@/lib/motion";

type Props = {
  open: boolean;
  phase: "saving" | "success";
  transactionCount?: number;
  onViewStatement: () => void;
};

export default function SavingModal({ open, phase, transactionCount, onViewStatement }: Props) {
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
            onClick={phase === "success" ? onViewStatement : undefined}
            aria-hidden
          />

          <motion.div
            className="relative z-10 w-full max-w-xs bg-surface border border-border rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 overflow-hidden"
            variants={modalPanel}
          >
            {/* Progress bar — persists across phase transitions */}
            <div className="h-1 w-full bg-elevated rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: phase === "saving" ? "80%" : "100%" }}
                transition={
                  phase === "saving"
                    ? { duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }
                    : { duration: 0.4, ease: "easeOut" }
                }
              />
            </div>

            {/* Phase content */}
            <AnimatePresence mode="wait">
              {phase === "saving" ? (
                <motion.div
                  key="saving"
                  variants={savingPhaseContent}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex flex-col items-center gap-4 pb-2"
                >
                  {/* Spinner ring with cloud icon */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                    />
                    <CloudUpload className="w-7 h-7 text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary">Uploading to cloud</p>
                    <p className="text-xs text-text-secondary mt-1">Hang tight, almost there…</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  variants={savingPhaseContent}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex flex-col items-center gap-3 pb-2"
                >
                  {/* Bouncing checkmark */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, mass: 0.8 }}
                    className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
                    className="text-base font-semibold text-text-primary"
                  >
                    Saved!
                  </motion.h3>

                  {transactionCount != null && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.22, duration: 0.2 }}
                      className="text-sm text-text-secondary"
                    >
                      {transactionCount} transactions uploaded to cloud
                    </motion.p>
                  )}

                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.25, ease: "easeOut" }}
                    onClick={onViewStatement}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-xl transition-colors"
                  >
                    View Statement
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
