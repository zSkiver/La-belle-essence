"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProductSummary } from "@/domain/product";
import { GENDER_LABELS } from "@/domain/enums";
import { formatPrice } from "@/domain/format";
import { normalizeSearchTerm } from "@/domain/catalog";
import { AdminButton, EmptyBlock } from "@/components/admin/admin-ui";
import { Select, TextInput } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  deleteProductAction,
  duplicateProductAction,
  setProductFlagsAction,
} from "@/app/admin/actions";
import { cn } from "@/lib/cn";

type StatusFilter = "todos" | "ativos" | "inativos" | "destaque" | "promocao";
type SortKey = "nome" | "atualizado" | "menor_preco" | "maior_preco";

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: "Todos",
  ativos: "Somente ativos",
  inativos: "Somente inativos",
  destaque: "Somente destaques",
  promocao: "Somente promoções",
};

const SORT_LABELS: Record<SortKey, string> = {
  nome: "Nome (A–Z)",
  atualizado: "Atualizados recentemente",
  menor_preco: "Menor preço",
  maior_preco: "Maior preço",
};

export function ProductsTable({ products }: { products: ProductSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [sort, setSort] = useState<SortKey>("nome");
  const [pendingDelete, setPendingDelete] = useState<ProductSummary | null>(null);

  const rows = useMemo(() => {
    const term = normalizeSearchTerm(query);

    const filtered = products.filter((product) => {
      if (term !== "" && !normalizeSearchTerm(`${product.name} ${product.brand}`).includes(term)) {
        return false;
      }
      if (status === "ativos" && !product.isActive) return false;
      if (status === "inativos" && product.isActive) return false;
      if (status === "destaque" && !product.isFeatured) return false;
      if (status === "promocao" && !product.hasPromotion) return false;
      return true;
    });

    const sorted = [...filtered];
    const byPrice = (a: ProductSummary, b: ProductSummary, direction: 1 | -1) => {
      if (a.lowestPriceCents === null && b.lowestPriceCents === null) return 0;
      if (a.lowestPriceCents === null) return 1;
      if (b.lowestPriceCents === null) return -1;
      return (a.lowestPriceCents - b.lowestPriceCents) * direction;
    };

    switch (sort) {
      case "atualizado":
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "menor_preco":
        sorted.sort((a, b) => byPrice(a, b, 1));
        break;
      case "maior_preco":
        sorted.sort((a, b) => byPrice(a, b, -1));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }

    return sorted;
  }, [products, query, status, sort]);

  const runAction = (action: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível concluir a ação.");
      }
    });
  };

  const handleDuplicate = (product: ProductSummary) => {
    startTransition(async () => {
      const result = await duplicateProductAction(product.id);
      if (result.ok) {
        toast.success("Cópia criada como inativa. Revise antes de publicar.");
        router.push(`/admin/produtos/${result.data.id}/editar`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const confirmDelete = () => {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    runAction(() => deleteProductAction(target.id), "Produto excluído.");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div>
          <label htmlFor="admin-busca" className="sr-only">
            Pesquisar por nome ou marca
          </label>
          <TextInput
            id="admin-busca"
            type="search"
            value={query}
            placeholder="Pesquisar por nome ou marca"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="admin-status" className="sr-only">
            Filtrar por status
          </label>
          <Select
            id="admin-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="admin-ordenacao" className="sr-only">
            Ordenar por
          </label>
          <Select
            id="admin-ordenacao"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyBlock
          title={products.length === 0 ? "Nenhum perfume cadastrado" : "Nenhum resultado"}
          description={
            products.length === 0
              ? "Cadastre o primeiro perfume para que ele apareça no catálogo do site."
              : "Ajuste a busca ou os filtros para encontrar o que procura."
          }
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <caption className="sr-only">Perfumes cadastrados</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="px-4 py-3 font-medium text-ink/60">
                  Perfume
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-ink/60">
                  Gênero
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-ink/60">
                  Preço
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-ink/60">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-ink/60">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden border border-line bg-ink/5">
                        {product.coverImageUrl ? (
                          <Image
                            src={product.coverImageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center font-display text-lg text-ink/30">
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{product.name}</p>
                        <p className="truncate text-xs text-ink/55">
                          {product.brand} · {product.variantCount}{" "}
                          {product.variantCount === 1 ? "volume" : "volumes"} · {product.imageCount}{" "}
                          {product.imageCount === 1 ? "imagem" : "imagens"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-ink/70">
                    {GENDER_LABELS[product.gender]}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-ink/70 tabular-nums">
                    {product.lowestPriceCents === null
                      ? "—"
                      : formatPrice(product.lowestPriceCents)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={cn(
                          "inline-flex border px-2 py-0.5 text-[0.6875rem]",
                          product.isActive
                            ? "border-success/50 text-success"
                            : "border-line text-ink/50",
                        )}
                      >
                        {product.isActive ? "Ativo" : "Inativo"}
                      </span>
                      {product.isFeatured ? (
                        <span className="inline-flex border border-bronze/50 px-2 py-0.5 text-[0.6875rem] text-bronze">
                          Destaque
                        </span>
                      ) : null}
                      {product.hasPromotion ? (
                        <span className="inline-flex border border-rose-deep px-2 py-0.5 text-[0.6875rem] text-rose-deep">
                          Promoção
                        </span>
                      ) : null}
                      {product.variantCount === 0 ? (
                        <span className="inline-flex border border-danger/40 px-2 py-0.5 text-[0.6875rem] text-danger">
                          Sem volume
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <AdminButton
                        as={Link}
                        href={`/admin/produtos/${product.id}/editar`}
                        variant="outline"
                        className="px-3"
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        className="px-3"
                        disabled={isPending}
                        onClick={() =>
                          runAction(
                            () =>
                              setProductFlagsAction({
                                id: product.id,
                                isActive: !product.isActive,
                              }),
                            product.isActive ? "Produto desativado." : "Produto ativado.",
                          )
                        }
                      >
                        {product.isActive ? "Desativar" : "Ativar"}
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        className="px-3"
                        disabled={isPending}
                        onClick={() =>
                          runAction(
                            () =>
                              setProductFlagsAction({
                                id: product.id,
                                isFeatured: !product.isFeatured,
                              }),
                            product.isFeatured
                              ? "Removido dos destaques."
                              : "Marcado como destaque.",
                          )
                        }
                      >
                        {product.isFeatured ? "Tirar destaque" : "Destacar"}
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        className="px-3"
                        disabled={isPending}
                        onClick={() => handleDuplicate(product)}
                      >
                        Duplicar
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        className="px-3"
                        disabled={isPending}
                        onClick={() => setPendingDelete(product)}
                      >
                        Excluir
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Confirmar exclusão"
        placement="center"
        className="sm:max-w-md"
      >
        <div className="bg-white p-6 text-ink">
          <h3 className="font-display text-2xl">Excluir perfume?</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            <strong>{pendingDelete?.name}</strong> sai do site imediatamente. A exclusão é lógica: o
            registro é preservado para que as métricas de WhatsApp já coletadas continuem válidas.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AdminButton variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </AdminButton>
            <AdminButton variant="danger" onClick={confirmDelete}>
              Excluir
            </AdminButton>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
