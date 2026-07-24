'use strict';

/* ==========================================================================
   CONFIGURACIÓN DE SUPABASE (bitácora privada)

   Completá estos dos valores con los de tu proyecto:
     Supabase → Project Settings → Data API (y API Keys)

   - SUPABASE_URL:      la Project URL, p. ej. https://abcdefgh.supabase.co
   - SUPABASE_ANON_KEY: la clave anon / publishable.

   Estos dos valores son públicos por diseño: están pensados para vivir en el
   código del cliente. Quien protege los datos es Row Level Security (ver
   supabase-schema.sql), que hace que cada usuario solo pueda leer y escribir
   sus propias consultas.

   NUNCA pongas acá la clave service_role ni la contraseña de la base: esas
   saltean RLS por completo y no deben salir del panel de Supabase.

   Si estos valores quedan vacíos, la app funciona igual que siempre, sin
   cuenta ni bitácora.
   ========================================================================== */

window.GEOMANCIA_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
