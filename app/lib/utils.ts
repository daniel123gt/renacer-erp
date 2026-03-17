import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza texto para búsqueda: quita acentos (NFD) y pasa a minúsculas.
 * Así "José" coincide con "jose" y "MARÍA" con "maria".
 */
export function normalizeSearchText(text: string): string {
  if (text == null || typeof text !== "string") return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Formatea una fecha ISO o YYYY-MM-DD como fecha local (evita desfase de un día por UTC).
 * Para más helpers (toNoonUtc, getTodayLocal, etc.) usar ~/lib/dateUtils.
 */
export function formatDateOnly(isoOrDateStr: string | null | undefined, locale = "es-ES"): string {
  if (isoOrDateStr == null) return "";
  const s = String(isoOrDateStr).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return isoOrDateStr;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}
