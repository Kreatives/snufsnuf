import { createClient } from "@supabase/supabase-js";

/**
 * Admin-client met de secret key (service role). Alleen server-side gebruiken.
 * Vereist SUPABASE_SECRET_KEY (lokaal in .env.local, op Vercel als env-var).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Supabase-admin ontbreekt: NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SECRET_KEY zijn vereist.");
  }
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
