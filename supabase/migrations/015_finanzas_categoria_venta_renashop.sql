-- Categoría para registrar sincronizaciones de ventas de Renashop como entrada.
INSERT INTO categorias_finanzas (nombre, tipo, orden)
SELECT 'Venta Renashop', 'entrada', 5
WHERE NOT EXISTS (
  SELECT 1
  FROM categorias_finanzas
  WHERE nombre = 'Venta Renashop'
    AND tipo = 'entrada'
);
