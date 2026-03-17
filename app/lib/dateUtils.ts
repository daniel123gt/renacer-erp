/**
 * Utilidades de fecha para evitar el desfase de un día por zona horaria.
 *
 * La app es solo para Perú: "hoy" y las fechas se tratan en hora de Perú (America/Lima, UTC-5).
 *
 * IMPORTANTE: En JavaScript, new Date("YYYY-MM-DD") se interpreta como medianoche UTC,
 * por eso en Perú se mostraba el día anterior. Usar siempre las funciones de este módulo
 * para fechas solo-día (listados, filtros, formularios, APIs).
 */

/** Locale por defecto: Perú (formato de fecha/número según convención local). */
export const APP_DATE_LOCALE = "es-PE";

/** Formatea "YYYY-MM-DD" o ISO a string legible (por defecto locale Perú) */
export function formatDateOnly(
  isoOrYmd: string | null | undefined,
  locale = APP_DATE_LOCALE
): string {
  if (isoOrYmd == null || isoOrYmd === "") return "";
  const part = String(isoOrYmd).trim().split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(part)) return String(isoOrYmd);
  const [y, m, d] = part.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}

/** Formatea "YYYY-MM-DD" a "dd/mm/yyyy" sin usar Date (sin desfase) */
export function formatDateOnlyDdMmYyyy(ymd: string | null | undefined): string {
  if (ymd == null || ymd === "") return "";
  const part = String(ymd).trim().split("T")[0];
  const [y, m, d] = part.split("-");
  if (!y || !m || !d) return part;
  return `${d}/${m}/${y}`;
}

/** Parsea "YYYY-MM-DD" como fecha local (mediodía) para comparaciones y formateo sin desfase */
export function parseDateOnlyAsLocal(ymd: string): Date {
  const part = String(ymd).trim().split("T")[0];
  const [y, m, d] = part.split("-").map(Number);
  if (!y || !m || !d) return new Date(ymd);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Convierte respuesta API (ISO o YYYY-MM-DD) a "YYYY-MM-DD" en hora local */
export function toLocalDateString(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (!s.includes("T")) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Para guardar en BD: "YYYY-MM-DD" → ISO mediodía UTC (evita que timestamptz muestre día anterior) */
export function toNoonUtc(dateOnly: string): string {
  if (!dateOnly || dateOnly.includes("T")) return dateOnly;
  return `${dateOnly}T12:00:00.000Z`;
}

/** Fecha de hoy en hora Perú como "YYYY-MM-DD" (filtros, valores por defecto). La app es solo para Perú. */
export function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convierte hora guardada (ej. "8:00 AM", "09:00") a "HH:mm" para input type="time". */
export function toTimeInputValue(h: string | null | undefined): string {
  if (!h || !String(h).trim()) return "";
  const t = String(h).trim();
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [hour, min] = t.split(":").map(Number);
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  const match = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = (match[3] || "").toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return "";
}
