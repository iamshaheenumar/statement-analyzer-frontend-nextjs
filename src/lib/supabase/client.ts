import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components.
 * Call once per component (not in a loop) — @supabase/ssr deduplicates internally.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
