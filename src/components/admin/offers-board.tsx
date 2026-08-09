"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProductSummary } from "@/domain/product";
import { OFFER_STATUS_LABELS, type OfferStatus } from "@/domain/promotions";
import { formatDateTime, formatPrice } from "@/domain/format";
import { AdminButton, AdminCard, EmptyBlock } from "./admin-ui";
import { Field, TextInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { setOfferWindowAction, setProductFlagsAction } from "@/app/admin/actions";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Conversão entre o input datetime-local e o instante guardado (ISO/UTC)     */
/* -------------------------------------------------------------------------- */

/** ISO → "AAAA-MM-DDTHH:MM" no fuso do navegador, que é o da loja. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** "AAAA-MM-DDTHH:MM" no fuso do navegador → ISO. */
function fromLocalInput(value: string): string | null {
  if (value.trim() === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const STATUS_TONES: Record<OfferStatus, string> = {
  ativa: "border-success text-success",
  agendada: "border-bronze text-bronze",
  encerrada: "border-espresso/25 text-ink-faint",
  sem_oferta: "border-line text-ink-faint",
};

/** Atalhos de prazo — o caso mais comum é "termina em X". */
const PRESETS = [
  { label: "24 horas", hours: 24 },
  { label: "3 dias", hours: 72 },
  { label: "7 dias", hours: 168 },
] as const;

function OfferRow({ product }: { product: ProductSummary }) {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, startSaving] = useTransition();

  const [startsAt, setStartsAt] = useState(() => toLocalInput(product.offerStartsAt));
  const [endsAt, setEndsAt] = useState(() => toLocalInput(product.offerEndsAt));

  const dirty =
    startsAt !== toLocalInput(product.offerStartsAt) || endsAt !== toLocalInput(product.offerEndsAt);

  const save = (nextStart: string, nextEnd: string) => {
    startSaving(async () => {
      const result = await setOfferWindowAction({
        id: product.id,
        offerStartsAt: fromLocalInput(nextStart),
        offerEndsAt: fromLocalInput(nextEnd),
      });

      if (result.ok) {
        toast.success("Oferta atualizada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const applyPreset = (hours: number) => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 3_600_000);
    const nextStart = "";
    const nextEnd = toLocalInput(end.toISOString());
    setStartsAt(nextStart);
    setEndsAt(nextEnd);
    save(nextStart, nextEnd);
  };

  const clearWindow = () => {
    setStartsAt("");
    setEndsAt("");
    save("", "");
  };

  const toggleFeatured = () => {
    startSaving(async () => {
      const result = await setProductFlagsAction({
        id: product.id,
        isFeatured: !product.isFeatured,
      });
      if (result.ok) {
        toast.success(product.isFeatured ? "Removido dos destaques." : "Marcado como destaque.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <li className="border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* Identificação */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden border border-line bg-surface-sunken">
            {product.coverImageUrl ? (
              <Image src={product.coverImageUrl} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-lg text-ink-faint">
                {product.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{product.name}</p>
            <p className="truncate text-xs text-ink-faint">
              {product.brand}
              {product.lowestPriceCents !== null
                ? ` · a partir de ${formatPrice(product.lowestPriceCents)}`
                : null}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "inline-flex border px-2 py-0.5 text-[0.6875rem]",
                  STATUS_TONES[product.offerStatus],
                )}
              >
                {OFFER_STATUS_LABELS[product.offerStatus]}
                {product.bestPercentOff !== null ? ` · ${product.bestPercentOff}%` : null}
              </span>
              {product.isFeatured ? (
                <span className="inline-flex border border-bronze px-2 py-0.5 text-[0.6875rem] text-bronze">
                  Em destaque
                </span>
              ) : null}
              {!product.isActive ? (
                <span className="inline-flex border border-danger/50 px-2 py-0.5 text-[0.6875rem] text-danger">
                  Inativo
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 lg:w-[30rem] lg:shrink-0">
          {product.bestPercentOff === null ? (
            <p className="border border-dashed border-line px-3 py-2 text-xs leading-relaxed text-ink-muted">
              Este perfume não tem preço promocional. Defina o{" "}
              <strong>preço anterior</strong> em algum volume para que a oferta exista.{" "}
              <Link
                href={`/admin/produtos/${product.id}/editar`}
                className="underline underline-offset-2"
              >
                Editar preços
              </Link>
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                  Termina em
                </span>
                {PRESETS.map((preset) => (
                  <AdminButton
                    key={preset.label}
                    variant="outline"
                    className="px-2.5 text-xs"
                    disabled={isSaving}
                    onClick={() => applyPreset(preset.hours)}
                  >
                    {preset.label}
                  </AdminButton>
                ))}
                <AdminButton
                  variant="ghost"
                  className="px-2.5 text-xs"
                  disabled={isSaving}
                  onClick={clearWindow}
                >
                  Sem prazo
                </AdminButton>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Começa em" hint="Vazio = já vale">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                    />
                  )}
                </Field>
                <Field label="Termina em" hint="Vazio = sem prazo">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      type="datetime-local"
                      value={endsAt}
                      onChange={(event) => setEndsAt(event.target.value)}
                    />
                  )}
                </Field>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <AdminButton
              variant={product.isFeatured ? "outline" : "solid"}
              className="px-3 text-xs"
              disabled={isSaving}
              onClick={toggleFeatured}
            >
              {product.isFeatured ? "Tirar do destaque" : "Destacar na home"}
            </AdminButton>

            {product.bestPercentOff !== null ? (
              <AdminButton
                className="px-3 text-xs"
                disabled={isSaving || !dirty}
                onClick={() => save(startsAt, endsAt)}
              >
                {isSaving ? "Salvando…" : dirty ? "Salvar datas" : "Datas salvas"}
              </AdminButton>
            ) : null}
          </div>

          {product.offerEndsAt ? (
            <p className="text-[0.6875rem] text-ink-faint">
              Encerra em {formatDateTime(product.offerEndsAt)}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

type Tab = "ofertas" | "destaques" | "todos";

const TAB_LABELS: Record<Tab, string> = {
  ofertas: "Com preço promocional",
  destaques: "Em destaque",
  todos: "Todos os produtos",
};

/**
 * Aba de destaques e ofertas.
 *
 * Reúne as duas decisões de vitrine que antes estavam espalhadas: o que
 * aparece na home e o que está em promoção, com prazo. Nada aqui cria
 * desconto — o desconto nasce do preço anterior, no cadastro do produto.
 * Esta tela só decide **quando** ele vale e **o que** ganha destaque.
 */
export function OffersBoard({ products }: { products: ProductSummary[] }) {
  const [tab, setTab] = useState<Tab>("ofertas");

  const counts = useMemo(
    () => ({
      ofertas: products.filter((product) => product.bestPercentOff !== null).length,
      destaques: products.filter((product) => product.isFeatured).length,
      todos: products.length,
    }),
    [products],
  );

  const rows = useMemo(() => {
    const base =
      tab === "ofertas"
        ? products.filter((product) => product.bestPercentOff !== null)
        : tab === "destaques"
          ? products.filter((product) => product.isFeatured)
          : products;

    // Ativas primeiro, depois agendadas, encerradas e o resto.
    const rank: Record<OfferStatus, number> = {
      ativa: 0,
      agendada: 1,
      encerrada: 2,
      sem_oferta: 3,
    };

    return [...base].sort(
      (a, b) =>
        rank[a.offerStatus] - rank[b.offerStatus] ||
        (b.bestPercentOff ?? 0) - (a.bestPercentOff ?? 0) ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [products, tab]);

  return (
    <div className="flex flex-col gap-5">
      <AdminCard>
        <p className="text-sm leading-relaxed text-ink-muted">
          O desconto nasce do <strong className="text-ink">preço anterior</strong> cadastrado em
          cada volume. Aqui você decide <strong className="text-ink">quando</strong> essa oferta
          vale e <strong className="text-ink">quais</strong> perfumes aparecem na vitrine da home.
          Fora da janela, a promoção some do site sozinha.
        </p>
      </AdminCard>

      <div role="tablist" aria-label="Filtrar produtos" className="flex flex-wrap gap-1.5">
        {(Object.keys(TAB_LABELS) as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors",
              tab === value
                ? "border-ink bg-ink text-ink-inverse"
                : "border-line text-ink-muted hover:border-espresso/40 hover:text-ink",
            )}
          >
            {TAB_LABELS[value]}
            <span
              className={cn(
                "text-xs tabular-nums",
                tab === value ? "text-ink-inverse/70" : "text-ink-faint",
              )}
            >
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyBlock
          title={tab === "ofertas" ? "Nenhum preço promocional" : "Nada por aqui"}
          description={
            tab === "ofertas"
              ? "Edite um perfume e preencha o preço anterior em algum volume para criar uma oferta."
              : "Marque perfumes como destaque para que apareçam na vitrine da página inicial."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((product) => (
            <OfferRow key={product.id} product={product} />
          ))}
        </ul>
      )}
    </div>
  );
}
