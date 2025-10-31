"use client";

import React from "react";
import { Calendar } from "lucide-react";

type Payment = {
  name: string;
  amount: number;
  nextDate: string;
  category: string;
};

export default function RecurringPayments({
  payments,
}: {
  payments: Payment[];
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Recurring Payments</h3>
      </div>
      <div className="space-y-3">
        {payments.map((payment, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900">{payment.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">
                  Next: {payment.nextDate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">${payment.amount}</p>
              <p className="text-xs text-gray-500">{payment.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
