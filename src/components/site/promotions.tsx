"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/domain/product";
import { BADGE_LABELS, GENDER_LABELS } from "@/domain/enums";
import { formatPrice } from "@/domain/format";
import { bestDiscount, formatTimeRemaining, offerTimeRemaining } from "@/domain/promotions";
import { variantLabel } from "@/domain/variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ArrowGlyph, WhatsappGlyph } from "@/components/icons";
import { ProductMedia } from "@/components/catalog/product-media";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { cn } from "@/lib/cn";

/** Quantos perfumes a vitrine mostra antes de mandar o resto para o catálogo. */
const SHOWCASE_LIMIT = 12;

/** Tempo que cada oferta fica em cena antes de a próxima entrar. */
const ROTATION_MS = 6000;

function Countdown({ product, now }: { product: Product; now: Date }) {
  const remaining = offerTimeRemaining(product, now);
  if (remaining === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 border border-rose-deep/40 bg-rose-tint/60 px-2.5 py-1 text-[0.625rem] tracking-wide text-rose-deep uppercase">
      <span aria-hidden="true" className="block size-1.5 rounded-full bg-rose-deep" />
      {formatTimeRemaining(remaining)}
    </span>
  );
}

function PromoCard({ product, priority, now }: { product: Product; priority: boolean; now: Date }) {
  const { openProduct } = useCatalog();
  const { requestWhatsapp } = useWhatsapp();

  const discount = bestDiscount(product, now);
  if (!discount) return null;

  const variant = product.variants.find((item) => item.id === discount.variantId);

  return (
    <article
      className={cn(
        "group/card group/promo flex h-full flex-col border border-line bg-surface-raised",
        "transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-silk)]",
        "hover:-translate-y-1.5 hover:border-rose hover:shadow-[0_30px_70px_-40px_rgba(150,87,79,0.55)]",
      )}
    >
      <div className="sheen relative">
        <button
          type="button"
          onClick={() => openProduct(product)}
          className="block w-full text-left"
          aria-label={`Ver detalhes de ${product.name}, ${product.brand}`}
        >
          <ProductMedia product={product} priority={priority} sizes="(max-width: 640px) 62vw, 20vw" />
        </button>

        <Badge tone="promo" className="pointer-events-none absolute top-2.5 left-2.5">
          −{discount.percentOff}%
        </Badge>

        {product.badge ? (
          <Badge tone="muted" className="pointer-events-none absolute top-2.5 right-2.5">
            {BADGE_LABELS[product.badge]}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.5625rem] uppercase tracking-[0.24em] text-gold-deep">{product.brand}</p>

        <h3 className="mt-1.5 font-display text-lg leading-tight text-ink">{product.name}</h3>

        <p className="mt-1 text-[0.6875rem] text-ink-faint">
          {GENDER_LABELS[product.gender]}
          {variant ? ` · ${variantLabel(variant)}` : null}
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <p className="font-display text-xl text-rose-deep">{formatPrice(discount.priceCents)}</p>
          <p className="text-xs text-ink-faint line-through">
            {formatPrice(discount.compareAtPriceCents)}
          </p>
        </div>

        <p className="mt-1 text-[0.6875rem] text-ink-muted">
          Economia de {formatPrice(discount.savedCents)}
        </p>

        <div className="mt-2.5">
          <Countdown product={product} now={now} />
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          <Button variant="quiet" size="sm" className="px-3" onClick={() => openProduct(product)}>
            Detalhes
          </Button>
          <Button
            variant="whatsapp"
            size="sm"
            className="px-3"
            onClick={() =>
              requestWhatsapp({
                source: "promotions",
                variantId: discount.variantId,
                product: {
                  id: product.id,
                  name: product.name,
                  brand: product.brand,
                  variants: product.variants,
                },
              })
            }
          >
            <WhatsappGlyph width={14} height={14} />
            Quero este
          </Button>
        </div>
      </div>
    </article>
  );
}

/**
 * Vitrine de promoções.
 *
 * Aparece somente quando existe desconto real cadastrado — ou seja, quando
 * alguma variante disponível tem preço anterior maior que o atual. Sem
 * promoções, a seção não é renderizada e o menu nem exibe o atalho.
 *
 * No mobile vira um carrossel com encaixe; no desktop, uma grade.
 */
export function Promotions() {
  const { promotions, maxPercentOff, focusPromotions, now } = useCatalog();
  const trackRef = useRef<HTMLUListElement>(null);

  const showcase = useMemo(() => promotions.slice(0, SHOWCASE_LIMIT), [promotions]);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index];
    if (!(card instanceof HTMLElement)) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setActive(index);
  }, []);

  // O giro automático das ofertas.
  useEffect(() => {
    if (paused || showcase.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const track = trackRef.current;
    if (!track) return;
    // Em telas largas o carrossel vira grade e não há o que girar.
    if (track.scrollWidth <= track.clientWidth + 8) return;

    const id = window.setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % showcase.length;
        const card = track.children[next];
        if (card instanceof HTMLElement) {
          track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, ROTATION_MS);

    return () => window.clearInterval(id);
  }, [paused, showcase.length]);

  if (showcase.length === 0) return null;

  const remaining = promotions.length - showcase.length;

  return (
    <section
      id="promocoes"
      aria-labelledby="promocoes-title"
      className="band-blush relative scroll-mt-24 overflow-hidden py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="aurora absolute -top-1/3 right-[-8%] size-[46vw] max-w-[34rem] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-rose)_42%,transparent)_0%,transparent_70%)] blur-3xl"
      />

      <div className="shell relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Ofertas do momento</p>
            <h2
              id="promocoes-title"
              className="text-balance-tight mt-4 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
            >
              Promoções
              {maxPercentOff !== null ? (
                <span className="text-rose-deep"> até {maxPercentOff}% off</span>
              ) : null}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
              Preços com desconto ativo, conferidos pela loja. A confirmação final de valor e
              disponibilidade acontece no atendimento.
            </p>
          </Reveal>

          <Reveal variant="right" delayMs={120}>
            <button
              type="button"
              onClick={focusPromotions}
              className="gold-underline inline-flex min-h-11 items-center gap-2 text-sm text-ink transition-colors hover:text-rose-deep"
            >
              Ver todas no catálogo
              <ArrowGlyph className="transition-transform duration-500 ease-[var(--ease-silk)] group-hover/card:translate-x-1" />
            </button>
          </Reveal>
        </div>

        {/* Carrossel com encaixe no mobile, grade no desktop */}
        <ul
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          className={cn(
            "mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4 xl:grid-cols-5",
          )}
        >
          {showcase.map((product, index) => (
            <Reveal
              as="li"
              key={product.id}
              variant="up"
              delayMs={Math.min(index, 4) * 90}
              className="w-[62vw] shrink-0 snap-start xs:w-[56vw] sm:w-auto"
            >
              <PromoCard product={product} priority={index < 2} now={now} />
            </Reveal>
          ))}
        </ul>

        {/* Marcadores — só aparecem enquanto o carrossel existe */}
        {showcase.length > 1 ? (
          <div className="mt-2 flex flex-wrap justify-center sm:hidden">
            {showcase.map((product, index) => (
              <button
                key={product.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Ver oferta ${index + 1} de ${showcase.length}`}
                aria-current={index === active}
                className="flex size-11 items-center justify-center"
              >
                <span
                  className={cn(
                    "block h-0.5 transition-all duration-500",
                    index === active ? "w-6 bg-rose-deep" : "w-3 bg-line-strong",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}

        {remaining > 0 ? (
          <p className="mt-8 text-center text-sm text-ink-muted">
            {remaining === 1
              ? "Mais 1 perfume em promoção no catálogo."
              : `Mais ${remaining} perfumes em promoção no catálogo.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}
