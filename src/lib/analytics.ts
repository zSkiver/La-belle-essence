/**
 * Camada fina de analytics.
 *
 * Nenhum ID é inventado: enquanto NEXT_PUBLIC_GA_MEASUREMENT_ID ou
 * NEXT_PUBLIC_META_PIXEL_ID estiverem vazios, nenhum script de terceiros é
 * carregado e estas funções não fazem nada. A instrumentação já está pronta
 * para quando a loja decidir configurar.
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

interface AnalyticsWindow extends Window {
  gtag?: (command: string, eventName: string, params?: EventParams) => void;
  fbq?: (command: string, eventName: string, params?: EventParams) => void;
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export function hasAnalytics(): boolean {
  return GA_MEASUREMENT_ID !== "" || META_PIXEL_ID !== "";
}

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  const scope = window as AnalyticsWindow;

  scope.gtag?.("event", name, params);
  scope.fbq?.("trackCustom", name, params);
}

/* -------------------------------------------------------------------------- */
/* UTM                                                                        */
/* -------------------------------------------------------------------------- */

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

const UTM_STORAGE_KEY = "lbe:utm";

function readUtmFromUrl(): UtmParams | null {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  if (!source && !medium && !campaign) return null;
  return { utmSource: source, utmMedium: medium, utmCampaign: campaign };
}

/**
 * Guarda os UTMs da primeira visita na sessão, para que o clique no WhatsApp
 * mantenha a origem mesmo depois de o visitante navegar pelo site.
 */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  const fromUrl = readUtmFromUrl();
  if (!fromUrl) return;
  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
  } catch {
    // Modo privativo ou storage bloqueado — seguimos sem persistir.
  }
}

export function getUtmParams(): UtmParams {
  const empty: UtmParams = { utmSource: null, utmMedium: null, utmCampaign: null };
  if (typeof window === "undefined") return empty;

  const fromUrl = readUtmFromUrl();
  if (fromUrl) return fromUrl;

  try {
    const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return empty;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return empty;
    const record = parsed as Partial<UtmParams>;
    return {
      utmSource: record.utmSource ?? null,
      utmMedium: record.utmMedium ?? null,
      utmCampaign: record.utmCampaign ?? null,
    };
  } catch {
    return empty;
  }
}
