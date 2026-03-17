-- ============================================
-- Renashop — Tienda Iglesia Renacer
-- ============================================

-- -----------------------------------------------
-- 1. Tabla de productos / inventario (materials)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  categoria text DEFAULT 'Otros',
  cost_soles numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  max_stock integer NOT NULL DEFAULT 0,
  unit text DEFAULT 'unidades',
  proveedor text,
  estado text DEFAULT 'in_stock',
  is_active boolean DEFAULT true,
  last_restocked date,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

-- RLS para materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_select" ON materials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_insert" ON materials
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "materials_update" ON materials
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "materials_delete" ON materials
  FOR DELETE TO authenticated USING (true);

-- Índices
CREATE INDEX idx_materials_categoria ON materials(categoria);
CREATE INDEX idx_materials_estado ON materials(estado);
CREATE INDEX idx_materials_is_active ON materials(is_active);

-- -----------------------------------------------
-- 2. Tabla de ventas de Renashop
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS ventas_renashop (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  producto_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  producto_nombre text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  metodo_pago text DEFAULT 'efectivo',
  notas text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS para ventas_renashop
ALTER TABLE ventas_renashop ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_renashop_select" ON ventas_renashop
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ventas_renashop_insert" ON ventas_renashop
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ventas_renashop_update" ON ventas_renashop
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ventas_renashop_delete" ON ventas_renashop
  FOR DELETE TO authenticated USING (true);

-- Índices
CREATE INDEX idx_ventas_renashop_fecha ON ventas_renashop(fecha);
CREATE INDEX idx_ventas_renashop_producto ON ventas_renashop(producto_id);
CREATE INDEX idx_ventas_renashop_metodo ON ventas_renashop(metodo_pago);

-- -----------------------------------------------
-- 3. Productos iniciales de la tienda
-- -----------------------------------------------
INSERT INTO materials (name, description, categoria, cost_soles, stock, min_stock, max_stock, unit, estado) VALUES
  -- Bebidas
  ('Agua mineral 500ml',    'Botella de agua mineral',           'Bebidas', 1.00, 24, 6, 48, 'unidades', 'in_stock'),
  ('Gaseosa personal',      'Gaseosa 500ml varios sabores',      'Bebidas', 2.00, 20, 5, 40, 'unidades', 'in_stock'),
  ('Jugo de caja',          'Jugo en caja 250ml',                'Bebidas', 1.50, 15, 5, 30, 'unidades', 'in_stock'),
  ('Café instantáneo',      'Sobre de café instantáneo',         'Bebidas', 0.50, 30, 10, 60, 'sobres',   'in_stock'),

  -- Snacks
  ('Galletas surtidas',     'Paquete individual de galletas',    'Snacks',  1.00, 20, 5, 40, 'paquetes', 'in_stock'),
  ('Papas fritas',          'Bolsa individual de papas',         'Snacks',  1.50, 15, 5, 30, 'bolsas',   'in_stock'),
  ('Maní salado',           'Bolsa de maní 50g',                 'Snacks',  1.00, 12, 5, 25, 'bolsas',   'in_stock'),

  -- Comida
  ('Sándwich preparado',    'Sándwich mixto fresco',             'Comida',  3.50,  8, 3, 15, 'unidades', 'in_stock'),
  ('Empanada',              'Empanada horneada rellena',         'Comida',  2.50, 10, 3, 20, 'unidades', 'in_stock'),

  -- Dulces
  ('Chocolate barra',       'Barra de chocolate con leche',      'Dulces',  2.00, 15, 5, 30, 'unidades', 'in_stock'),
  ('Caramelos surtidos',    'Bolsa de caramelos variados',       'Dulces',  0.50, 40, 10, 80, 'unidades', 'in_stock'),
  ('Gomitas',               'Bolsa de gomitas 50g',              'Dulces',  1.00, 18, 5, 35, 'bolsas',   'in_stock');
