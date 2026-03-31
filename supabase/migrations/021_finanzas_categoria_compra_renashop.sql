-- Categoría para compras/salidas de Renashop (descuenta capital Renashop).
INSERT INTO categorias_finanzas (nombre, tipo, orden)
SELECT 'Compra Renashop', 'salida', 6
WHERE NOT EXISTS (
  SELECT 1
  FROM categorias_finanzas
  WHERE nombre = 'Compra Renashop'
    AND tipo = 'salida'
);
