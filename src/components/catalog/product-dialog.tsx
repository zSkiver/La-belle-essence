"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Product } from "@/domain/product";
import {
  AVAILABILITY_LABELS,
  CONCENTRATION_SHORT_LABELS,
  FRAGRANCE_FAMILY_LABELS,
  GENDER_LABELS,
  NOTE_LEVEL_LABELS,
  isPurchasable,
} from "@/domain/enums";
import { formatPrice } from "@/domain/format";
import { defaultVariant, findVariant, orderedImages, sortVariants, variantLabel } from "@/domain/variants";
import { variantDiscount } from "@/domain/promotions";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsappGlyph } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { ProductMedia } from "./product-media";
import { IntensityMeter } from "./product-card";
import { useCatalog } from "./catalog-provider";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/cn";

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-ink-faint">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.8125rem] text-ink">{value}</dd>
    </div>
  );
}

/** Galeria compacta: uma imagem em pé e miniaturas pequenas embaixo. */
function Gallery({ product }: { product: Product }) {
  const images = orderedImages(product);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <ProductMedia
        product={product}
        enableHoverSwap={false}
        sizes="(max-width: 768px) 40vw, 22vw"
      />
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-sunken">
        {active ? (
          <Image
            src={active.publicUrl}
            alt={active.altText ?? `${product.name}, ${product.brand}`}
            fill
            sizes="(max-width: 768px) 40vw, 22vw"
            className="object-cover"
          />
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-current={index === activeIndex}
                className={cn(
                  "relative size-11 shrink-0 overflow-hidden border transition-colors",
                  index === activeIndex
                    ? "border-gold-deep"
                    : "border-line hover:border-line-strong",
                )}
              >
                <Image src={image.publicUrl} alt="" fill sizes="44px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Corpo do modal.
 *
 * Montado com `key={product.id}`, então trocar de produto reinicia a variante
 * escolhida e a imagem ativa sem efeitos de sincronização.
 *
 * Cabeçalho e rodapé ficam fixos; só a coluna do meio rola. Assim o preço e o
 * botão de WhatsApp continuam sempre à vista e o diálogo não estica de uma
 * ponta à outra da tela.
 */
function ProductDialogBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const { requestWhatsapp } = useWhatsapp();
  const toast = useToast();

  const variants = useMemo(() => sortVariants(product.variants), [product.variants]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => defaultVariant(product.variants)?.id ?? null,
  );

  const selectedVariant = selectedVariantId ? findVariant(variants, selectedVariantId) : null;
  const selectedDiscount = selectedVariant ? variantDiscount(selectedVariant) : null;
  const canRequest = selectedVariant !== null && isPurchasable(selectedVariant.availabilityStatus);

  const notesByLevel = useMemo(
    () =>
      (["top", "heart", "base"] as const)
        .map((level) => ({
          level,
          notes: product.notes.find((entry) => entry.level === level)?.notes ?? [],
        }))
        .filter((entry) => entry.notes.length > 0),
    [product.notes],
  );

  const handleShare = async () => {
    const url = `${siteConfig.url}/?produto=${product.slug}`;
    const shareData = {
      title: `${product.name} — ${product.brand}`,
      text: product.shortDescription ?? undefined,
      url,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Compartilhamento cancelado ou indisponível — caímos para a cópia.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link do perfume copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  return (
    <>
      {/* Cabeçalho fixo */}
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[0.5625rem] uppercase tracking-[0.24em] text-gold-deep">
            {product.brand}
          </p>
          <h3 className="mt-0.5 truncate font-display text-xl leading-tight text-ink sm:text-2xl">
            {product.name}
          </h3>
        </div>
        <DialogCloseButton onClose={onClose} label="Fechar detalhes do perfume" />
      </header>

      {/* Conteúdo rolável */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] sm:gap-6">
          <Gallery product={product} />

          <div className="flex min-w-0 flex-col gap-4">
            {/* Preço em primeiro lugar: é a informação mais buscada ao abrir. */}
            {selectedVariant ? (
              <div
                key={selectedVariant.id}
                className="price-swap border-b border-line pb-4"
              >
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <p
                    className={cn(
                      "font-display text-4xl leading-none sm:text-5xl",
                      selectedDiscount ? "text-rose-deep" : "text-ink",
                    )}
                  >
                    {formatPrice(selectedVariant.priceCents)}
                  </p>
                  {selectedVariant.compareAtPriceCents ? (
                    <p className="text-base text-ink-faint line-through">
                      {formatPrice(selectedVariant.compareAtPriceCents)}
                    </p>
                  ) : null}
                  {selectedDiscount ? (
                    <Badge tone="promo">−{selectedDiscount.percentOff}%</Badge>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs text-ink-muted">
                    {variantLabel(selectedVariant)}
                  </span>
                  <span
                    className={cn(
                      "text-[0.625rem] uppercase tracking-[0.16em]",
                      isPurchasable(selectedVariant.availabilityStatus)
                        ? "text-ink-faint"
                        : "text-danger",
                    )}
                  >
                    {AVAILABILITY_LABELS[selectedVariant.availabilityStatus]}
                  </span>
                  {selectedDiscount ? (
                    <span className="text-xs text-rose-deep">
                      Economia de {formatPrice(selectedDiscount.savedCents)}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="border-b border-line pb-4 text-lg text-ink-faint">
                Consulte o valor
              </p>
            )}

            {product.shortDescription ? (
              <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
                {product.shortDescription}
              </p>
            ) : null}

            <IntensityMeter product={product} />

            {variants.length > 0 ? (
              <fieldset>
                <legend className="eyebrow mb-2">
                  {variants.length > 1 ? "Escolha o volume" : "Volume"}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {variants.map((variant) => {
                    const purchasable = isPurchasable(variant.availabilityStatus);
                    const checked = variant.id === selectedVariantId;
                    const discount = variantDiscount(variant);
                    return (
                      <label
                        key={variant.id}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-1.5 border px-3 py-2 text-[0.8125rem] transition-colors",
                          checked
                            ? "border-gold-deep bg-gold-tint text-ink"
                            : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                          !purchasable && "cursor-not-allowed opacity-45",
                        )}
                      >
                        <input
                          type="radio"
                          name="product-variant"
                          className="sr-only"
                          value={variant.id}
                          checked={checked}
                          disabled={!purchasable}
                          onChange={() => setSelectedVariantId(variant.id)}
                        />
                        {variantLabel(variant)}
                        {discount ? (
                          <span className="text-[0.5625rem] font-medium text-rose-deep">
                            −{discount.percentOff}%
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4">
              <Attribute label="Gênero" value={GENDER_LABELS[product.gender]} />
              {product.concentration ? (
                <Attribute
                  label="Concentração"
                  value={CONCENTRATION_SHORT_LABELS[product.concentration]}
                />
              ) : null}
              {product.fragranceFamily ? (
                <Attribute
                  label="Família"
                  value={FRAGRANCE_FAMILY_LABELS[product.fragranceFamily]}
                />
              ) : null}
              {product.occasion ? <Attribute label="Ocasião" value={product.occasion} /> : null}
            </dl>

            {notesByLevel.length > 0 ? (
              <div className="border-t border-line pt-4">
                <h4 className="eyebrow">Pirâmide olfativa</h4>
                <dl className="mt-2.5 flex flex-col gap-2">
                  {notesByLevel.map(({ level, notes }) => (
                    <div key={level} className="grid gap-0.5 sm:grid-cols-[7rem_1fr] sm:gap-3">
                      <dt className="text-[0.5625rem] uppercase tracking-[0.16em] text-ink-faint">
                        {NOTE_LEVEL_LABELS[level]}
                      </dt>
                      <dd className="text-[0.8125rem] text-ink-muted">{notes.join(" · ")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {product.description ? (
              <div className="border-t border-line pt-4">
                <h4 className="eyebrow">Sobre a fragrância</h4>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
                  {product.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Rodapé fixo: preço e ação sempre à vista */}
      <footer className="border-t border-line bg-surface px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {selectedVariant ? (
            <p key={selectedVariant.id} className="price-swap text-sm text-ink-muted">
              <span className="font-display text-2xl text-ink">
                {formatPrice(selectedVariant.priceCents)}
              </span>{" "}
              · {variantLabel(selectedVariant)}
            </p>
          ) : (
            <p className="text-sm text-ink-faint">Consulte o valor</p>
          )}

          <div className="flex flex-1 gap-2 sm:flex-none">
            <Button variant="outline" size="sm" className="px-3" onClick={handleShare}>
              Compartilhar
            </Button>
            <Button
              variant="whatsapp"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={!canRequest}
              onClick={() =>
                requestWhatsapp({
                  source: "product_modal",
                  variantId: selectedVariantId,
                  product: {
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    variants: product.variants,
                  },
                })
              }
            >
              <WhatsappGlyph width={15} height={15} />
              {canRequest ? "Reservar" : "Indisponível"}
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-[0.625rem] text-ink-faint">
          A reserva é confirmada pela loja no atendimento.
        </p>
      </footer>
    </>
  );
}

export function ProductDialog() {
  const { selectedProduct, closeProduct } = useCatalog();

  return (
    <Dialog
      open={selectedProduct !== null}
      onClose={closeProduct}
      title={
        selectedProduct
          ? `${selectedProduct.name} — ${selectedProduct.brand}`
          : "Detalhes do perfume"
      }
      placement="center"
      className="sm:max-w-3xl"
    >
      {selectedProduct ? (
        <ProductDialogBody
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={closeProduct}
        />
      ) : null}
    </Dialog>
  );
}
