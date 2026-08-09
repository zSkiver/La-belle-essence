"use client";

import type { Product } from "@/domain/product";
import {
  BADGE_LABELS,
  CONCENTRATION_INTENSITY,
  CONCENTRATION_LABELS,
  CONCENTRATION_SHORT_LABELS,
  GENDER_LABELS,
  INTENSITY_SCALE,
} from "@/domain/enums";
import { formatPrice, formatPriceFrom } from "@/domain/format";
import { bestDiscount } from "@/domain/promotions";
import { hasAvailableVariant, lowestPriceCents, sortVariants, variantLabel } from "@/domain/variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductMedia } from "./product-media";
import { useCatalog } from "./catalog-provider";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { cn } from "@/lib/cn";

/**
 * Barra de intensidade.
 *
 * Derivada da concentração, não medida — por isso o texto acessível diz
 * "estimada" e cita a concentração de onde o valor veio.
 */
export function IntensityMeter({
  product,
  tone = "light",
}: {
  product: Product;
  tone?: "light" | "dark";
}) {
  if (!product.concentration) return null;
  const level = CONCENTRATION_INTENSITY[product.concentration];
  if (level === null) return null;

  const label = `Intensidade estimada pela concentração ${CONCENTRATION_SHORT_LABELS[product.concentration]}: ${level} de ${INTENSITY_SCALE}`;

  return (
    <span className="flex items-center gap-2" role="img" aria-label={label} title={label}>
      <span className="flex items-center gap-1">
        {Array.from({ length: INTENSITY_SCALE }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "h-0.5 w-3.5",
              index < level ? "bg-gold" : tone === "dark" ? "bg-ink-inverse/25" : "bg-line",
            )}
          />
        ))}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "text-[0.5625rem] uppercase tracking-[0.16em]",
          tone === "dark" ? "text-ink-inverse/70" : "text-ink-faint",
        )}
      >
        {CONCENTRATION_SHORT_LABELS[product.concentration]}
      </span>
    </span>
  );
}

/**
 * Card de produto.
 *
 * Estado de repouso: foto de frente, marca, nome, gênero, preço e ações.
 * Estado de hover (só ponteiro fino): a foto troca para a segunda imagem e
 * sobem os detalhes — descrição curta, intensidade e volumes. No toque essa
 * informação aparece abaixo da foto, então nada depende de hover.
 */
export function ProductCard({
  product,
  priority = false,
  size = "default",
}: {
  product: Product;
  priority?: boolean;
  size?: "default" | "large";
}) {
  const { openProduct } = useCatalog();
  const { requestWhatsapp } = useWhatsapp();

  const lowest = lowestPriceCents(product.variants);
  const available = hasAvailableVariant(product.variants);
  const multipleVariants = product.variants.length > 1;
  const discount = bestDiscount(product);
  const volumes = sortVariants(product.variants).map(variantLabel);

  const hoverOverlay = (
    <span className="flex flex-col gap-2.5 text-ink-inverse">
      {product.shortDescription ? (
        <span className="line-clamp-3 text-[0.8125rem] leading-snug text-ink-inverse/90">
          {product.shortDescription}
        </span>
      ) : null}

      <IntensityMeter product={product} tone="dark" />

      {volumes.length > 0 ? (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] tracking-wide text-ink-inverse/80">
          {volumes.map((volume, index) => (
            <span key={volume} className="flex items-center gap-2">
              {index > 0 ? <span className="text-gold">|</span> : null}
              {volume}
            </span>
          ))}
        </span>
      ) : null}

      {product.concentration ? (
        <span className="text-[0.5625rem] uppercase tracking-[0.2em] text-gold">
          {CONCENTRATION_LABELS[product.concentration]}
        </span>
      ) : null}
    </span>
  );

  return (
    <article className="group/card group/promo flex flex-col">
      <div className="sheen relative">
        <button
          type="button"
          onClick={() => openProduct(product)}
          className="block w-full text-left"
          aria-label={`Ver detalhes de ${product.name}, ${product.brand}`}
        >
          <ProductMedia product={product} priority={priority} hoverOverlay={hoverOverlay} />
        </button>

        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
          {discount ? <Badge tone="promo">−{discount.percentOff}%</Badge> : null}
          {product.badge ? <Badge tone="rose">{BADGE_LABELS[product.badge]}</Badge> : null}
        </div>

        {!available ? (
          <span className="pointer-events-none absolute right-2.5 bottom-2.5 z-10 border border-line bg-surface-raised/90 px-2 py-0.5 text-[0.5625rem] uppercase tracking-[0.18em] text-ink-muted">
            Esgotado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <p className="text-[0.5625rem] uppercase tracking-[0.24em] text-gold-deep">
          {product.brand}
        </p>

        <h3
          className={cn(
            "mt-1.5 font-display leading-tight text-ink",
            size === "large" ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          <span className="gold-underline">{product.name}</span>
        </h3>

        <p className="mt-1 text-[0.6875rem] text-ink-faint">
          {GENDER_LABELS[product.gender]}
          {volumes.length > 0 ? ` · ${volumes.join(" · ")}` : null}
        </p>

        {/* Intensidade fica visível no toque, onde não há hover. */}
        <span className="mt-2.5 pointer-fine:hidden">
          <IntensityMeter product={product} />
        </span>

        {lowest !== null ? (
          discount ? (
            <p className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-sm text-rose-deep">{formatPrice(discount.priceCents)}</span>
              <span className="text-[0.6875rem] text-ink-faint line-through">
                {formatPrice(discount.compareAtPriceCents)}
              </span>
            </p>
          ) : (
            <p className="mt-2.5 text-sm text-ink">{formatPriceFrom(lowest, multipleVariants)}</p>
          )
        ) : (
          <p className="mt-2.5 text-sm text-ink-faint">Consulte o valor</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Button variant="quiet" size="sm" className="px-3" onClick={() => openProduct(product)}>
            Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
            disabled={!available}
            onClick={() =>
              requestWhatsapp({
                source: "product_card",
                product: {
                  id: product.id,
                  name: product.name,
                  brand: product.brand,
                  variants: product.variants,
                },
              })
            }
          >
            {available ? "Quero este" : "Indisponível"}
          </Button>
        </div>
      </div>
    </article>
  );
}
