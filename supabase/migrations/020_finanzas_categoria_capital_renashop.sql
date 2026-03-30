-- Categoría para reclasificar capital reservado de Renashop como entrada disponible en Finanzas.
INSERT INTO categorias_finanzas (nombre, tipo, orden)
SELECT 'Capital Renashop', 'entrada', 6
WHERE NOT EXISTS (
  SELECT 1
  FROM categorias_finanzas
  WHERE nombre = 'Capital Renashop'
    AND tipo = 'entrada'
);
