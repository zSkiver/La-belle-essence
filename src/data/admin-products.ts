import "server-only";

import type { Product, ProductSummary } from "@/domain/product";
import type { ProductImageInput, ProductPayload } from "@/domain/schemas";
import { lowestPriceCents } from "@/domain/variants";
import { offerStatus, variantDiscount } from "@/domain/promotions";
import { getServerSupabase, type ServerSupabaseClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/env";
import { PRODUCT_SELECT, mapProduct, type ProductRowWithRelations } from "./mappers";

export type AdminAccess =
  | { status: "ok"; supabase: ServerSupabaseClient; email: string }
  | { status: "unconfigured" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email: string };

/**
 * Portão de acesso do painel.
 *
 * Autenticado não basta: o usuário precisa constar em `admin_users`, o que é
 * verificado pela função `is_admin()` no banco — a mesma que sustenta as
 * policies de escrita.
 */
export async function checkAdminAccess(): Promise<AdminAccess> {
  const supabase = await getServerSupabase();
  if (!supabase) return { status: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthenticated" };

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) {
    return { status: "forbidden", email: user.email ?? "" };
  }

  return { status: "ok", supabase, email: user.email ?? "" };
}

/* -------------------------------------------------------------------------- */
/* Leitura                                                                    */
/* -------------------------------------------------------------------------- */

export async function listAdminProducts(supabase: ServerSupabaseClient): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("Não foi possível carregar os produtos.");

  return (data as ProductRowWithRelations[]).map((row) => {
    const product = mapProduct(row);
    const cover = product.images.find((image) => image.isCover) ?? product.images[0];

    const { variants, images, notes, ...rest } = product;
    void notes;

    return {
      ...rest,
      variantCount: variants.length,
      imageCount: images.length,
      lowestPriceCents: lowestPriceCents(variants),
      coverImageUrl: cover?.publicUrl ?? null,
      hasPromotion: variants.some((variant) => variantDiscount(variant) !== null),
      offerStatus: offerStatus(product),
      bestPercentOff: variants.reduce<number | null>((best, variant) => {
        const discount = variantDiscount(variant);
        if (!discount) return best;
        return best === null || discount.percentOff > best ? discount.percentOff : best;
      }, null),
    };
  });
}

export async function getAdminProduct(
  supabase: ServerSupabaseClient,
  id: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapProduct(data as ProductRowWithRelations);
}

export interface DashboardStats {
  total: number;
  active: number;
  unavailable: number;
  featured: number;
  onPromotion: number;
  scheduledOffers: number;
  clicksLast30Days: number;
  recentClicks: Array<{
    id: string;
    createdAt: string;
    storeUnit: string;
    source: string;
    productName: string | null;
  }>;
}

