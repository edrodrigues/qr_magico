const SITE_URL = "https://www.momentomagico.xyz";
const SITE_NAME = "Momento Mágico";

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>[];
}

export function SEO({ jsonLd }: SEOProps) {
  return (
    <>
      {jsonLd?.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Crie retrospectivas animadas personalizadas com trilhas sonoras geradas por IA.",
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    sameAs: [],
  };
}

export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Momento Mágico — Retrospectiva Personalizada",
    description: "Retrospectiva animada personalizada com trilha sonora gerada por IA, entregue via QR Code.",
    image: `${SITE_URL}/favicon.png`,
    brand: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: SITE_URL,
      priceCurrency: "BRL",
      price: "19.90",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
    },
  };
}

export function videoObjectSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  embedUrl,
}: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl,
    uploadDate,
    ...(contentUrl && { contentUrl }),
    ...(embedUrl && { embedUrl }),
  };
}
