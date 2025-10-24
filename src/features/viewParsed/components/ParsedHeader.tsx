"use client";

import React from "react";
import {
  ArrowLeft,
  CalendarRange,
  CreditCard,
  Building2,
} from "lucide-react";

type Props = {
  bank?: string;
  fromDate?: string | null;
  toDate?: string | null;
  cardType?: string | null;
  onBack?: () => void;
};

export default function ParsedHeader({
  bank,
  fromDate,
  toDate,
  cardType,
  onBack,
}: Props) {
  const showPeriod = Boolean(fromDate || toDate);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 px-5 py-5 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Parsed Statement
              </p>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug">
                {bank || "Unknown Bank"}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {showPeriod ? (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold">
              <CalendarRange className="w-4 h-4" />
              {fromDate || "Start"} - {toDate || "End"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs sm:text-sm">
              <CalendarRange className="w-4 h-4" />
              No statement period
            </span>
          )}

          {cardType && (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs sm:text-sm font-semibold">
              <CreditCard className="w-4 h-4" />
              {cardType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
