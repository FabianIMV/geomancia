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
  SUPABASE_URL: 'https://cvzcjrhxifecieeefdpq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emNqcmh4aWZlY2llZWVmZHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTUzNDYsImV4cCI6MjEwMDQ5MTM0Nn0.05a_l0G6rx-YbxZElo80k16lYb1YW2L0z7ZngpB1W78',

  /* Sentry (monitoreo de errores) — opcional. Sin DSN no se activa nada.

     El DSN es público por diseño, igual que la clave anónima: solo sirve para
     ENVIAR errores, no para leerlos. Se saca de Sentry → Settings → Projects →
     [tu proyecto] → Client Keys (DSN).

     Antes de salir del navegador, cada evento pasa por un saneado que quita la
     pregunta, la interpretación, las claves, los tokens y los emails. */
  SENTRY_DSN: 'https://543f441eca45c19ed51107d0e0440dce@o4511794110922752.ingest.us.sentry.io/4511794159419392',
  SENTRY_ENTORNO: 'produccion',
};
