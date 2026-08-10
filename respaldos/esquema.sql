


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."registrar_consulta"("p_user_id" "uuid", "p_limite" integer) RETURNS TABLE("permitido" boolean, "usadas" integer, "limite" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."registrar_consulta"("p_user_id" "uuid", "p_limite" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."consultas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "creada_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pregunta" "text" NOT NULL,
    "tema_id" "text" NOT NULL,
    "tema_etiqueta" "text" NOT NULL,
    "casa_tema" integer,
    "madres" "jsonb" NOT NULL,
    "hijas" "jsonb" NOT NULL,
    "sobrinas" "jsonb" NOT NULL,
    "testigo_derecho" "jsonb" NOT NULL,
    "testigo_izquierdo" "jsonb" NOT NULL,
    "juez" "jsonb" NOT NULL,
    "reconciliador" "jsonb" NOT NULL,
    "casas" "jsonb" NOT NULL,
    "interpretacion" "text" NOT NULL,
    "resultado_real" "text",
    "acierto" "text",
    "verificada_en" timestamp with time zone,
    "origen_id" "uuid",
    CONSTRAINT "consultas_acierto_check" CHECK (("acierto" = ANY (ARRAY['acerto'::"text", 'parcial'::"text", 'fallo'::"text", 'sin_verificar'::"text"])))
);


ALTER TABLE "public"."consultas" OWNER TO "postgres";


COMMENT ON COLUMN "public"."consultas"."origen_id" IS 'Si no es null, esta fila es un seguimiento: una pregunta nueva sobre el escudo ya levantado en la consulta apuntada. El escudo se copia para que la fila se pueda leer y auditar sola. Borrar la tirada madre se lleva su hilo entero (on delete cascade).';



CREATE TABLE IF NOT EXISTS "public"."uso_diario" (
    "user_id" "uuid" NOT NULL,
    "fecha" "date" DEFAULT (("now"() AT TIME ZONE 'utc'::"text"))::"date" NOT NULL,
    "consultas" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."uso_diario" OWNER TO "postgres";


ALTER TABLE ONLY "public"."consultas"
    ADD CONSTRAINT "consultas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."uso_diario"
    ADD CONSTRAINT "uso_diario_pkey" PRIMARY KEY ("user_id", "fecha");



CREATE INDEX "consultas_origen_id_idx" ON "public"."consultas" USING "btree" ("origen_id") WHERE ("origen_id" IS NOT NULL);



CREATE INDEX "consultas_user_id_creada_en_idx" ON "public"."consultas" USING "btree" ("user_id", "creada_en" DESC);



ALTER TABLE ONLY "public"."consultas"
    ADD CONSTRAINT "consultas_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "public"."consultas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consultas"
    ADD CONSTRAINT "consultas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uso_diario"
    ADD CONSTRAINT "uso_diario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "actualizar las propias consultas" ON "public"."consultas" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "borrar las propias consultas" ON "public"."consultas" FOR DELETE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."consultas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crear consultas propias" ON "public"."consultas" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "leer el propio uso" ON "public"."uso_diario" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "leer las propias consultas" ON "public"."consultas" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."uso_diario" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."registrar_consulta"("p_user_id" "uuid", "p_limite" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."registrar_consulta"("p_user_id" "uuid", "p_limite" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."consultas" TO "anon";
GRANT ALL ON TABLE "public"."consultas" TO "authenticated";
GRANT ALL ON TABLE "public"."consultas" TO "service_role";



GRANT ALL ON TABLE "public"."uso_diario" TO "anon";
GRANT ALL ON TABLE "public"."uso_diario" TO "authenticated";
GRANT ALL ON TABLE "public"."uso_diario" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































