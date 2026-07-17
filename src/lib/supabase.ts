import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when Yaada Builder is configured to use shared Supabase (login required). */
export function isCloudEnabled(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isCloudEnabled()) {
    throw new Error("Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)");
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
