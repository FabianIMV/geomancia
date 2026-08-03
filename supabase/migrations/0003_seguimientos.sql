-- ==========================================================================
-- Geomancia — seguimientos sobre una tirada ya levantada
--
-- Una consulta guardada dejaba de tener continuidad: se leía el veredicto, se
-- registraba qué pasó, y ahí terminaba. Un seguimiento es una pregunta NUEVA
-- sobre el MISMO escudo ya trazado — no se tira de nuevo, se relee.
--
-- Se guarda como una fila más de `consultas`, con `origen_id` apuntando a la
-- tirada madre y el escudo copiado tal cual. Así cada fila se lee, se verifica,
-- se exporta y se borra con el mismo código que las tiradas originales.
-- ==========================================================================

alter table public.consultas
  add column if not exists origen_id uuid references public.consultas (id) on delete cascade;

comment on column public.consultas.origen_id is
  'Si no es null, esta fila es un seguimiento: una pregunta nueva sobre el escudo ya levantado '
  'en la consulta apuntada. El escudo se copia para que la fila se pueda leer y auditar sola. '
  'Borrar la tirada madre se lleva su hilo entero (on delete cascade).';

-- Para armar el hilo de una tirada sin recorrer la bitácora entera.
create index if not exists consultas_origen_id_idx
  on public.consultas (origen_id)
  where origen_id is not null;

-- No hacen falta políticas nuevas: las cuatro de 0001_consultas.sql se aplican
-- por igual a estas filas, porque siguen atadas a `auth.uid() = user_id`.
