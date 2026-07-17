/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPENAI_API_URL: string;
  readonly VITE_OPENAI_MODEL: string;
  /** Shared Supabase project URL (same as TinyHustle). Enables login + cloud sync. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon key only — never the service_role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
