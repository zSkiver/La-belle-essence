import { getCatalog } from "@/data/products";
import { SiteProviders } from "@/components/site/site-providers";
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Manifesto } from "@/components/site/manifesto";
import { BrandMarquee } from "@/components/site/brand-marquee";
import { Universes } from "@/components/site/universes";
import { Promotions } from "@/components/site/promotions";
import { Featured } from "@/components/site/featured";
import { CampaignBand } from "@/components/site/campaign-band";
import { CatalogSection } from "@/components/catalog/catalog-section";
import { SignatureGuide } from "@/components/site/signature-guide";
import { Differentials } from "@/components/site/differentials";
import { Testimonials } from "@/components/site/testimonials";
import { Units } from "@/components/site/units";
import { FinalCta } from "@/components/site/final-cta";
import { SiteFooter } from "@/components/site/site-footer";
import { StructuredData } from "@/components/seo/structured-data";

/** Revalida o catálogo a cada 5 minutos. */
export const revalidate = 300;

export default async function HomePage() {
  const { products, source } = await getCatalog();

  // Calculado na renderização (build ou revalidação) e repassado ao cliente,
  // para que a primeira pintura concorde sobre quais ofertas estão no ar.
  const renderedAt = new Date().toISOString();

  return (
    <SiteProviders products={products} renderedAt={renderedAt}>
      <StructuredData />
      <SiteHeader />

      {/*
        Ritmo da página: blocos claros com duas pausas escuras — a faixa de
        campanha no meio e o rodapé no fim. As seções que dependem de dado
        (promoções, destaques, marcas, depoimentos) somem sozinhas quando não
        há o que mostrar.
      */}
      <main id="conteudo">
        <Hero />
        <Manifesto />
        <BrandMarquee />
        <Universes />
        <Promotions />
        <Featured />
        <CampaignBand />
        <CatalogSection showDemoNotice={source === "seed"} />
        <SignatureGuide />
        <Differentials />
        <Testimonials />
        <Units />
        <FinalCta />
      </main>

      <SiteFooter />
    </SiteProviders>
  );
}
