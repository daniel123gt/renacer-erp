-- Agregar categoría de entrada: Ofrenda Misionera
INSERT INTO categorias_finanzas (nombre, tipo, orden)
SELECT 'Ofrenda Misionera', 'entrada', 5
WHERE NOT EXISTS (SELECT 1 FROM categorias_finanzas WHERE nombre = 'Ofrenda Misionera' AND tipo = 'entrada');
