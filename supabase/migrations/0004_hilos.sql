-- ==========================================================================
-- Geomancia — el hilo pasa a ser de tiradas nuevas, no de relecturas
--
-- 0003 introdujo `origen_id` con la idea de releer un escudo ya levantado con
-- otra pregunta. No era lo que hacía falta: un asunto que se sigue en el tiempo
-- pide una tirada NUEVA cada vez, y lo que se hereda es el conocimiento de las
-- consultas anteriores, que viaja en el prompt de la interpretación.
--
-- El esquema no cambia —cada fila ya guarda su propio escudo—, solo la
-- semántica de la columna. Se deja escrito para que la base no mienta.
-- ==========================================================================

comment on column public.consultas.origen_id is
  'Si no es null, esta consulta continúa el asunto de la consulta apuntada: es una tirada '
  'propia y distinta, levantada más tarde, cuya interpretación se pidió con las consultas '
  'anteriores del hilo a la vista. El hilo es plano: los pasos apuntan siempre a la raíz. '
  'Borrar la raíz se lleva el hilo entero (on delete cascade).';
