-- Detalle de insumos por actividad (nombre + costo). costo_total sigue siendo la suma para reportes.
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS insumos jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN actividades.insumos IS 'Array JSON: [{ "nombre": "...", "costo": number }, ...]';
