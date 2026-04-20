"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin/parsers");
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-surface p-8">
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-accent-muted ring-1 ring-accent/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <h1 className="font-display text-xl font-bold text-text-primary tracking-tight">Admin Panel</h1>
          <p className="text-sm text-text-secondary mt-1">Enter your admin password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-text-secondary mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="Enter admin password"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-4 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-elevated disabled:text-text-muted text-black text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
