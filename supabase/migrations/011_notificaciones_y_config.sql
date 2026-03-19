-- ============================================
-- Configuración clave-valor + notificaciones ERP
-- ============================================

-- Config (cuota alquiler, etc.)
CREATE TABLE IF NOT EXISTS app_config (
  clave text PRIMARY KEY,
  valor text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO app_config (clave, valor) VALUES ('cuota_alquiler', '275')
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_select" ON app_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_config_insert" ON app_config
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "app_config_update" ON app_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Notificaciones generadas por cron (service role) o futuras fuentes
CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('cumpleanos', 'alquiler')),
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  dedupe_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notificaciones_created_at ON notificaciones (created_at DESC);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select" ON notificaciones
  FOR SELECT TO authenticated USING (true);

-- Lecturas por usuario
CREATE TABLE IF NOT EXISTS notificacion_lecturas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notificacion_id uuid NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leida_at timestamptz DEFAULT now(),
  UNIQUE (notificacion_id, user_id)
);

CREATE INDEX idx_nl_user ON notificacion_lecturas (user_id);

ALTER TABLE notificacion_lecturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nl_select_own" ON notificacion_lecturas
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "nl_insert_own" ON notificacion_lecturas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Calendario en zona America/Lima (ISODOW: lunes=1 … domingo=7; jueves=4)
CREATE OR REPLACE FUNCTION public.lima_calendar()
RETURNS TABLE (
  y int,
  m int,
  d int,
  isodow int,
  hr int
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (EXTRACT(YEAR FROM z))::int,
    (EXTRACT(MONTH FROM z))::int,
    (EXTRACT(DAY FROM z))::int,
    (EXTRACT(ISODOW FROM z))::int,
    (EXTRACT(HOUR FROM z))::int
  FROM (SELECT (now() AT TIME ZONE 'America/Lima') AS z) t;
$$;

-- Saldo del mes corriente (misma lógica que getBalanceMensual en el cliente)
CREATE OR REPLACE FUNCTION public.fn_saldo_mes_actual_lima()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH lc AS (
    SELECT * FROM lima_calendar()
  ),
  ym AS (
    SELECT y AS yy, m AS mm FROM lc
  ),
  first_day AS (
    SELECT make_date(yy, mm, 1) AS fd FROM ym
  ),
  last_day AS (
    SELECT (make_date(yy, mm, 1) + interval '1 month - 1 day')::date AS ld FROM ym
  ),
  fondo_anterior AS (
    SELECT COALESCE(
      SUM(CASE WHEN t.tipo = 'entrada' THEN t.monto::numeric ELSE -t.monto::numeric END),
      0
    ) AS v
    FROM transacciones t
    CROSS JOIN first_day f
    WHERE t.fecha < f.fd
  ),
  mes_totals AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.tipo = 'entrada' THEN t.monto::numeric ELSE 0 END), 0) AS ent,
      COALESCE(SUM(CASE WHEN t.tipo = 'salida' THEN t.monto::numeric ELSE 0 END), 0) AS sal
    FROM transacciones t
    CROSS JOIN first_day f
    CROSS JOIN last_day l
    WHERE t.fecha >= f.fd AND t.fecha <= l.ld
  )
  SELECT (SELECT ent FROM mes_totals) + (SELECT v FROM fondo_anterior) - (SELECT sal FROM mes_totals);
$$;

GRANT EXECUTE ON FUNCTION public.lima_calendar() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_saldo_mes_actual_lima() TO authenticated, service_role;
