"use client";

import { useEffect, useState } from "react";
import { BarChart2, LayoutDashboard, ClipboardList, Upload, LogOut, LogIn, CreditCard, Sparkles, Building2, Sun, Moon, Monitor, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const AUTHED_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/statements", label: "Statements", icon: ClipboardList },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/parsers", label: "Parsers", icon: Sparkles },
  { href: "/banks", label: "Banks", icon: Building2 },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings/categories", label: "Categories", icon: Tag },
];

const GUEST_LINKS = [
  { href: "/banks", label: "Banks", icon: Building2 },
  { href: "/upload", label: "Upload", icon: Upload },
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const next = resolvedTheme === "dark" ? "light" : "dark";
  const isDark = resolvedTheme === "dark";
  const isSystem = theme === "system";

  return (
    <div className="flex items-center gap-0.5 ml-1 bg-elevated rounded-lg p-0.5 ring-1 ring-border">
      <button
        onClick={() => setTheme("light")}
        title="Light mode"
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light" ? "bg-surface text-accent shadow-sm" : "text-text-muted hover:text-text-secondary"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        title="System preference"
        className={`p-1.5 rounded-md transition-colors ${
          isSystem ? "bg-surface text-accent shadow-sm" : "text-text-muted hover:text-text-secondary"
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        title="Dark mode"
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark" ? "bg-surface text-accent shadow-sm" : "text-text-muted hover:text-text-secondary"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const links = user ? AUTHED_LINKS : GUEST_LINKS;

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-4 sm:px-6">
      <Link href="/upload" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-accent-muted rounded-lg flex items-center justify-center ring-1 ring-accent/30">
          <BarChart2 className="w-4 h-4 text-accent" />
        </div>
        <span className="font-display font-semibold text-text-primary text-sm tracking-tight">Trace</span>
      </Link>

      <nav className="flex items-center gap-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-accent bg-accent-muted ring-1 ring-accent/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-elevated"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}

        <ThemeToggle />

        {ready && (
          user ? (
            <button
              onClick={handleSignOut}
              title={user.email}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger-muted transition-colors ml-1"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-muted transition-colors ml-1"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )
        )}
      </nav>
    </header>
  );
}
