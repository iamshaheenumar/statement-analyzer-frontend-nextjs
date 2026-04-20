import Link from "next/link";
import { ClipboardList, Upload, LayoutDashboard } from "lucide-react";

export default function HeaderCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-muted ring-1 ring-accent/30 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary tracking-tight">
              Saved Statements
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              View and manage your cloud-saved statements
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-overlay border border-border text-text-secondary hover:text-text-primary text-sm font-semibold rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-lg transition-colors shadow-[0_0_20px_#00d4ff33]"
          >
            <Upload className="w-4 h-4" />
            Upload New
          </Link>
        </div>
      </div>
    </div>
  );
}
