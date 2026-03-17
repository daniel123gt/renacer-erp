import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_LIMIT_OPTIONS = [5, 10, 20, 50] as const;

export interface TablePaginationProps {
  /** Página actual (1-based) */
  page: number;
  /** Elementos por página */
  limit: number;
  /** Total de registros */
  total: number;
  /** Callback al cambiar página */
  onPageChange: (page: number) => void;
  /** Callback al cambiar límite (resetea a página 1) */
  onLimitChange: (limit: number) => void;
  /** Etiqueta para el recurso (ej: "pacientes", "productos") */
  itemLabel?: string;
  /** Opciones para "elementos por página". Default: [5, 10, 20, 50] */
  limitOptions?: number[];
  /** Si true, muestra el selector "Elementos por página" */
  showLimitSelect?: boolean;
  /** Si true, muestra la barra "Mostrando X - Y de Z" (y opcionalmente el selector de límite). Si false, solo se muestran los botones de página. */
  showSummary?: boolean;
}

export function TablePagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  itemLabel = "registros",
  limitOptions = DEFAULT_LIMIT_OPTIONS,
  showLimitSelect = true,
  showSummary = true,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <>
      {/* Barra superior: "Mostrando X - Y de Z" + selector por página (opcional) */}
      {showSummary && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-3 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          Mostrando {from} - {to} de {total} {itemLabel}
        </div>
        {showLimitSelect && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Elementos por página
            </label>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      )}

      {/* Controles de página (solo si hay más de una página) */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className={page === pageNum ? "bg-primary-blue text-white hover:bg-primary-blue/90" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={!hasNextPage}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
