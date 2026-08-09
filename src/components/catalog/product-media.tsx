import Image from "next/image";
import type { ReactNode } from "react";
import type { Product } from "@/domain/product";
import { orderedImages } from "@/domain/variants";
import { cn } from "@/lib/cn";

/**
 * Marcador tipográfico usado enquanto o produto não tem fotografia própria.
 * Preferimos um bloco desenhado a uma imagem genérica de banco: mantém a
 * composição de pé sem sugerir uma foto que não existe.
 */
function MediaPlaceholder({ product }: { product: Product }) {
  const initial = product.name.trim().charAt(0).toUpperCase();

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(165deg,var(--color-surface-blush)_0%,var(--color-rose-tint)_100%)]"
    >
      <div className="portal-frame flex h-[62%] w-[46%] items-end justify-center pb-5">
        <span className="font-display text-5xl font-light text-rose-deep/70">{initial}</span>
      </div>
      <span className="text-[0.5625rem] uppercase tracking-[0.32em] text-ink-faint">
        {product.brand}
      </span>
    </div>
  );
}

export function ProductMedia({
  product,
  priority = false,
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw",
  className,
  enableHoverSwap = true,
  hoverOverlay,
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Troca para a segunda foto no hover, quando existir. */
  enableHoverSwap?: boolean;
  /**
   * Segundo estado do card: aparece sobre a foto no hover, junto com a troca
   * de imagem. Só existe em ponteiro fino — no toque a mesma informação vive
   * abaixo da foto, então nada se perde.
   */
  hoverOverlay?: ReactNode;
}) {
  const images = orderedImages(product);
  const primary = images[0];
  const secondary = enableHoverSwap ? images[1] : undefined;

  return (
    <div
      className={cn(
        "group/media relative aspect-4/5 w-full overflow-hidden bg-surface-sunken",
        className,
      )}
    >
      {primary ? (
        <>
          <Image
            src={primary.publicUrl}
            alt={primary.altText ?? `${product.name}, ${product.brand}`}
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              "object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-editorial)]",
              "group-hover/card:scale-[1.03]",
              secondary && "group-hover/card:opacity-0",
            )}
          />
          {secondary ? (
            <Image
              src={secondary.publicUrl}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-editorial)] group-hover/card:opacity-100"
            />
          ) : null}
        </>
      ) : (
        <MediaPlaceholder product={product} />
      )}

      {hoverOverlay ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-500 ease-[var(--ease-silk)]",
            "group-hover/card:opacity-100 pointer-fine:block",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">{hoverOverlay}</div>
        </div>
      ) : null}
    </div>
  );
}
