"use client";

import React from "react";

type Merchant = { name: string; amount: number; transactions: number };

export default function TopMerchants({ merchants }: { merchants: Merchant[] }) {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface p-6">
      <h3 className="font-display text-base font-bold text-text-primary mb-4">Top Merchants</h3>
      <div className="space-y-2">
        {merchants.map((merchant, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-elevated hover:bg-overlay rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-base border border-border flex items-center justify-center font-bold font-mono text-xs text-text-secondary">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{merchant.name}</p>
                <p className="text-xs text-text-muted">
                  {merchant.transactions} transactions
                </p>
              </div>
            </div>
            <p className="font-bold font-mono tabular-nums text-text-primary">${merchant.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
