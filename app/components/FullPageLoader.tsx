import { Loader2 } from "lucide-react";

/** Pantalla de carga a pantalla completa (no depende del loadingStore global). */
export function FullPageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex h-dvh w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-primary-blue">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p className="text-lg">{label}</p>
      </div>
    </div>
  );
}
