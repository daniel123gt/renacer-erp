-- Si en la semana en curso (lunes–domingo, hora Lima) hay al menos una salida
-- categorizada como Alquiler, la Edge Function notify-rent-alert no debe enviar alerta.

CREATE OR REPLACE FUNCTION public.fn_hay_salida_alquiler_semana_actual_lima()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH lc AS (
    SELECT * FROM lima_calendar()
  ),
  lima_d AS (
    SELECT make_date(lc.y, lc.m, lc.d) AS d FROM lc
  ),
  bounds AS (
    SELECT
      (d - (extract(isodow FROM d)::int - 1) * interval '1 day')::date AS mon,
      (d - (extract(isodow FROM d)::int - 1) * interval '1 day' + interval '6 days')::date AS sun
    FROM lima_d
  )
  SELECT EXISTS (
    SELECT 1
    FROM transacciones t
    INNER JOIN categorias_finanzas c ON c.id = t.categoria_id
    CROSS JOIN bounds b
    WHERE t.tipo = 'salida'
      AND c.tipo = 'salida'
      AND lower(trim(c.nombre)) = 'alquiler'
      AND t.fecha >= b.mon
      AND t.fecha <= b.sun
  );
$$;

GRANT EXECUTE ON FUNCTION public.fn_hay_salida_alquiler_semana_actual_lima() TO authenticated, service_role;
