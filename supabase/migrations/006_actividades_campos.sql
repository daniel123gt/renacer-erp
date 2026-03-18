-- ============================================
-- Agregar columnas a actividades y actividad_ventas
-- (para bases que ya tenían 005 ejecutado)
-- ============================================

-- Actividades: costo total de insumos
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS costo_total numeric(12,2) NOT NULL DEFAULT 0;

-- Ventas: si canceló (pagó) y monto pagado
ALTER TABLE actividad_ventas ADD COLUMN IF NOT EXISTS cancelado boolean DEFAULT false;
ALTER TABLE actividad_ventas ADD COLUMN IF NOT EXISTS monto_pagado numeric(12,2) NOT NULL DEFAULT 0;
