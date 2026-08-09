import { NextResponse } from "next/server";
import { whatsappClickSchema } from "@/domain/schemas";
import { getPublicSupabase, getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registra um clique de WhatsApp.
 *
 * Nenhum dado pessoal é gravado — apenas produto, variante, unidade, origem do
 * clique e parâmetros de campanha. A resposta nunca detalha erros internos.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = whatsappClickSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // A service role evita depender da policy pública de INSERT; sem ela, o
  // cliente anônimo é suficiente graças a `whatsapp_clicks_public_insert`.
  const supabase = getServiceSupabase() ?? getPublicSupabase();
  if (!supabase) {
    // Sem Supabase configurado não há onde registrar — o atendimento continua.
    return new NextResponse(null, { status: 204 });
  }

  const click = parsed.data;
  const { error } = await supabase.from("whatsapp_clicks").insert({
    product_id: click.productId ?? null,
    variant_id: click.variantId ?? null,
    store_unit: click.storeUnit,
    source: click.source,
    utm_source: click.utmSource ?? null,
    utm_medium: click.utmMedium ?? null,
    utm_campaign: click.utmCampaign ?? null,
    referrer: click.referrer ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível registrar o clique." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
