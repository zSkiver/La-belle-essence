"use client";

import Image from "next/image";
import { GENDERS, GENDER_PLURAL_LABELS, type Gender } from "@/domain/enums";
import { Reveal } from "@/components/ui/reveal";
import { ArrowGlyph } from "@/components/icons";
import { SectionHeading } from "./section-heading";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { universeImages } from "@/lib/brand-assets";

const UNIVERSE_COPY: Record<Gender, string> = {
  feminino: "Florais, gourmands e orientais com doçura medida.",
  masculino: "Amadeirados, especiados e frescos de rastro firme.",
  unissex: "Oud, âmbar e resinas — sem endereço de gênero.",
};

/** Composição de apoio usada enquanto não há fotografia própria da categoria. */
function UniversePlaceholder({ gender }: { gender: Gender }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-surface-blush)_0%,var(--color-rose-tint)_100%)]"
    >
      <div className="absolute inset-x-8 top-10 bottom-0 border-x border-t border-gold/35 [border-start-end-radius:14rem] [border-start-start-radius:14rem]" />
      <span className="absolute inset-x-0 bottom-24 text-center font-display text-6xl text-rose/45 uppercase">
        {GENDER_PLURAL_LABELS[gender].slice(0, 1)}
      </span>
    </div>
  );
}

export function Universes() {
  const { focusGender } = useCatalog();

  return (
    <section aria-labelledby="universos-title" className="shell py-20 sm:py-24">
      <SectionHeading
        id="universos-title"
        eyebrow="Navegue por universo"
        title="Três caminhos para começar"
        description="Um recorte inicial para estreitar a busca. Depois é possível refinar por marca, família olfativa e faixa de preço."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-3">
        {GENDERS.map((gender, index) => {
          const image = universeImages[gender];
          return (
            <Reveal as="li" key={gender} delayMs={index * 90}>
              <button
                type="button"
                onClick={() => focusGender(gender)}
                className="group/universe relative block aspect-4/5 w-full overflow-hidden border border-line text-left transition-colors hover:border-gold/45 sm:aspect-3/4"
              >
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 90vw, 30vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover/universe:scale-105"
                  />
                ) : (
                  <UniversePlaceholder gender={gender} />
                )}

                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent"
                />

                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
                  <span className="gold-underline font-display text-3xl leading-none text-ink-inverse">
                    {GENDER_PLURAL_LABELS[gender]}
                  </span>
                  <span className="text-sm text-ink-inverse/80">{UNIVERSE_COPY[gender]}</span>
                  <span className="mt-2 inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-gold">
                    Ver perfumes
                    <ArrowGlyph className="transition-transform duration-500 ease-[var(--ease-editorial)] group-hover/universe:translate-x-1" />
                  </span>
                </span>
              </button>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
