-- ============================================
-- Actividades Económicas — Iglesia Renacer
-- Polladas, parrilladas, misturas, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS actividades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'Pollada',
  proposito text,
  meta_cantidad integer NOT NULL DEFAULT 0,
  precio_unitario numeric(12,2) NOT NULL DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  costo_total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activa', 'completada', 'cancelada')),
  notas text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actividades_select" ON actividades;
DROP POLICY IF EXISTS "actividades_insert" ON actividades;
DROP POLICY IF EXISTS "actividades_update" ON actividades;
DROP POLICY IF EXISTS "actividades_delete" ON actividades;
CREATE POLICY "actividades_select" ON actividades FOR SELECT TO authenticated USING (true);
CREATE POLICY "actividades_insert" ON actividades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "actividades_update" ON actividades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "actividades_delete" ON actividades FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_actividades_estado ON actividades(estado);
CREATE INDEX IF NOT EXISTS idx_actividades_tipo ON actividades(tipo);

-- Ventas individuales dentro de cada actividad
CREATE TABLE IF NOT EXISTS actividad_ventas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actividad_id uuid NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  persona text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  monto numeric(12,2) NOT NULL DEFAULT 0,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago text DEFAULT 'efectivo',
  entregado boolean DEFAULT false,
  cancelado boolean DEFAULT false,
  monto_pagado numeric(12,2) NOT NULL DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE actividad_ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actividad_ventas_select" ON actividad_ventas;
DROP POLICY IF EXISTS "actividad_ventas_insert" ON actividad_ventas;
DROP POLICY IF EXISTS "actividad_ventas_update" ON actividad_ventas;
DROP POLICY IF EXISTS "actividad_ventas_delete" ON actividad_ventas;
CREATE POLICY "actividad_ventas_select" ON actividad_ventas FOR SELECT TO authenticated USING (true);
CREATE POLICY "actividad_ventas_insert" ON actividad_ventas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "actividad_ventas_update" ON actividad_ventas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "actividad_ventas_delete" ON actividad_ventas FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_actividad_ventas_actividad ON actividad_ventas(actividad_id);
CREATE INDEX IF NOT EXISTS idx_actividad_ventas_persona ON actividad_ventas(persona);
CREATE INDEX IF NOT EXISTS idx_actividad_ventas_fecha ON actividad_ventas(fecha);
