-- Logs de envío de emails para notificaciones automáticas.
-- Evita duplicados por dedupe_key + destinatario.

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('cumpleanos', 'alquiler')),
  dedupe_key text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'error')),
  provider text NOT NULL DEFAULT 'resend',
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dedupe_key, to_email)
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_tipo ON email_logs (tipo, created_at DESC);
