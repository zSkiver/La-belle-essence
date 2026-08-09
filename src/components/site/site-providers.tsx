"use client";

import { useEffect, type ReactNode } from "react";
import Script from "next/script";
import type { Product } from "@/domain/product";
import { ToastProvider } from "@/components/ui/toast";
import { WhatsappProvider } from "@/components/whatsapp/whatsapp-provider";
import { CatalogProvider } from "@/components/catalog/catalog-provider";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { WhatsappFab } from "./whatsapp-fab";
import { GA_MEASUREMENT_ID, META_PIXEL_ID, captureUtmParams } from "@/lib/analytics";

/**
 * Scripts de analytics.
 *
 * Nada é carregado enquanto os IDs não forem informados por variável de
 * ambiente — é por isso que o site não precisa de banner de cookies por padrão.
 */
function AnalyticsScripts() {
  if (GA_MEASUREMENT_ID === "" && META_PIXEL_ID === "") return null;

  return (
    <>
      {GA_MEASUREMENT_ID !== "" ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      ) : null}

      {META_PIXEL_ID !== "" ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/**
 * Casca de estado do site público. As seções continuam sendo componentes de
 * servidor: elas chegam por `children` e não são arrastadas para o bundle do
 * cliente.
 */
export function SiteProviders({
  products,
  renderedAt,
  children,
}: {
  products: Product[];
  /** Instante da renderização no servidor, para o relógio das ofertas. */
  renderedAt: string;
  children: ReactNode;
}) {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return (
    <ToastProvider>
      <WhatsappProvider>
        <CatalogProvider products={products} renderedAt={renderedAt}>
          {children}
          <ProductDialog />
          <WhatsappFab />
          <AnalyticsScripts />
        </CatalogProvider>
      </WhatsappProvider>
    </ToastProvider>
  );
}
