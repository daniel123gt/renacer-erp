-- Nombre del cliente / deudor (opcional salvo ventas pendientes, validado en app)
ALTER TABLE ventas_renashop_cabeceras
  ADD COLUMN IF NOT EXISTS nombre text;

COMMENT ON COLUMN ventas_renashop_cabeceras.nombre IS 'Nombre del comprador o responsable; obligatorio en UI si estado_pago = pendiente';
