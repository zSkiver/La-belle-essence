"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RevealVariant = "up" | "fade" | "left" | "right" | "scale" | "blur";

/**
 * Revela o conteúdo quando ele entra na viewport.
 *
 * A revelação é aplicada direto no DOM (`data-revealed`) em vez de virar estado
 * do React: é sincronização visual de mão única, sem re-render.
 *
 * Se o usuário preferir movimento reduzido — ou se IntersectionObserver não
 * existir — o conteúdo aparece imediatamente. O CSS também mantém tudo visível
 * caso o JavaScript não carregue.
 */
export function Reveal({
  children,
  as: Component = "div",
  variant = "up",
  delayMs = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reveal = () => {
      element.dataset.revealed = "true";
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      data-revealed="false"
      data-variant={variant}
      style={delayMs ? ({ "--reveal-delay": `${delayMs}ms` } as React.CSSProperties) : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Component>
  );
}

/**
 * Revela os filhos em cascata, calculando o atraso de cada um.
 * Evita repetir `delayMs` item a item nas listas.
 */
export function RevealGroup({
  children,
  as: Component = "div",
  itemAs = "div",
  variant = "up",
  stepMs = 90,
  maxStep = 6,
  className,
  itemClassName,
}: {
  children: ReactNode[];
  as?: ElementType;
  itemAs?: ElementType;
  variant?: RevealVariant;
  stepMs?: number;
  /** Limita o atraso acumulado para que listas longas não fiquem lentas. */
  maxStep?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <Component className={className}>
      {children.map((child, index) => (
        <Reveal
          key={index}
          as={itemAs}
          variant={variant}
          delayMs={Math.min(index, maxStep) * stepMs}
          className={itemClassName}
        >
          {child}
        </Reveal>
      ))}
    </Component>
  );
}
