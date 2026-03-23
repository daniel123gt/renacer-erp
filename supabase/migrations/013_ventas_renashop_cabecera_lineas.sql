-- Renashop: cabecera de venta (ticket) + líneas de detalle.
-- Migra datos de ventas_renashop (una fila = una línea) a cabecera + línea conservando el mismo UUID de cabecera que tenía la fila antigua.

-- Por si la BD no tiene aún estado_pago en la tabla antigua
ALTER TABLE IF EXISTS ventas_renashop
  ADD COLUMN IF NOT EXISTS estado_pago text DEFAULT 'pagado';

UPDATE ventas_renashop SET estado_pago = 'pagado' WHERE estado_pago IS NULL;

CREATE TABLE IF NOT EXISTS ventas_renashop_cabeceras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago text DEFAULT 'plin',
  estado_pago text NOT NULL DEFAULT 'pagado',
  notas text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT ventas_renashop_cab_estado_check CHECK (estado_pago IN ('pagado', 'pendiente'))
);

CREATE TABLE IF NOT EXISTS ventas_renashop_lineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES ventas_renashop_cabeceras(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  producto_nombre text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  costo_unitario numeric(12,2) NOT NULL DEFAULT 0,
  precio_unitario numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  ganancia numeric(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vr_cab_fecha ON ventas_renashop_cabeceras(fecha);
CREATE INDEX IF NOT EXISTS idx_vr_cab_estado ON ventas_renashop_cabeceras(estado_pago);
CREATE INDEX IF NOT EXISTS idx_vr_lineas_venta ON ventas_renashop_lineas(venta_id);
CREATE INDEX IF NOT EXISTS idx_vr_lineas_producto ON ventas_renashop_lineas(producto_id);

ALTER TABLE ventas_renashop_cabeceras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_renashop_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vr_cab_select" ON ventas_renashop_cabeceras
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vr_cab_insert" ON ventas_renashop_cabeceras
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vr_cab_update" ON ventas_renashop_cabeceras
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vr_cab_delete" ON ventas_renashop_cabeceras
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "vr_lin_select" ON ventas_renashop_lineas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vr_lin_insert" ON ventas_renashop_lineas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vr_lin_update" ON ventas_renashop_lineas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vr_lin_delete" ON ventas_renashop_lineas
  FOR DELETE TO authenticated USING (true);

-- Migración one-shot: solo si existe la tabla plana antigua
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ventas_renashop'
  ) THEN
    INSERT INTO ventas_renashop_cabeceras (id, fecha, metodo_pago, estado_pago, notas, created_at, created_by)
    SELECT
      id,
      fecha,
      COALESCE(metodo_pago, 'efectivo'),
      CASE WHEN estado_pago = 'pendiente' THEN 'pendiente' ELSE 'pagado' END,
      notas,
      created_at,
      created_by
    FROM ventas_renashop;

    INSERT INTO ventas_renashop_lineas (venta_id, producto_id, producto_nombre, cantidad, costo_unitario, precio_unitario, total, ganancia)
    SELECT
      id,
      producto_id,
      producto_nombre,
      cantidad,
      costo_unitario,
      precio_unitario,
      total,
      ganancia
    FROM ventas_renashop;

    DROP TABLE ventas_renashop;
  END IF;
END $$;

COMMENT ON TABLE ventas_renashop_cabeceras IS 'Ticket de venta Renashop (fecha, pago, notas)';
COMMENT ON TABLE ventas_renashop_lineas IS 'Líneas de producto por ticket';
