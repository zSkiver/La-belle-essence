import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, getServiceRoleKey, isSupabaseConfigured } from "./env";

export type ServerSupabaseClient = SupabaseClient<Database>;

/**
 * Cliente autenticado pelo cookie de sessão. Use em Server Components, Route
 * Handlers e Server Actions. Retorna `null` se o Supabase não estiver
 * configurado.
 */
export async function getServerSupabase(): Promise<ServerSupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies. A renovação da sessão
          // acontece no middleware, então ignorar aqui é seguro.
        }
      },
    },
  });
}

/**
 * Cliente somente leitura, sem cookies. Usado nas páginas públicas para que o
 * catálogo possa ser renderizado estaticamente e revalidado por tempo — ler
 * cookies tornaria a rota dinâmica a cada requisição.
 */
export function getPublicSupabase(): ServerSupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente com service role — ignora RLS. Uso restrito ao servidor e apenas onde
 * a operação é anônima por natureza (registro de cliques). Nunca exponha o
 * resultado desta função ao cliente.
 */
export function getServiceSupabase(): ServerSupabaseClient | null {
  const serviceKey = getServiceRoleKey();
  if (!isSupabaseConfigured() || !serviceKey) return null;

  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
