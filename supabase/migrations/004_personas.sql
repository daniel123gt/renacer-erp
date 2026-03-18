-- ============================================
-- Personas / Congregantes — Iglesia Renacer
-- ============================================

CREATE TABLE IF NOT EXISTS personas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  contacto text,
  cumple_dia smallint CHECK (cumple_dia BETWEEN 1 AND 31),
  cumple_mes smallint CHECK (cumple_mes BETWEEN 1 AND 12),
  direccion text,
  distrito text,
  bautizado boolean DEFAULT false,
  activo boolean DEFAULT true,
  notas text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_select" ON personas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "personas_insert" ON personas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "personas_update" ON personas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "personas_delete" ON personas
  FOR DELETE TO authenticated USING (true);

-- Índices
CREATE INDEX idx_personas_nombre ON personas(nombre);
CREATE INDEX idx_personas_activo ON personas(activo);
CREATE INDEX idx_personas_distrito ON personas(distrito);
