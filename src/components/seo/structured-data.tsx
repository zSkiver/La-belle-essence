import { formatUnitAddress, siteConfig, type StoreUnit } from "@/lib/site-config";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function unitToLocalBusiness(unit: StoreUnit): Record<string, JsonValue> {
  const entry: Record<string, JsonValue> = {
    "@type": "PerfumeStore",
    "@id": `${siteConfig.url}/#${unit.id}`,
    name: unit.fullName,
    description: siteConfig.shortDescription,
    url: siteConfig.url,
    telephone: `+${unit.whatsappNumber}`,
    image: `${siteConfig.url}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      streetAddress: unit.street,
      addressLocality: unit.city,
      addressRegion: unit.state,
      postalCode: unit.postalCode,
      addressCountry: siteConfig.country,
    },
    areaServed: `${unit.city}, ${unit.state}`,
    sameAs: [siteConfig.social.instagram],
  };

  if (unit.geo) {
    entry.geo = {
      "@type": "GeoCoordinates",
      latitude: unit.geo.latitude,
      longitude: unit.geo.longitude,
    };
  }

  if (siteConfig.openingHours) {
    entry.openingHoursSpecification = siteConfig.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.days,
      opens: hours.opens,
      closes: hours.closes,
    }));
  }

  return entry;
}

/**
 * Dados estruturados JSON-LD.
 *
 * Só descreve o que está confirmado: as duas unidades, os endereços e o
 * Instagram. Sem avaliações, faixa de preço ou horários não verificados.
 */
export function StructuredData() {
  const graph: JsonValue[] = [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organizacao`,
      name: siteConfig.legalName,
      alternateName: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      sameAs: [siteConfig.social.instagram],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#site`,
      url: siteConfig.url,
      name: siteConfig.name,
      inLanguage: "pt-BR",
      publisher: { "@id": `${siteConfig.url}/#organizacao` },
    },
    ...siteConfig.units.map(unitToLocalBusiness),
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      // O conteúdo é montado a partir de configuração própria, não de entrada
      // do usuário. Escapamos "<" para impedir a quebra da tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Marcação de endereço legível para leitores de tela em texto corrido. */
export function unitAddressLine(unit: StoreUnit): string {
  return formatUnitAddress(unit);
}
