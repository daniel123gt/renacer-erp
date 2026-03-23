-- Estado de cobro por línea de venta Renashop
ALTER TABLE ventas_renashop
  ADD COLUMN IF NOT EXISTS estado_pago text NOT NULL DEFAULT 'pagado';

ALTER TABLE ventas_renashop
  DROP CONSTRAINT IF EXISTS ventas_renashop_estado_pago_check;

ALTER TABLE ventas_renashop
  ADD CONSTRAINT ventas_renashop_estado_pago_check
  CHECK (estado_pago IN ('pagado', 'pendiente'));

COMMENT ON COLUMN ventas_renashop.estado_pago IS 'pagado = cobrado; pendiente = venta fiada / por cobrar';
