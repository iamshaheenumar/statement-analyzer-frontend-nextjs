import Link from "next/link";
import { ClipboardList, Upload, LayoutDashboard } from "lucide-react";

export default function HeaderCard() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
              Saved Statements
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage your cloud-saved statements
            </p>
          </div>
        </div>

        <div className="flex gap-3 self-start sm:self-auto">
          <Link
            href="/dashboard"
            className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </span>
          </Link>

          <Link
            href="/upload"
            className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
