"use client";

import React from "react";
import { CreditCard } from "lucide-react";

export default function CreditCardTracker() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Credit Card</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Due</p>
            <p className="text-2xl font-bold text-gray-900">AED 2,450</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Minimum Due</p>
            <p className="text-2xl font-bold text-orange-600">AED 125</p>
          </div>
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Due Date</span>
            <span className="text-sm font-bold text-gray-900">
              Nov 15, 2025
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: "60%" }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">60% of credit limit used</p>
        </div>
      </div>
    </div>
  );
}
