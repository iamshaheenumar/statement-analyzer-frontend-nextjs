"use client";

import React from "react";
import { Calendar } from "lucide-react";

type Payment = {
  name: string;
  amount: number;
  nextDate: string;
  category: string;
};

export default function RecurringPayments({ payments }: { payments: Payment[] }) {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface p-6">
      <h3 className="font-display text-base font-bold text-text-primary mb-4">Recurring Payments</h3>
      <div className="space-y-2">
        {payments.map((payment, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-elevated hover:bg-overlay rounded-xl transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-text-primary">{payment.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="w-3 h-3 text-text-muted" />
                <p className="text-xs text-text-muted font-mono">
                  Next: {payment.nextDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold font-mono tabular-nums text-text-primary">${payment.amount}</p>
              <p className="text-xs text-text-muted">{payment.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