export async function getDashboardStats(supabase: ServerSupabaseClient): Promise<DashboardStats> {
  const products = await listAdminProducts(supabase);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ count: clickCount }, { data: recent }] = await Promise.all([
    supabase
      .from("whatsapp_clicks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("whatsapp_clicks")
      .select("id, created_at, store_unit, source, product_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const nameById = new Map(products.map((product) => [product.id, product.name]));

  return {
    total: products.length,
    active: products.filter((product) => product.isActive).length,
    // "Indisponível" no painel = sem nenhuma variante que possa ser solicitada.
    unavailable: products.filter((product) => product.variantCount === 0).length,
    featured: products.filter((product) => product.isFeatured).length,
    onPromotion: products.filter((product) => product.offerStatus === "ativa").length,
    scheduledOffers: products.filter((product) => product.offerStatus === "agendada").length,
    clicksLast30Days: clickCount ?? 0,
    recentClicks: (recent ?? []).map((click) => ({
      id: click.id,
      createdAt: click.created_at,
      storeUnit: click.store_unit,
      source: click.source,
      productName: click.product_id ? (nameById.get(click.product_id) ?? null) : null,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Escrita                                                                    */
/* -------------------------------------------------------------------------- */

function productColumns(payload: ProductPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    brand: payload.brand,
    short_description: payload.shortDescription,
    description: payload.description,
    gender: payload.gender,
    fragrance_family: payload.fragranceFamily,
    concentration: payload.concentration,
    occasion: payload.occasion,
    badge: payload.badge,
    is_featured: payload.isFeatured,
    is_active: payload.isActive,
    sort_order: payload.sortOrder,
  };
}

/**
 * Sincroniza as variantes.
 *
 * As existentes são atualizadas em vez de recriadas: os cliques de WhatsApp
 * referenciam `variant_id`, e recriar apagaria esse vínculo nas métricas.
 */
async function syncVariants(
  supabase: ServerSupabaseClient,
  productId: string,
  payload: ProductPayload,
) {
  const { data: current } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const keptIds = new Set(
    payload.variants.map((variant) => variant.id).filter((id): id is string => Boolean(id)),
  );

  const removed = (current ?? []).map((row) => row.id).filter((id) => !keptIds.has(id));
  if (removed.length > 0) {
    await supabase.from("product_variants").delete().in("id", removed);
  }

  for (const [index, variant] of payload.variants.entries()) {
    const columns = {
      product_id: productId,
      size_ml: variant.sizeMl,
      label: variant.label,
      price_cents: variant.priceCents,
      compare_at_price_cents: variant.compareAtPriceCents,
      availability_status: variant.availabilityStatus,
      sort_order: index,
    };

    const { error } = variant.id
      ? await supabase.from("product_variants").update(columns).eq("id", variant.id)
      : await supabase.from("product_variants").insert(columns);

    if (error) throw new Error("Não foi possível salvar as variantes de volume.");
  }
}

async function syncNotes(
  supabase: ServerSupabaseClient,
  productId: string,
  payload: ProductPayload,
) {
  const levels = [
    { level: "top" as const, notes: payload.notes.top, sortOrder: 0 },
    { level: "heart" as const, notes: payload.notes.heart, sortOrder: 1 },
    { level: "base" as const, notes: payload.notes.base, sortOrder: 2 },
  ];

  for (const entry of levels) {
    if (entry.notes.length === 0) {
      await supabase
        .from("olfactory_notes")
        .delete()
        .eq("product_id", productId)
        .eq("level", entry.level);
      continue;
    }

    const { error } = await supabase
      .from("olfactory_notes")
      .upsert(
        {
          product_id: productId,
          level: entry.level,
          notes: entry.notes,
          sort_order: entry.sortOrder,
        },
        { onConflict: "product_id,level" },
      );

    if (error) throw new Error("Não foi possível salvar a pirâmide olfativa.");
  }
}

/**
 * Sincroniza as imagens e remove do Storage os arquivos que deixaram de ser
 * usados, para não acumular objetos órfãos.
 */
async function syncImages(
  supabase: ServerSupabaseClient,
  productId: string,
  images: ProductImageInput[],
) {
  const { data: current } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId);

  const keptIds = new Set(images.map((image) => image.id).filter((id): id is string => Boolean(id)));

  const removed = (current ?? []).filter((row) => !keptIds.has(row.id));
  if (removed.length > 0) {
    await supabase
      .from("product_images")
      .delete()
      .in(
        "id",
        removed.map((row) => row.id),
      );
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(removed.map((row) => row.storage_path));
  }

  // A capa é definida em duas etapas por causa do índice único parcial:
  // primeiro tudo vira "não capa", depois a escolhida é marcada.
  for (const [index, image] of images.entries()) {
    const columns = {
      product_id: productId,
      storage_path: image.storagePath,
      public_url: image.publicUrl,
      alt_text: image.altText,
      is_cover: false,
      sort_order: index,
    };

    const { error } = image.id
      ? await supabase.from("product_images").update(columns).eq("id", image.id)
      : await supabase.from("product_images").insert(columns);

    if (error) throw new Error("Não foi possível salvar as imagens.");
  }

  const cover = images.find((image) => image.isCover) ?? images[0];
  if (cover) {
    await supabase
      .from("product_images")
      .update({ is_cover: true })
      .eq("product_id", productId)
      .eq("storage_path", cover.storagePath);
  }
}

export async function saveProduct(
  supabase: ServerSupabaseClient,
  options: { id: string; isNew: boolean; payload: ProductPayload; images: ProductImageInput[] },
): Promise<void> {
  const { id, isNew, payload, images } = options;

  if (isNew) {
    const { error } = await supabase.from("products").insert({ id, ...productColumns(payload) });
    if (error) {
      throw new Error(
        error.code === "23505"
          ? "Já existe um produto com este slug. Escolha outro."
          : "Não foi possível criar o produto.",
      );
    }
  } else {
    const { error } = await supabase.from("products").update(productColumns(payload)).eq("id", id);
    if (error) {
      throw new Error(
        error.code === "23505"
          ? "Já existe um produto com este slug. Escolha outro."
          : "Não foi possível salvar o produto.",
      );
    }
  }

  await syncVariants(supabase, id, payload);
  await syncNotes(supabase, id, payload);
  await syncImages(supabase, id, images);
}

/**
 * Define destaque e janela de oferta em uma única escrita — é o que a aba de
 * destaques e ofertas manipula.
 */
export async function setOfferWindow(
  supabase: ServerSupabaseClient,
  input: { id: string; isFeatured?: boolean; offerStartsAt: string | null; offerEndsAt: string | null },
): Promise<void> {
  const columns: {
    offer_starts_at: string | null;
    offer_ends_at: string | null;
    is_featured?: boolean;
  } = {
    offer_starts_at: input.offerStartsAt,
    offer_ends_at: input.offerEndsAt,
  };

  if (input.isFeatured !== undefined) columns.is_featured = input.isFeatured;

  const { error } = await supabase.from("products").update(columns).eq("id", input.id);
  if (error) throw new Error("Não foi possível salvar a oferta.");
}

export async function setProductFlags(
  supabase: ServerSupabaseClient,
  id: string,
  flags: { isActive?: boolean; isFeatured?: boolean },
): Promise<void> {
  const columns: { is_active?: boolean; is_featured?: boolean } = {};
  if (flags.isActive !== undefined) columns.is_active = flags.isActive;
  if (flags.isFeatured !== undefined) columns.is_featured = flags.isFeatured;

  const { error } = await supabase.from("products").update(columns).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar o produto.");
}

/** Exclusão lógica: o produto sai do site, mas as métricas continuam válidas. */
export async function softDeleteProduct(
  supabase: ServerSupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false, is_featured: false })
    .eq("id", id);

  if (error) throw new Error("Não foi possível excluir o produto.");
}

export async function duplicateProduct(
  supabase: ServerSupabaseClient,
  id: string,
): Promise<string> {
  const original = await getAdminProduct(supabase, id);
  if (!original) throw new Error("Produto não encontrado.");

  const suffix = Date.now().toString(36).slice(-4);
  const newId = crypto.randomUUID();

  const { error } = await supabase.from("products").insert({
    id: newId,
    name: `${original.name} (cópia)`,
    slug: `${original.slug}-copia-${suffix}`.slice(0, 80),
    brand: original.brand,
    short_description: original.shortDescription,
    description: original.description,
    gender: original.gender,
    fragrance_family: original.fragranceFamily,
    concentration: original.concentration,
    occasion: original.occasion,
    badge: original.badge,
    // A cópia nasce inativa e sem destaque, para ser revisada antes de publicar.
    is_featured: false,
    is_active: false,
    sort_order: original.sortOrder,
    // A cópia não herda a janela de oferta: cada oferta é decidida na aba
    // de destaques, com data própria.
    offer_starts_at: null,
    offer_ends_at: null,
  });

  if (error) throw new Error("Não foi possível duplicar o produto.");

  if (original.variants.length > 0) {
    await supabase.from("product_variants").insert(
      original.variants.map((variant, index) => ({
        product_id: newId,
        size_ml: variant.sizeMl,
        label: variant.label,
        price_cents: variant.priceCents,
        compare_at_price_cents: variant.compareAtPriceCents,
        availability_status: variant.availabilityStatus,
        sort_order: index,
      })),
    );
  }

  for (const note of original.notes) {
    await supabase.from("olfactory_notes").insert({
      product_id: newId,
      level: note.level,
      notes: note.notes,
      sort_order: note.sortOrder,
    });
  }

  // As imagens não são copiadas: os arquivos no Storage continuam pertencendo
  // ao produto original e seriam removidos junto com ele.

  return newId;
}
