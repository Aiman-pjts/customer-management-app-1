import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" && (window as unknown as { __ENV?: Record<string, string> }).__ENV?.NEXT_PUBLIC_SUPABASE_URL) ||
    "";

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" && (window as unknown as { __ENV?: Record<string, string> }).__ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
