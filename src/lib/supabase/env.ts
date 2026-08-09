/**
 * Leitura das variáveis de ambiente do Supabase.
 *
 * O site precisa funcionar mesmo sem credenciais: nesse caso o catálogo usa os
 * dados de demonstração locais e o painel administrativo exibe um aviso de
 * configuração pendente, em vez de quebrar.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const PRODUCT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET ?? "product-images";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

/**
 * Só pode ser chamado no servidor. A chave de service role nunca é enviada ao
 * navegador porque não usa o prefixo NEXT_PUBLIC_.
 */
export function getServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key && key.length > 0 ? key : null;
}
