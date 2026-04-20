"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 mr-auto">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold font-display text-text-primary tracking-tight">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/parsers"
              className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
            >
              Parsers
            </Link>
          </nav>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-sm font-medium text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
