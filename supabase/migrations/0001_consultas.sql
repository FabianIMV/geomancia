-- ==========================================================================
-- Geomancia — esquema de la bitácora privada
--
-- Ejecutar una sola vez en Supabase: panel del proyecto → SQL Editor → pegar
-- todo esto → Run.
--
-- La privacidad la garantiza Row Level Security (RLS): cada fila queda atada
-- al usuario que la creó, y las políticas de abajo hacen que un usuario solo
-- pueda ver y modificar SUS propias consultas. Aunque la clave anónima del
-- cliente es pública por diseño, sin una sesión válida no se puede leer nada.
-- ==========================================================================

create table if not exists public.consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  creada_en timestamptz not null default now(),

  -- La consulta
  pregunta text not null,
  tema_id text not null,
  tema_etiqueta text not null,
  casa_tema int,

  -- La tirada completa, para poder auditarla después.
  -- Cada figura se guarda como su patrón de 4 valores, p. ej. [1,2,2,1].
  madres jsonb not null,
  hijas jsonb not null,
  sobrinas jsonb not null,
  testigo_derecho jsonb not null,
  testigo_izquierdo jsonb not null,
  juez jsonb not null,
  reconciliador jsonb not null,
  casas jsonb not null,

  interpretacion text not null,

  -- Verificación posterior: qué pasó realmente. Es lo que hace medible el acierto.
  resultado_real text,
  acierto text check (acierto in ('acerto', 'parcial', 'fallo', 'sin_verificar')),
  verificada_en timestamptz
);

-- Índice para listar la bitácora de cada usuario de lo más nuevo a lo más viejo.
create index if not exists consultas_user_id_creada_en_idx
  on public.consultas (user_id, creada_en desc);

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------

alter table public.consultas enable row level security;

drop policy if exists "leer las propias consultas" on public.consultas;
create policy "leer las propias consultas"
  on public.consultas for select
  using (auth.uid() = user_id);

drop policy if exists "crear consultas propias" on public.consultas;
create policy "crear consultas propias"
  on public.consultas for insert
  with check (auth.uid() = user_id);

drop policy if exists "actualizar las propias consultas" on public.consultas;
create policy "actualizar las propias consultas"
  on public.consultas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "borrar las propias consultas" on public.consultas;
create policy "borrar las propias consultas"
  on public.consultas for delete
  using (auth.uid() = user_id);
