# Utilidades compartidas

## Fechas (`dateUtils.ts`)

La app es **solo para Perú**. Todas las fechas y “hoy” se consideran en hora de Perú (America/Lima).

**Problema:** En JavaScript, `new Date("YYYY-MM-DD")` se interpreta como **medianoche UTC**, por eso en Perú se veía el día anterior.

**Regla:** Para cualquier valor que sea **solo fecha** (sin hora) —por ejemplo campos `date`, `fecha`, `order_date`, `hire_date` que vienen como `"YYYY-MM-DD"` o ISO— **no uses** `new Date(fecha).toLocaleDateString()` directamente. Usa las funciones de `~/lib/dateUtils.ts`:

| Necesidad | Función |
|-----------|--------|
| Mostrar en pantalla (dd/mm/yyyy o según locale) | `formatDateOnly()` o `formatDateOnlyDdMmYyyy()` |
| Comparar fechas o formatear con opciones | `parseDateOnlyAsLocal(ymd)` → obtienes un `Date` en hora local |
| Normalizar lo que devuelve la API a YYYY-MM-DD local | `toLocalDateString(value)` |
| Enviar a la BD (columna timestamptz) | `toNoonUtc(dateOnly)` |
| Fecha de hoy para filtros o defaults | `getTodayLocal()` |

Al crear **nuevas páginas o componentes** que muestren o envíen fechas solo-día, importar desde `~/lib/dateUtils` para evitar el desfase de un día.
