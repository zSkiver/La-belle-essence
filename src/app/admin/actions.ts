"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { offerWindowSchema, productImageInputSchema, productInputSchema } from "@/domain/schemas";
import { checkAdminAccess } from "@/data/admin-products";
import {
  duplicateProduct,
  saveProduct,
  setOfferWindow,
  setProductFlags,
  softDeleteProduct,
} from "@/data/admin-products";
import { getServerSupabase } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const ACCESS_MESSAGES: Record<string, string> = {
  unconfigured: "Supabase não configurado. Preencha as variáveis de ambiente.",
  unauthenticated: "Sessão expirada. Entre novamente.",
  forbidden: "Sua conta não tem permissão de administrador.",
};

/** Revalida o site público e as telas do painel afetadas por uma alteração. */
function revalidateProductSurfaces() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/destaques");
}

const saveProductSchema = z.object({
  id: z.uuid(),
  isNew: z.boolean(),
  payload: productInputSchema,
  images: z.array(productImageInputSchema).max(12, "Máximo de 12 imagens por produto."),
});

export async function saveProductAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const access = await checkAdminAccess();
  if (access.status !== "ok") {
    return { ok: false, error: ACCESS_MESSAGES[access.status] ?? "Acesso negado." };
  }

  const parsed = saveProductSchema.safeParse(input);
  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await saveProduct(access.supabase, parsed.data);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar o produto.",
    };
  }

  revalidateProductSurfaces();
  return { ok: true, data: { id: parsed.data.id } };
}

const flagsSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function setProductFlagsAction(input: unknown): Promise<ActionResult> {
  const access = await checkAdminAccess();
  if (access.status !== "ok") {
    return { ok: false, error: ACCESS_MESSAGES[access.status] ?? "Acesso negado." };
  }

  const parsed = flagsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Requisição inválida." };

  try {
    const { id, ...flags } = parsed.data;
    await setProductFlags(access.supabase, id, flags);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível atualizar o produto.",
    };
  }

  revalidateProductSurfaces();
  return { ok: true, data: undefined };
}

/**
 * Destaque e janela de oferta — a escrita da aba de destaques e ofertas.
 * As datas chegam em ISO (UTC); o formulário converte do horário local antes
 * de enviar.
 */
export async function setOfferWindowAction(input: unknown): Promise<ActionResult> {
  const access = await checkAdminAccess();
  if (access.status !== "ok") {
    return { ok: false, error: ACCESS_MESSAGES[access.status] ?? "Acesso negado." };
  }

  const parsed = offerWindowSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    await setOfferWindow(access.supabase, parsed.data);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar a oferta.",
    };
  }

  revalidateProductSurfaces();
  return { ok: true, data: undefined };
}

export async function deleteProductAction(id: unknown): Promise<ActionResult> {
  const access = await checkAdminAccess();
  if (access.status !== "ok") {
    return { ok: false, error: ACCESS_MESSAGES[access.status] ?? "Acesso negado." };
  }

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Requisição inválida." };

  try {
    await softDeleteProduct(access.supabase, parsed.data);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível excluir o produto.",
    };
  }

  revalidateProductSurfaces();
  return { ok: true, data: undefined };
}

export async function duplicateProductAction(id: unknown): Promise<ActionResult<{ id: string }>> {
  const access = await checkAdminAccess();
  if (access.status !== "ok") {
    return { ok: false, error: ACCESS_MESSAGES[access.status] ?? "Acesso negado." };
  }

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Requisição inválida." };

  try {
    const newId = await duplicateProduct(access.supabase, parsed.data);
    revalidateProductSurfaces();
    return { ok: true, data: { id: newId } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível duplicar o produto.",
    };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
