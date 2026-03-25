# Notificaciones automáticas (cumpleaños + alquiler)

## Requisitos

1. Aplicar las migraciones de notificaciones en el proyecto Supabase (`supabase db push` o SQL Editor), incluyendo `011_notificaciones_y_config.sql` y `017_fn_salida_alquiler_semana_lima.sql`.
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
| `notify-birthdays`  | `0 11 * * *`         | Todos los días **06:00** hora Lima; envía aviso de cumpleaños de **hoy** y recordatorio de **mañana** |
| `notify-rent-alert` | `0 * * * *`          | La función corre cada hora pero **solo envía** en franjas Lima: jueves **20:00**, viernes/sábado/domingo **06:00 y 20:00**, si saldo del mes &lt; cuota **y** no hay ya una **salida** en finanzas con categoría **Alquiler** en la **semana en curso** (lunes–domingo, fecha Lima). |

> Perú no usa horario de verano; 11:00 UTC = 06:00 Lima de forma estable.

## Seguridad

- `verify_jwt = false` en `config.toml` para estas funciones: están pensadas para invocación solo por **cron interno de Supabase** (o llamadas con `service_role` en entorno controlado).
- No publiques la URL de la función ni la uses desde el navegador sin protección adicional si te preocupa el abuso (puedes añadir un header secreto comprobado en el código).

## Email con Resend (opcional, recomendado)

Si defines estos secrets en Supabase, además de la notificación interna se enviará email automático a los usuarios con correo confirmado:

- `RESEND_API_KEY`
- `RESEND_FROM` (ej. `alertas@tu-dominio.com`)

**Plantilla de cumpleaños en Resend (opcional):**

- `RESEND_BIRTHDAY_TEMPLATE_ID`: ID o **alias** de la plantilla **publicada** en el dashboard de Resend. Si está definido, `notify-birthdays` envía con `template` + variables y **no** usa el HTML mínimo interno.
- Variables que debe tener la plantilla (mismos nombres que en el editor): `TITULO`, `MENSAJE`, `FECHA_LIMA`, `APP_NAME`.
- `FECHA_LIMA` es la fecha del cumpleaños objetivo en español (ej. `24 de marzo de 2026`), según el bucket (hoy o mañana).
- `APP_NAME` por defecto en código es `Renacer ERP`; puedes sobreescribirlo con el secret `APP_NAME_EMAIL` si lo necesitas.

Se registra deduplicación por destinatario en `email_logs` con `dedupe_key`.

## Datos

- **Cuota alquiler:** tabla `app_config`, clave `cuota_alquiler` (editable en **Configuración** del ERP).
- **Saldo:** función SQL `fn_saldo_mes_actual_lima()` (misma lógica que el balance mensual en la app).
- **Excepción alquiler:** función `fn_hay_salida_alquiler_semana_actual_lima()` — si devuelve `true`, no se crea notificación ni email de cuota esa semana.
- **Notificaciones:** tabla `notificaciones`; lectura por usuario en `notificacion_lecturas`.

## Prueba manual

```bash
curl -i "https://<PROJECT_REF>.supabase.co/functions/v1/notify-birthdays"
curl -i "https://<PROJECT_REF>.supabase.co/functions/v1/notify-rent-alert"
```

## Web Push (PWA) - Prueba rápida

1. Genera llaves VAPID (en tu PC):

```bash
npx web-push generate-vapid-keys --json
```

2. Secrets en Supabase (**Project Settings → Edge Functions → Secrets**):

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (ej. `mailto:admin@renacer.local`)

3. En el frontend define `VITE_VAPID_PUBLIC_KEY` (Vercel env var) con el mismo valor de `VAPID_PUBLIC_KEY`.

4. Despliega la función de prueba:

```bash
npx supabase functions deploy send-web-push-test
```

5. En la app, abre la campanita → botón **“Activar Web Push (prueba)”** (esto guarda la suscripción en `push_subscriptions`).

6. Lanza un push de prueba:

```bash
curl -i "https://<PROJECT_REF>.supabase.co/functions/v1/send-web-push-test" \
  -H "Content-Type: application/json" \
  -d '{"title":"Renacer","body":"Hola desde Web Push","url":"/"}'
```

(Sin `Authorization` si el proyecto respeta `verify_jwt = false`; en algunos entornos puede requerirse la anon key en el header — consulta la documentación actual de Supabase.)
