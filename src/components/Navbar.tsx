"use client";

import { useEffect, useState } from "react";
import { BarChart2, LayoutDashboard, ClipboardList, Upload, LogOut, LogIn, CreditCard, Sparkles, Building2, Sun, Moon, Monitor, Tag, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const AUTHED_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/statements", label: "Statements", icon: ClipboardList },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/parsers", label: "Parsers", icon: Sparkles },
  { href: "/banks", label: "Banks", icon: Building2 },
  { href: "/settings/categories", label: "Categories", icon: Tag },
];

const GUEST_NAV_LINKS = [
  { href: "/banks", label: "Banks", icon: Building2 },
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const isSystem = theme === "system";

  return (
    <div className="flex items-center gap-0.5 bg-elevated rounded-lg p-0.5 ring-1 ring-border">
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navLinks = user ? AUTHED_NAV_LINKS : GUEST_NAV_LINKS;
  const isUploadActive = pathname === "/upload";

  return (
    <>
      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/upload" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-accent-muted rounded-lg flex items-center justify-center ring-1 ring-accent/30">
            <BarChart2 className="w-4 h-4 text-accent" />
          </div>
          <span className="font-display font-semibold text-text-primary text-sm tracking-tight">Trace</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
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
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/upload"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              isUploadActive
                ? "bg-accent text-white shadow-md shadow-accent/30 ring-1 ring-accent"
                : "bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20"
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            Upload
          </Link>

          {ready && (
            user ? (
              <button
                onClick={handleSignOut}
                title={user.email}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger-muted transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-muted transition-colors"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                Sign in
              </Link>
            )
          )}
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-accent text-white shadow-sm shadow-accent/20 hover:bg-accent/90 transition-colors"
          >
            <Upload className="w-4 h-4 shrink-0" />
            Upload
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 z-10 bg-surface/95 backdrop-blur-xl border-b border-border shadow-lg">
          <nav className="flex flex-col p-3 gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-accent bg-accent-muted ring-1 ring-accent/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}

            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <ThemeToggle />
              {ready && (
                user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-accent-muted transition-colors"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    Sign in
                  </Link>
                )
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
