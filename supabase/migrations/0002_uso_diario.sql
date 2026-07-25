-- ==========================================================================
-- 0002 — Control de uso diario
--
-- Evita que una sesión (propia o ajena) agote la cuota de Gemini con cientos
-- de consultas seguidas. El conteo lo lleva la Edge Function con la clave de
-- servicio; el usuario solo puede LEER su propio uso, nunca escribirlo — si
-- pudiera, el límite no serviría de nada.
-- ==========================================================================

create table if not exists public.uso_diario (
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null default (now() at time zone 'utc')::date,
  consultas int not null default 0,
  primary key (user_id, fecha)
);

alter table public.uso_diario enable row level security;

drop policy if exists "leer el propio uso" on public.uso_diario;
create policy "leer el propio uso"
  on public.uso_diario for select
  using (auth.uid() = user_id);

-- Deliberadamente NO hay políticas de insert/update/delete para usuarios:
-- solo la clave de servicio (que saltea RLS) puede modificar el contador.

-- Suma una consulta al día en curso y devuelve el total ya consumido.
-- SECURITY DEFINER para que corra con los permisos del dueño de la función.
create or replace function public.registrar_consulta(p_user_id uuid, p_limite int)
returns table (permitido boolean, usadas int, limite int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'utc')::date;
  v_usadas int;
begin
  insert into public.uso_diario (user_id, fecha, consultas)
    values (p_user_id, v_hoy, 0)
    on conflict (user_id, fecha) do nothing;

  select consultas into v_usadas
    from public.uso_diario
    where user_id = p_user_id and fecha = v_hoy
    for update;

  if v_usadas >= p_limite then
    return query select false, v_usadas, p_limite;
    return;
  end if;

  update public.uso_diario
    set consultas = consultas + 1
    where user_id = p_user_id and fecha = v_hoy
    returning consultas into v_usadas;

  return query select true, v_usadas, p_limite;
end;
$$;

revoke all on function public.registrar_consulta(uuid, int) from public, anon, authenticated;
