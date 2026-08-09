"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductVariant } from "@/domain/product";
import type { ClickSource } from "@/domain/enums";
import { AVAILABILITY_LABELS, isPurchasable } from "@/domain/enums";
import { formatPrice } from "@/domain/format";
import { buildWhatsappUrl } from "@/domain/whatsapp";
import { defaultVariant, findVariant, sortVariants, variantLabel } from "@/domain/variants";
import { getUnit, siteConfig, type StoreUnitId } from "@/lib/site-config";
import { getUtmParams, trackEvent } from "@/lib/analytics";
import { readPreferredUnit, savePreferredUnit } from "@/lib/unit-preference";
import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface WhatsappProductContext {
  id: string;
  name: string;
  brand: string;
  variants: ProductVariant[];
}

export interface WhatsappRequest {
  source: ClickSource;
  product?: WhatsappProductContext | null;
  /** Variante já escolhida (por exemplo, no modal do produto). */
  variantId?: string | null;
}

interface WhatsappApi {
  requestWhatsapp: (request: WhatsappRequest) => void;
}

const WhatsappContext = createContext<WhatsappApi | null>(null);

async function recordClick(payload: {
  productId: string | null;
  variantId: string | null;
  storeUnit: StoreUnitId;
  source: ClickSource;
}) {
  const utm = getUtmParams();
  const body = JSON.stringify({
    ...payload,
    ...utm,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
  });

  try {
    await fetch("/api/whatsapp-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // O registro é uma métrica, não um bloqueio: se falhar, o atendimento segue.
  }
}

export function WhatsappProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<WhatsappRequest | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<StoreUnitId>("buriti");

  const requestWhatsapp = useCallback((next: WhatsappRequest) => {
    const variants = next.product ? sortVariants(next.product.variants) : [];
    const initial =
      (next.variantId ? findVariant(variants, next.variantId)?.id : null) ??
      defaultVariant(variants)?.id ??
      null;

    // A preferência salva é lida na abertura, e não na montagem: evita tocar no
    // localStorage durante a hidratação e mantém o valor sempre atualizado.
    const preferred = readPreferredUnit();
    if (preferred) setSelectedUnit(preferred);

    setSelectedVariantId(initial);
    setRequest(next);
  }, []);

  const close = useCallback(() => setRequest(null), []);

  const api = useMemo<WhatsappApi>(() => ({ requestWhatsapp }), [requestWhatsapp]);

  const variants = useMemo(
    () => (request?.product ? sortVariants(request.product.variants) : []),
    [request],
  );

  const selectedVariant = useMemo(
    () => (selectedVariantId ? findVariant(variants, selectedVariantId) : null),
    [variants, selectedVariantId],
  );

  const needsVariantChoice = variants.length > 1;
  const variantUnavailable = selectedVariant !== null && !isPurchasable(selectedVariant.availabilityStatus);
  const canConfirm = variants.length === 0 || (selectedVariant !== null && !variantUnavailable);

  const handleConfirm = useCallback(() => {
    if (!request) return;

    const unit = getUnit(selectedUnit);
    const url = buildWhatsappUrl({
      unit,
      product: request.product ? { name: request.product.name, brand: request.product.brand } : null,
      variant: selectedVariant
        ? { label: variantLabel(selectedVariant), priceCents: selectedVariant.priceCents }
        : null,
    });

    savePreferredUnit(selectedUnit);

    // Abrir a janela precisa acontecer dentro do gesto do usuário, antes de
    // qualquer espera — por isso o registro do clique não é aguardado.
    window.open(url, "_blank", "noopener,noreferrer");

    trackEvent("whatsapp_click", {
      source: request.source,
      store_unit: selectedUnit,
      product_id: request.product?.id ?? null,
      product_name: request.product?.name ?? null,
      variant_id: selectedVariant?.id ?? null,
    });

    void recordClick({
      productId: request.product?.id ?? null,
      variantId: selectedVariant?.id ?? null,
      storeUnit: selectedUnit,
      source: request.source,
    });

    close();
  }, [request, selectedUnit, selectedVariant, close]);

  return (
    <WhatsappContext.Provider value={api}>
      {children}

      <Dialog
        open={request !== null}
        onClose={close}
        title="Escolher volume e unidade de atendimento"
        placement="bottom"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
          <div>
            <p className="eyebrow">Atendimento</p>
            <p className="mt-1 font-display text-2xl leading-tight text-ink">
              {request?.product ? request.product.name : "Falar com uma consultora"}
            </p>
            {request?.product ? (
              <p className="text-sm text-ink-muted">{request.product.brand}</p>
            ) : null}
          </div>
          <DialogCloseButton onClose={close} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {needsVariantChoice ? (
            <fieldset className="mb-8">
              <legend className="eyebrow mb-3">Escolha o volume</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {variants.map((variant) => {
                  const available = isPurchasable(variant.availabilityStatus);
                  const checked = variant.id === selectedVariantId;
                  return (
                    <label
                      key={variant.id}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center justify-between gap-3 border px-4 py-3 transition-colors",
                        checked ? "border-gold-deep bg-gold-tint" : "border-line hover:border-line-strong",
                        !available && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="whatsapp-variant"
                          value={variant.id}
                          checked={checked}
                          disabled={!available}
                          onChange={() => setSelectedVariantId(variant.id)}
                          className="size-4 accent-gold-deep"
                        />
                        <span className="text-sm text-ink">{variantLabel(variant)}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm text-ink">
                          {formatPrice(variant.priceCents)}
                        </span>
                        {!available ? (
                          <span className="block text-[0.6875rem] uppercase tracking-wider text-ink-muted">
                            {AVAILABILITY_LABELS[variant.availabilityStatus]}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <fieldset>
            <legend className="eyebrow mb-3">Unidade de atendimento</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {siteConfig.units.map((unit) => {
                const checked = unit.id === selectedUnit;
                return (
                  <label
                    key={unit.id}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-start gap-3 border px-4 py-3 transition-colors",
                      checked ? "border-gold-deep bg-gold-tint" : "border-line hover:border-line-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="whatsapp-unit"
                      value={unit.id}
                      checked={checked}
                      onChange={() => setSelectedUnit(unit.id)}
                      className="mt-1 size-4 accent-gold-deep"
                    />
                    <span>
                      <span className="block text-sm text-ink">{unit.name}</span>
                      <span className="block text-xs text-ink-muted">{unit.whatsappDisplay}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {variantUnavailable ? (
            <p className="mt-6 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
              Esta versão está marcada como esgotada. Escolha outro volume ou fale com a
              consultora sobre alternativas.
            </p>
          ) : null}
        </div>

        <div className="border-t border-line px-5 py-4 sm:px-7">
          <Button
            type="button"
            variant="whatsapp"
            size="lg"
            className="w-full"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Abrir conversa no WhatsApp
          </Button>
          <p className="mt-3 text-center text-xs text-ink-faint">
            A mensagem já vai preenchida. A disponibilidade é confirmada pela loja no
            atendimento.
          </p>
        </div>
      </Dialog>
    </WhatsappContext.Provider>
  );
}

export function useWhatsapp(): WhatsappApi {
  const context = useContext(WhatsappContext);
  if (!context) {
    throw new Error("useWhatsapp precisa estar dentro de <WhatsappProvider>.");
  }
  return context;
}
