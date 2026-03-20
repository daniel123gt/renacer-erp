# Notificaciones automáticas (cumpleaños + alquiler)

## Requisitos

1. Aplicar la migración `011_notificaciones_y_config.sql` en el proyecto Supabase (`supabase db push` o SQL Editor).
2. Desplegar las Edge Functions:

```bash
npx supabase functions deploy notify-birthdays
npx supabase functions deploy notify-rent-alert
```

(O desde la raíz del repo: `npm run supabase:deploy:notifications` si está definido en `package.json`.)

## Programación (cron) en Supabase Dashboard

En **Project Settings → Edge Functions → Schedules** (o **Integrations → Cron** según la UI actual):

| Función             | Expresión cron (UTC) | Efecto aproximado (Lima, UTC-5)        |
|---------------------|----------------------|----------------------------------------|
| `notify-birthdays`  | `0 11 * * *`         | Todos los días **06:00** hora Lima     |
| `notify-rent-alert` | `0 * * * *`          | Cada hora en punto UTC; la función crea notificación si en Lima es **jueves desde las 16:00** o **viernes/sábado/domingo** y el saldo del mes &lt; cuota. |

> Perú no usa horario de verano; 11:00 UTC = 06:00 Lima de forma estable.

## Seguridad

- `verify_jwt = false` en `config.toml` para estas funciones: están pensadas para invocación solo por **cron interno de Supabase** (o llamadas con `service_role` en entorno controlado).
- No publiques la URL de la función ni la uses desde el navegador sin protección adicional si te preocupa el abuso (puedes añadir un header secreto comprobado en el código).

## Datos

- **Cuota alquiler:** tabla `app_config`, clave `cuota_alquiler` (editable en **Configuración** del ERP).
- **Saldo:** función SQL `fn_saldo_mes_actual_lima()` (misma lógica que el balance mensual en la app).
- **Notificaciones:** tabla `notificaciones`; lectura por usuario en `notificacion_lecturas`.

## Prueba manual

```bash
curl -i "https://<PROJECT_REF>.supabase.co/functions/v1/notify-birthdays"
curl -i "https://<PROJECT_REF>.supabase.co/functions/v1/notify-rent-alert"
```

(Sin `Authorization` si el proyecto respeta `verify_jwt = false`; en algunos entornos puede requerirse la anon key en el header — consulta la documentación actual de Supabase.)
