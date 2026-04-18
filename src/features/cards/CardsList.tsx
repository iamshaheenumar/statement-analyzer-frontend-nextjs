"use client";

import { useState } from "react";
import { CreditCard, Lock, Eye, EyeOff, Upload } from "lucide-react";
import { DeleteCardButton } from "./DeleteCardButton";

type BankCard = {
  id: string;
  bank: string;
  cardNumber: string | null;
  cardType: string;
  password: string | null;
  nickname: string | null;
  createdAt: Date | string;
};

type Props = { items: BankCard[] };

function CardRow({ card }: { card: BankCard }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <li className="flex items-stretch group">
      <div className="flex-1 min-w-0 px-4 sm:px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {card.nickname || card.bank}
              </p>
              {card.nickname && (
                <p className="text-xs text-slate-400 truncate">{card.bank}</p>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              card.cardType === "credit"
                ? "bg-purple-50 text-purple-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {card.cardType}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2.5">
          {card.cardNumber && (
            <span className="text-xs text-slate-500 font-mono tracking-wider">
              {card.cardNumber}
            </span>
          )}
          {card.password ? (
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400 font-mono">
                {showPassword ? card.password : "••••••••"}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-300">No password saved</span>
          )}
        </div>
      </div>

      <div className="flex items-start px-3 pt-4">
        <DeleteCardButton id={card.id} />
      </div>
    </li>
  );
}

export default function CardsList({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No saved cards</p>
          <p className="text-xs text-slate-400 mb-5">
            Cards are saved automatically when you parse a statement.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {items.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}
      </ul>
    </div>
  );
}
