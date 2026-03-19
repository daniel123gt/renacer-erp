/**
 * Imagen / estilo del “hero” de cada tarjeta de actividad según el tipo.
 * Usa emoji grande + gradiente (sin dependencias extra).
 */
export interface ActividadHeroStyle {
  emoji: string;
  gradientClass: string;
}

export function getActividadHeroStyle(tipo: string): ActividadHeroStyle {
  const t = tipo.trim().toLowerCase();

  if (t.includes("pollada")) {
    return {
      emoji: "🐔",
      gradientClass: "from-amber-100 via-orange-100 to-amber-200",
    };
  }
  if (t.includes("parrillada")) {
    return {
      emoji: "🔥",
      gradientClass: "from-red-100 via-orange-100 to-amber-200",
    };
  }
  if (t.includes("mistura")) {
    return {
      emoji: "🍽️",
      gradientClass: "from-emerald-50 via-teal-100 to-cyan-100",
    };
  }
  if (t.includes("rifa")) {
    return {
      emoji: "🎟️",
      gradientClass: "from-violet-100 via-purple-100 to-fuchsia-100",
    };
  }
  if (t.includes("kermés") || t.includes("kermes")) {
    return {
      emoji: "🎪",
      gradientClass: "from-pink-100 via-rose-100 to-orange-100",
    };
  }
  if (t.includes("bazar")) {
    return {
      emoji: "🛍️",
      gradientClass: "from-sky-100 via-blue-100 to-indigo-100",
    };
  }

  return {
    emoji: "📅",
    gradientClass: "from-slate-100 via-gray-100 to-zinc-200",
  };
}
