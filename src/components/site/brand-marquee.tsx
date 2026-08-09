"use client";

import { useMemo } from "react";
import { useCatalog } from "@/components/catalog/catalog-provider";

/** Quantas cópias da lista compõem o laço. Duas já bastam para o loop. */
const COPIES = 2;

/**
 * Quantidade mínima de itens por cópia. Com poucas marcas, uma cópia ficaria
 * mais estreita que a tela e a faixa andaria deixando um vão em branco — por
 * isso a lista é repetida até encher.
 */
const MIN_ITEMS_PER_COPY = 12;

/**
 * Faixa contínua com as marcas do acervo, correndo da direita para a esquerda.
 *
 * A lista sai do próprio catálogo — nenhuma marca é escrita à mão, então a
 * faixa nunca anuncia algo que a loja não tenha cadastrado. Só a primeira cópia
 * é lida por leitores de tela; as demais existem apenas para fechar o laço.
 */
export function BrandMarquee() {
  const { availableBrands } = useCatalog();

  const sequence = useMemo(() => {
    if (availableBrands.length === 0) return [];
    const out: string[] = [];
    while (out.length < MIN_ITEMS_PER_COPY) out.push(...availableBrands);
    return out;
  }, [availableBrands]);

  // Abaixo de três marcas a faixa não tem o que mostrar e vira ruído.
  if (availableBrands.length < 3) return null;

  return (
    <section aria-labelledby="marcas-title" className="py-8 sm:py-10">
      <h2 id="marcas-title" className="sr-only">
        Marcas disponíveis no acervo
      </h2>

      <div className="marquee-viewport relative overflow-hidden">
        {/* Esmaecimento nas bordas, para a faixa não terminar em corte seco. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-surface to-transparent sm:w-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-surface to-transparent sm:w-40"
        />

        <div
          className="marquee"
          style={{ "--marquee-copies": COPIES } as React.CSSProperties}
        >
          {Array.from({ length: COPIES }, (_, copy) => (
            <ul
              key={copy}
              aria-hidden={copy > 0 ? "true" : undefined}
              className="flex shrink-0 items-center"
            >
              {sequence.map((brand, index) => (
                <li
                  key={`${copy}-${index}-${brand}`}
                  className="flex shrink-0 items-center gap-8 pr-8 font-display text-xl whitespace-nowrap text-ink-faint sm:gap-12 sm:pr-12 sm:text-2xl"
                >
                  {brand}
                  <span aria-hidden="true" className="text-gold">
                    ·
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
