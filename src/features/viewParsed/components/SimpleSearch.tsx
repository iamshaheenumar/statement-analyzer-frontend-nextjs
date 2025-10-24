import React from "react";
import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SimpleSearch({ value, onChange }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow border border-white/20 p-3 sm:p-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search description..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm text-gray-800"
        />
      </div>
    </div>
  );
}

