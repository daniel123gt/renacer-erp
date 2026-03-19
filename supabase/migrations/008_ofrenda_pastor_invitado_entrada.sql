-- Agregar categoría de entrada: Ofrenda Pastor Invitado
INSERT INTO categorias_finanzas (nombre, tipo, orden)
SELECT 'Ofrenda Pastor Invitado', 'entrada', 6
WHERE NOT EXISTS (SELECT 1 FROM categorias_finanzas WHERE nombre = 'Ofrenda Pastor Invitado' AND tipo = 'entrada');
