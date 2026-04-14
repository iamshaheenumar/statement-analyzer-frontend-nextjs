"use client";

import { ChevronDown, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type Props = {
  availableMonths: { month: string; year: string }[];
};

export default function Header({ availableMonths }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();

  const currentMonth = searchParams.get("month") || String(now.getMonth() + 1);
  const currentYear  = searchParams.get("year")  || String(now.getFullYear());

  const fallback = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { month: String(d.getMonth() + 1), year: String(d.getFullYear()) };
  });

  const options = (availableMonths.length > 0 ? availableMonths : fallback).map(
    ({ month, year }) => ({
      value: `${month}-${year}`,
      label: `${MONTHS[+month - 1]} ${year}`,
    })
  );

  const handleChange = (val: string) => {
    const [m, y] = val.split("-");
    const p = new URLSearchParams(searchParams);
    p.set("month", m);
    p.set("year", y);
    router.push(`/dashboard?${p.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your transactions</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Month selector */}
        <div className="relative">
          <select
            value={`${currentMonth}-${currentYear}`}
            onChange={(e) => handleChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {options.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <Link
          href="/upload"
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </Link>
      </div>
    </div>
  );
}
