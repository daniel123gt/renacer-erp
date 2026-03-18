-- ============================================
-- Finanzas Iglesia Renacer
-- ============================================

-- Categorías de transacciones (tipos de entrada y salida)
CREATE TABLE IF NOT EXISTS categorias_finanzas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  activa boolean DEFAULT true,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Transacciones (entradas y salidas)
CREATE TABLE IF NOT EXISTS transacciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  categoria_id uuid REFERENCES categorias_finanzas(id),
  descripcion text NOT NULL,
  monto numeric(12,2) NOT NULL CHECK (monto >= 0),
  persona text,
  metodo_pago text CHECK (metodo_pago IN ('efectivo', 'yape', 'plin', 'transferencia', 'otro')),
  notas text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE categorias_finanzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_categorias" ON categorias_finanzas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_categorias" ON categorias_finanzas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_categorias" ON categorias_finanzas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_read_transacciones" ON transacciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_transacciones" ON transacciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_transacciones" ON transacciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_transacciones" ON transacciones FOR DELETE TO authenticated USING (true);

-- Índices
CREATE INDEX idx_transacciones_fecha ON transacciones (fecha);
CREATE INDEX idx_transacciones_tipo ON transacciones (tipo);
CREATE INDEX idx_transacciones_categoria ON transacciones (categoria_id);

-- Tipos de Entrada
INSERT INTO categorias_finanzas (nombre, tipo, orden) VALUES
  ('Ofrenda', 'entrada', 1),
  ('Promesa', 'entrada', 2),
  ('Préstamo', 'entrada', 3),
  ('Venta Equipo', 'entrada', 4),
  ('Otros', 'entrada', 99);

-- Tipos de Salida
INSERT INTO categorias_finanzas (nombre, tipo, orden) VALUES
  ('Misiones', 'salida', 1),
  ('Insumos', 'salida', 2),
  ('Alquiler', 'salida', 3),
  ('Ofrenda Pastor Invitado', 'salida', 4),
  ('Movilidad', 'salida', 5),
  ('Google Meet', 'salida', 6),
  ('Pago Préstamo', 'salida', 7),
  ('Compra Equipo', 'salida', 8),
  ('Otros', 'salida', 99);
