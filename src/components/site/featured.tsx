"use client";

import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/catalog/product-card";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { SectionHeading } from "./section-heading";
import { siteConfig } from "@/lib/site-config";

/**
 * Vitrine de destaques — alimentada pelos produtos marcados como destaque no
 * painel. Se nenhum estiver marcado, a seção simplesmente não aparece.
 */
export function Featured() {
  const { allProducts } = useCatalog();
  const featured = allProducts.filter((product) => product.isFeatured).slice(0, siteConfig.featuredLimit);

  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="destaques-title" className="shell py-20 sm:py-24">
      <SectionHeading
        id="destaques-title"
        eyebrow="Seleção da casa"
        title="Perfumes em destaque"
        description="Uma seleção curta, revista pela loja conforme o acervo muda."
      />

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {featured.map((product, index) => (
          <Reveal key={product.id} delayMs={(index % 4) * 80}>
            <ProductCard product={product} size="large" priority={index < 4} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
