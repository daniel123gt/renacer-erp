-- ============================================
-- Backfill: rellenar costo_unitario y ganancia
-- en ventas existentes que quedaron en 0
-- ============================================

-- 1. Actualizar costo_unitario desde materials para ventas con producto_id
UPDATE ventas_renashop v
SET costo_unitario = m.cost_soles
FROM materials m
WHERE v.producto_id = m.id
  AND v.costo_unitario = 0;

-- 2. Recalcular ganancia en todas las ventas
UPDATE ventas_renashop
SET ganancia = (precio_unitario - costo_unitario) * cantidad
WHERE ganancia = 0
  AND costo_unitario > 0;
