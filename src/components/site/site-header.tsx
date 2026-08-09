"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { MenuGlyph, WhatsappGlyph } from "@/components/icons";
import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  /** Só entra no menu quando existe promoção ativa. */
  promoOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "#topo", label: "Início" },
  { href: "#promocoes", label: "Promoções", promoOnly: true },
  { href: "#catalogo", label: "Perfumes" },
  { href: "#assinatura", label: "Descubra sua fragrância" },
  { href: "#manifesto", label: "A La Belle" },
  { href: "#unidades", label: "Unidades" },
];

/**
 * Header transparente sobre a hero; ganha superfície e sombra ao rolar.
 *
 * A barra informativa recolhe junto, devolvendo altura útil à leitura. Quando
 * existe promoção ativa, ela troca de mensagem e vira atalho para a vitrine —
 * o percentual exibido é o maior desconto real do catálogo, nunca um número
 * decorativo.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { requestWhatsapp } = useWhatsapp();
  const { promotions, maxPercentOff } = useCatalog();

  const hasPromotions = promotions.length > 0;
  const navItems = NAV_ITEMS.filter((item) => !item.promoOnly || hasPromotions);

  // O header só ganha superfície depois que a hero termina de rolar. Enquanto
  // estiver sobre o painel escuro, ele fica transparente e com texto claro.
  useEffect(() => {
    const threshold = () => {
      const hero = document.getElementById("topo");
      if (!hero) return 24;
      return Math.max(24, hero.offsetHeight - window.innerHeight * 0.55);
    };

    let limit = threshold();
    const onScroll = () => setScrolled(window.scrollY > limit);
    const onResize = () => {
      limit = threshold();
      onScroll();
    };

    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <a
        href="#catalogo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-ink-inverse"
      >
        Pular para o catálogo
      </a>

      <div className="fixed inset-x-0 top-0 z-50">
        {/* Barra informativa / promocional */}
        <div
          className={cn(
            "overflow-hidden text-ink-inverse transition-[max-height,opacity] duration-500 ease-[var(--ease-silk)]",
            hasPromotions ? "bg-rose-deep" : "bg-ink",
            scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
          )}
        >
          <div className="shell flex h-9 items-center justify-center gap-2 text-[0.6875rem] tracking-[0.14em] uppercase">
            {hasPromotions ? (
              <a
                href="#promocoes"
                className="flex items-center gap-2 truncate underline-offset-4 hover:underline"
              >
                <span className="truncate">Promoções ativas</span>
                {maxPercentOff !== null ? (
                  <>
                    <span aria-hidden="true" className="text-gold">
                      •
                    </span>
                    <span className="truncate">até {maxPercentOff}% de desconto</span>
                  </>
                ) : null}
              </a>
            ) : (
              <>
                <span className="truncate">Atendimento em Rio Verde</span>
                <span aria-hidden="true" className="text-gold">
                  •
                </span>
                <a href="#unidades" className="truncate underline-offset-4 hover:underline">
                  Centro e Buriti Shopping
                </a>
              </>
            )}
          </div>
        </div>

        {/* Header */}
        <header
          className={cn(
            "relative transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-silk)]",
            scrolled
              ? "border-b border-line bg-surface/92 shadow-[0_10px_40px_-30px_rgba(46,33,30,0.6)] backdrop-blur-md"
              : "border-b border-transparent bg-transparent",
          )}
        >
          <div className="shell flex h-16 items-center justify-between gap-6 sm:h-20">
            <Link href="#topo" aria-label={`${siteConfig.name} — início`} className="shrink-0">
              <Wordmark tone={scrolled ? "onLight" : "onDark"} />
            </Link>

            <nav aria-label="Navegação principal" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={cn(
                        "gold-underline text-[0.8125rem] transition-colors",
                        scrolled
                          ? "text-ink-muted hover:text-ink"
                          : "text-ink-inverse/80 hover:text-ink-inverse",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant={scrolled ? "outline" : "onDark"}
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => requestWhatsapp({ source: "header" })}
              >
                <WhatsappGlyph width={15} height={15} />
                WhatsApp
              </Button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menu de navegação"
                aria-expanded={menuOpen}
                className={cn(
                  "inline-flex size-11 items-center justify-center lg:hidden",
                  scrolled ? "text-ink" : "text-ink-inverse",
                )}
              >
                <MenuGlyph />
              </button>
            </div>
          </div>

          {/* Progresso de leitura — animação guiada pelo scroll, sem JavaScript. */}
          <span
            aria-hidden="true"
            className={cn(
              "scroll-progress absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-gold via-rose to-gold transition-opacity duration-500",
              scrolled ? "opacity-100" : "opacity-0",
            )}
          />
        </header>
      </div>

      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu de navegação"
        placement="right"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Wordmark tone="onLight" height={24} />
          <DialogCloseButton onClose={() => setMenuOpen(false)} label="Fechar menu" />
        </div>

        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.href} className="border-b border-line last:border-0">
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-14 items-center font-display text-2xl text-ink transition-colors hover:text-rose-deep"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line px-5 py-5">
          <Button
            variant="whatsapp"
            size="lg"
            className="w-full"
            onClick={() => {
              setMenuOpen(false);
              requestWhatsapp({ source: "header" });
            }}
          >
            <WhatsappGlyph />
            Falar no WhatsApp
          </Button>
        </div>
      </Dialog>
    </>
  );
}
