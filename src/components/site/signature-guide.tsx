"use client";

import type { FragranceFamily } from "@/domain/enums";
import { Reveal } from "@/components/ui/reveal";
import { ArrowGlyph } from "@/components/icons";
import { SectionHeading } from "./section-heading";
import { useCatalog } from "@/components/catalog/catalog-provider";

/**
 * Guia de preferências.
 *
 * Cada opção é apenas um atalho para o filtro de família olfativa — não há
 * diagnóstico, pontuação nem promessa de recomendação perfeita.
 */
const OPTIONS: Array<{ family: FragranceFamily; title: string; description: string }> = [
  { family: "fresco", title: "Fresco", description: "Leve, limpo, fácil de usar de dia." },
  { family: "amadeirado", title: "Amadeirado", description: "Seco e sóbrio, com madeiras no fundo." },
  { family: "floral", title: "Floral", description: "Flores em primeiro plano, do delicado ao intenso." },
  { family: "oriental", title: "Oriental", description: "Resinas, âmbar e oud — o registro árabe clássico." },
  { family: "gourmand", title: "Gourmand", description: "Baunilha, caramelo e especiarias doces." },
  { family: "citrico", title: "Cítrico", description: "Abertura viva, boa para o calor." },
];

export function SignatureGuide() {
  const { focusFamily } = useCatalog();

  return (
    <section
      id="assinatura"
      aria-labelledby="assinatura-title"
      className="band-sunken scroll-mt-24 py-24 sm:py-32"
    >
      <div className="shell">
        <SectionHeading
          id="assinatura-title"
          eyebrow="Encontre sua assinatura"
          title="Por onde você quer começar?"
          description="Escolha o tipo de fragrância que mais combina com você. Aplicamos o filtro no catálogo — o resto da escolha é conversa."
        />

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIONS.map((option, index) => (
            <Reveal as="li" key={option.family} delayMs={(index % 3) * 80}>
              <button
                type="button"
                onClick={() => focusFamily(option.family)}
                className="group/option flex min-h-28 w-full flex-col justify-between border border-line p-5 text-left transition-colors hover:border-gold/45 hover:bg-gold/5"
              >
                <span>
                  <span className="gold-underline block font-display text-2xl text-ink">{option.title}</span>
                  <span className="mt-1.5 block text-sm text-ink-muted">{option.description}</span>
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.2em] text-gold-deep">
                  Filtrar catálogo
                  <ArrowGlyph
                    width={14}
                    height={14}
                    className="transition-transform duration-500 ease-[var(--ease-editorial)] group-hover/option:translate-x-1"
                  />
                </span>
              </button>
            </Reveal>
          ))}
        </ul>

        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink-faint">
          Preferência olfativa é pessoal e muda com o clima, a hora e a ocasião. O melhor teste
          continua sendo sentir na pele — em qualquer uma das duas unidades.
        </p>
      </div>
    </section>
  );
}
