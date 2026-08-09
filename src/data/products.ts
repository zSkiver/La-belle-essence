import "server-only";

import type { Product } from "@/domain/product";
import { sortProducts } from "@/domain/catalog";
import { getPublicSupabase } from "@/lib/supabase/server";
import { PRODUCT_SELECT, mapProduct, type ProductRowWithRelations } from "./mappers";
import { SEED_PRODUCTS } from "./seed-products";

export type CatalogSource = "supabase" | "seed";

export interface CatalogResult {
  products: Product[];
  source: CatalogSource;
  /** Preenchido quando a consulta falhou e o site caiu para os dados locais. */
  error: string | null;
}

/**
 * Catálogo público.
 *
 * Sem Supabase configurado — ou se a consulta falhar — o site continua de pé
 * com os dados de demonstração locais, sinalizados por `source: "seed"`.
 */
export async function getCatalog(): Promise<CatalogResult> {
  const supabase = getPublicSupabase();

  if (!supabase) {
    return { products: sortProducts(SEED_PRODUCTS, "destaque"), source: "seed", error: null };
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return {
      products: sortProducts(SEED_PRODUCTS, "destaque"),
      source: "seed",
      error: "Não foi possível carregar o catálogo agora.",
    };
  }

  const products = (data as ProductRowWithRelations[]).map(mapProduct);
  return { products: sortProducts(products, "destaque"), source: "supabase", error: null };
}

export async function getFeaturedProducts(limit: number): Promise<Product[]> {
  const { products } = await getCatalog();
  return products.filter((product) => product.isFeatured).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((product) => product.slug === slug) ?? null;
}
