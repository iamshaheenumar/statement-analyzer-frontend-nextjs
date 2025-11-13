"use client";

import React from "react";
import { Wallet, ChevronDown, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type HeaderProps = {
  availableMonths: { month: string; year: string }[];
};

export default function Header({ availableMonths }: HeaderProps) {
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

  const fallbackMonthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: (date.getMonth() + 1).toString(),
      year: date.getFullYear().toString(),
      label: `${months[date.getMonth()]} ${date.getFullYear()}`,
    };
  });

  const monthOptions =
    availableMonths.length > 0
      ? availableMonths.map(({ month, year }) => {
          const monthIndex = Number(month) - 1;
          const labelMonth = months[monthIndex] || `Month ${month}`;
          return {
            month,
            year,
            label: `${labelMonth} ${year}`,
          };
        })
      : fallbackMonthOptions;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
              Finance Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Track your spending and savings
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-auto">
          <div className="relative w-full md:min-w-[220px]">
            <select
              value={`${currentMonth}-${currentYear}`}
              onChange={(e) => {
                const [month, year] = e.target.value.split("-");
                handleMonthChange(month, year);
              }}
              className="w-full appearance-none px-5 py-3 pr-12 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-all"
            >
              {monthOptions.map(({ month, year, label }) => (
                <option key={`${month}-${year}`} value={`${month}-${year}`}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/statements"
              className="flex-1 min-w-[150px] md:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Statements
            </Link>
            <Link
              href="/upload"
              className="flex-1 min-w-[150px] md:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
