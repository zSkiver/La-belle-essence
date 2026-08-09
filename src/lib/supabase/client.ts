"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

export type BrowserSupabaseClient = SupabaseClient<Database>;

let cached: BrowserSupabaseClient | null = null;

/**
 * Cliente do navegador. Retorna `null` quando o projeto ainda não foi
 * configurado, para que a interface possa exibir uma mensagem em vez de falhar.
 */
export function getBrowserSupabase(): BrowserSupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cached;
}
