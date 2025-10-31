"use client";

import React from "react";
import { Wallet, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDate = new Date();
  const currentMonth =
    searchParams.get("month") || (currentDate.getMonth() + 1).toString();
  const currentYear =
    searchParams.get("year") || currentDate.getFullYear().toString();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthChange = (month: string, year: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", month);
    params.set("year", year);
    router.push(`/dashboard?${params.toString()}`);
  };

  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: (date.getMonth() + 1).toString(),
      year: date.getFullYear().toString(),
      label: `${months[date.getMonth()]} ${date.getFullYear()}`,
    };
  });
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
              Finance Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your spending and savings
            </p>
          </div>
        </div>

        <div className="relative">
          <select
            value={`${currentMonth}-${currentYear}`}
            onChange={(e) => {
              const [month, year] = e.target.value.split("-");
              handleMonthChange(month, year);
            }}
            className="appearance-none px-5 py-3 pr-10 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-all"
          >
            {monthOptions.map(({ month, year, label }) => (
              <option key={`${month}-${year}`} value={`${month}-${year}`}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
