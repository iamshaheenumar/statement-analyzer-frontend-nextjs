"use client";

import { useEffect, useState } from "react";
import { BarChart2, LayoutDashboard, ClipboardList, Upload, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const AUTHED_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/statements", label: "Statements", icon: ClipboardList },
  { href: "/upload", label: "Upload", icon: Upload },
];

const GUEST_LINKS = [
  { href: "/upload", label: "Upload", icon: Upload },
];

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
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 sm:px-6">
      <Link href="/upload" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm tracking-tight">Trace</span>
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
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}

        {/* Auth */}
        {ready && (
          user ? (
            <button
              onClick={handleSignOut}
              title={user.email}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors ml-1"
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
