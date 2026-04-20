"use client";

import React from "react";
import { CreditCard } from "lucide-react";

export default function CreditCardTracker() {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-muted ring-1 ring-accent/30 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-accent" />
        </div>
        <h3 className="font-display text-base font-bold text-text-primary">Credit Card</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-text-muted">Total Due</p>
            <p className="font-display text-2xl font-bold text-text-primary font-mono tabular-nums">AED 2,450</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Minimum Due</p>
            <p className="font-display text-2xl font-bold text-warning font-mono tabular-nums">AED 125</p>
          </div>
        </div>
        <div className="bg-elevated rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-text-secondary">Due Date</span>
            <span className="text-xs font-bold font-mono text-text-primary">
              Nov 15, 2025
            </span>
          </div>
          <div className="h-2.5 bg-base rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: "60%" }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">60% of credit limit used</p>
        </div>
      </div>
    </div>
  );
}
