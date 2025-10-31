"use client";

import React from "react";

type Merchant = { name: string; amount: number; transactions: number };

export default function TopMerchants({ merchants }: { merchants: Merchant[] }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Top Merchants</h3>
      </div>
      <div className="space-y-3">
        {merchants.map((merchant, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-sm text-gray-700">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{merchant.name}</p>
                <p className="text-xs text-gray-500">
                  {merchant.transactions} transactions
                </p>
              </div>
            </div>
            <p className="font-bold text-gray-900">${merchant.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
