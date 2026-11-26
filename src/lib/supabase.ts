/**
 * Supabase browser client — publishable (anon) key only.
 *
 * The secret/service-role key is NEVER imported here.
 * All privileged operations are performed server-side by the FastAPI backend.
 *
 * Environment variables required (see .env.local.example):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
      "Copy .env.local.example → .env.local and fill in VITE_SUPABASE_URL " +
      "and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

const isBrowser = typeof window !== "undefined";

/**
 * Singleton Supabase client for the browser.
 * Browser storage and URL session detection are disabled during SSR.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session in browser localStorage only (never accessed during SSR).
    persistSession: isBrowser,
    // Automatically refresh the access token in the browser before it expires.
    autoRefreshToken: isBrowser,
    // Detect OAuth/magic-link fragments only in browser contexts.
    detectSessionInUrl: isBrowser,
  },
});
