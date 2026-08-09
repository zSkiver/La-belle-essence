import type { StoreUnitId } from "./site-config";

const STORAGE_KEY = "lbe:unidade";

const VALID_UNITS: StoreUnitId[] = ["buriti", "centro"];

/**
 * Última unidade escolhida pelo visitante. Serve apenas para pré-selecionar a
 * opção — a escolha continua editável em todo clique de WhatsApp.
 */
export function readPreferredUnit(): StoreUnitId | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_UNITS.includes(stored as StoreUnitId)) {
      return stored as StoreUnitId;
    }
  } catch {
    // localStorage indisponível — seguimos sem preferência salva.
  }
  return null;
}

export function savePreferredUnit(unit: StoreUnitId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, unit);
  } catch {
    // Ignorado de propósito: a preferência é uma conveniência, não um requisito.
  }
}

export function clearPreferredUnit(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorado de propósito.
  }
}
