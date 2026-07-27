SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 2YTzSSg9VFfaWsYnUPvkLmwFYxP2QSSqUaKwATtiwZKdfSZxIRNDbcAR6fKfEqH

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '4b455333-26d4-486a-9281-9dda59d1e695', 'authenticated', 'authenticated', 'fabianignaciomv@gmail.com', '$2a$10$TyRkEQASqXmydOcEXq89u.URBea2NccvK.7d1NZeGxIgUoNPpw3Vi', '2026-07-24 21:16:54.459058+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-07-25 02:18:27.551066+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "4b455333-26d4-486a-9281-9dda59d1e695", "email": "fabianignaciomv@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-07-24 21:16:54.439366+00', '2026-07-26 03:51:18.031216+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('4b455333-26d4-486a-9281-9dda59d1e695', '4b455333-26d4-486a-9281-9dda59d1e695', '{"sub": "4b455333-26d4-486a-9281-9dda59d1e695", "email": "fabianignaciomv@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-07-24 21:16:54.453368+00', '2026-07-24 21:16:54.453442+00', '2026-07-24 21:16:54.453442+00', 'f66a62a3-26e3-4cf6-a170-f912e3b92eb5');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('0b8bc6e3-ceb6-452a-95ea-37941a9d8242', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:16:54.465502+00', '2026-07-24 21:16:54.465502+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('88d0d73c-847e-43ce-964d-cb7d83e9cc8e', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:17:01.578144+00', '2026-07-24 21:17:01.578144+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('6e5911e3-17e1-4aae-9ee1-78cf76b94fbe', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:17:06.610988+00', '2026-07-24 21:17:06.610988+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('61585f1c-4326-4ba8-aa81-0e99723adc59', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:17:09.83637+00', '2026-07-24 21:17:09.83637+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('ec4bfad2-d021-4476-9753-748b1223cf83', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:17:10.820533+00', '2026-07-24 21:17:10.820533+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('99fd0697-ef55-4deb-aab7-58f6893ccfd3', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:25:27.158695+00', '2026-07-24 21:25:27.158695+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('f4b5c1a3-0a94-4d9c-abc3-f2126205c1fd', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:37:39.384861+00', '2026-07-24 21:37:39.384861+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('6acc64ca-bc48-438f-98fc-02f55ee440ed', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:38:11.811178+00', '2026-07-24 21:38:11.811178+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('f18914e0-af81-477b-a6b9-c5ac6c182bd0', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 22:45:49.911257+00', '2026-07-24 22:45:49.911257+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.107.196.247', NULL, NULL, NULL, NULL, NULL),
	('7a3a724c-ac47-498f-9ea1-07f46b103a13', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 01:35:29.49979+00', '2026-07-25 01:35:29.49979+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1', '186.189.104.172', NULL, NULL, NULL, NULL, NULL),
	('beb28c74-7dcb-49c8-934b-0ee558d06b0f', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 02:18:27.551882+00', '2026-07-26 03:51:18.053823+00', NULL, 'aal1', NULL, '2026-07-26 03:51:18.053702', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1', '186.189.78.168', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('0b8bc6e3-ceb6-452a-95ea-37941a9d8242', '2026-07-24 21:16:54.473727+00', '2026-07-24 21:16:54.473727+00', 'password', '7fd53388-f1db-46ec-8613-66987da8b78d'),
	('88d0d73c-847e-43ce-964d-cb7d83e9cc8e', '2026-07-24 21:17:01.581747+00', '2026-07-24 21:17:01.581747+00', 'password', '7f4fce1f-fc4c-405d-b1ab-205371e65a5d'),
	('6e5911e3-17e1-4aae-9ee1-78cf76b94fbe', '2026-07-24 21:17:06.614651+00', '2026-07-24 21:17:06.614651+00', 'password', '59cf7110-e6ee-4ee8-88f1-7500795a459f'),
	('61585f1c-4326-4ba8-aa81-0e99723adc59', '2026-07-24 21:17:09.840908+00', '2026-07-24 21:17:09.840908+00', 'password', '200e44b6-42f6-4702-b64b-086ddf9ac598'),
	('ec4bfad2-d021-4476-9753-748b1223cf83', '2026-07-24 21:17:10.824202+00', '2026-07-24 21:17:10.824202+00', 'password', '22dcdc29-184f-4689-8b62-4a1484fc67f2'),
	('99fd0697-ef55-4deb-aab7-58f6893ccfd3', '2026-07-24 21:25:27.190189+00', '2026-07-24 21:25:27.190189+00', 'password', '9678ffe5-1e20-467c-97fe-c4663f8946cd'),
	('f4b5c1a3-0a94-4d9c-abc3-f2126205c1fd', '2026-07-24 21:37:39.408095+00', '2026-07-24 21:37:39.408095+00', 'password', '42dfcd35-ad57-406c-b3e2-11c66e395360'),
	('6acc64ca-bc48-438f-98fc-02f55ee440ed', '2026-07-24 21:38:11.816065+00', '2026-07-24 21:38:11.816065+00', 'password', '1e84287e-7839-4918-8297-4d29805b535b'),
	('f18914e0-af81-477b-a6b9-c5ac6c182bd0', '2026-07-24 22:45:49.969638+00', '2026-07-24 22:45:49.969638+00', 'password', 'cd6c4812-dcc8-4c8d-b208-16be84820a5f'),
	('7a3a724c-ac47-498f-9ea1-07f46b103a13', '2026-07-25 01:35:29.562685+00', '2026-07-25 01:35:29.562685+00', 'password', '501aa860-795d-4f29-80bf-732704cb41ca'),
	('beb28c74-7dcb-49c8-934b-0ee558d06b0f', '2026-07-25 02:18:27.588433+00', '2026-07-25 02:18:27.588433+00', 'password', '814f80c5-26d7-45f0-89d6-e58958550c0c');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 2, 'n7xvfgjev3kd', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:16:54.469341+00', '2026-07-24 21:16:54.469341+00', NULL, '0b8bc6e3-ceb6-452a-95ea-37941a9d8242'),
	('00000000-0000-0000-0000-000000000000', 3, 'wjcwsgplzecs', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:17:01.579834+00', '2026-07-24 21:17:01.579834+00', NULL, '88d0d73c-847e-43ce-964d-cb7d83e9cc8e'),
	('00000000-0000-0000-0000-000000000000', 4, '2q3zbzbcic47', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:17:06.612847+00', '2026-07-24 21:17:06.612847+00', NULL, '6e5911e3-17e1-4aae-9ee1-78cf76b94fbe'),
	('00000000-0000-0000-0000-000000000000', 5, '7blx3cgviuvy', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:17:09.838502+00', '2026-07-24 21:17:09.838502+00', NULL, '61585f1c-4326-4ba8-aa81-0e99723adc59'),
	('00000000-0000-0000-0000-000000000000', 6, 'wkept4c6n3pb', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:17:10.822076+00', '2026-07-24 21:17:10.822076+00', NULL, 'ec4bfad2-d021-4476-9753-748b1223cf83'),
	('00000000-0000-0000-0000-000000000000', 7, 'wql3s5rruuxb', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:25:27.182083+00', '2026-07-24 21:25:27.182083+00', NULL, '99fd0697-ef55-4deb-aab7-58f6893ccfd3'),
	('00000000-0000-0000-0000-000000000000', 8, 'gcgb32zydg5d', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:37:39.399989+00', '2026-07-24 21:37:39.399989+00', NULL, 'f4b5c1a3-0a94-4d9c-abc3-f2126205c1fd'),
	('00000000-0000-0000-0000-000000000000', 9, 'c7ulxx5gvmxy', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 21:38:11.813519+00', '2026-07-24 21:38:11.813519+00', NULL, '6acc64ca-bc48-438f-98fc-02f55ee440ed'),
	('00000000-0000-0000-0000-000000000000', 10, '6sucwrhe3ef6', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-24 22:45:49.942406+00', '2026-07-24 22:45:49.942406+00', NULL, 'f18914e0-af81-477b-a6b9-c5ac6c182bd0'),
	('00000000-0000-0000-0000-000000000000', 11, '6nv4jg3u6j4f', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-25 01:35:29.533462+00', '2026-07-25 01:35:29.533462+00', NULL, '7a3a724c-ac47-498f-9ea1-07f46b103a13'),
	('00000000-0000-0000-0000-000000000000', 12, 'o243zsomv3pj', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-25 02:18:27.576303+00', '2026-07-25 03:16:51.776861+00', NULL, 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 13, '2hzlyqkxkal2', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-25 03:16:51.786462+00', '2026-07-25 05:23:47.775476+00', 'o243zsomv3pj', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 14, '7ldtuutldneb', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-25 05:23:47.788565+00', '2026-07-26 03:51:17.9917+00', '2hzlyqkxkal2', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 15, '5y54wr6ytwdw', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-07-26 03:51:18.018255+00', '2026-07-26 03:51:18.018255+00', '7ldtuutldneb', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: consultas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."consultas" ("id", "user_id", "creada_en", "pregunta", "tema_id", "tema_etiqueta", "casa_tema", "madres", "hijas", "sobrinas", "testigo_derecho", "testigo_izquierdo", "juez", "reconciliador", "casas", "interpretacion", "resultado_real", "acierto", "verificada_en") VALUES
	('06a5a8c2-b5bc-4a88-a70a-bff73c39387a', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-24 21:39:10.65812+00', 'que piensan de mi mis jefes y compañeros ee equipo', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 2], [1, 1, 2, 1], [1, 1, 1, 2], [2, 1, 1, 2]]', '[[2, 1, 1, 2], [2, 1, 1, 1], [2, 2, 1, 1], [2, 1, 2, 2]]', '[[1, 1, 2, 1], [1, 2, 2, 2], [2, 2, 2, 1], [2, 1, 1, 1]]', '[2, 1, 2, 1]', '[2, 1, 1, 2]', '[2, 2, 1, 1]', '[2, 2, 1, 1]', '[[2, 2, 2, 2], [1, 1, 2, 1], [1, 1, 1, 2], [2, 1, 1, 2], [2, 1, 1, 2], [2, 1, 1, 1], [2, 2, 1, 1], [2, 1, 2, 2], [1, 1, 2, 1], [1, 2, 2, 2], [2, 2, 2, 1], [2, 1, 1, 1]]', '### Veredicto del Juez
El veredicto es un **sí matizado**. La presencia de **Laetitia** como Juez sentencia una percepción general favorable, con disposición al reconocimiento y un fondo de concordia hacia ti en tu ámbito laboral. Sin embargo, no se trata de una apreciación homogénea: está condicionada por matices de desgaste de rendimiento y tensiones específicas en el entorno.

---

### El camino hacia la sentencia (Los Testigos)
* **Testigo Derecho (**Puer**)**: Muestra la raíz del asunto y la actitud de partida del consultante. Indica que se te percibe —o te has mostrado— con una energía directa, combativa e impulsiva, aportando iniciativa pero corriendo el riesgo de parecer precipitado.
* **Testigo Izquierdo (**Fortuna Minor**)**: Muestra la respuesta del entorno y el desenlace inmediato. Indica que la contraparte reconoce tu capacidad y tu valía de forma rápida y visible, aunque dicha estimación tiende a depender del éxito del momento y favorece lo inmediato sobre lo sostenido.

---

### Detalle de la casa del tema (Casa 10: Carrera y Jefes)
En la Casa 10 se ubica **Amissio**, figura que además **se repite** como Sobrina 2. Esta repetición acentúa el diagnóstico: tus jefes no te perciben con hostilidad, sino que ven un desgaste, una pérdida de enfoque o la sensación de que entregas más energía de la que logras consolidar en resultados permanentes. Perciben que hay recursos o atenciones que se te escapan.

Adicionalmente, al observar la Casa 11 (compañeros y redes), la presencia de **Cauda Draconis** (que también aparece como Sobrina 3) advierte de roces, desconfianzas o alianzas desgastadas dentro del equipo de pares.

---

### Estado del consultante (Casa 1)
En la Casa 1 se encuentra **Populus**, la **misma figura** que la Madre 1. Esta coincidencia señala que tu estado actual está altamente influenciado por el entorno, actuando como un espejo de la marea de opiniones del grupo y mostrándote fluctuante o excesivamente permeable a lo que piensen los demás.

---

### El Reconciliador
El **Reconciliador** resulta ser **Laetitia**. Al coincidir exactamente con la figura del Juez, esta duplicación **recalca e insiste** en que la inclinación final del asunto es positiva, disolviendo la dispersión de **Amissio** y la fricción de **Cauda Draconis** en favor de una imagen armónica.

---

### Condición y consejo accionable
Dado que la consulta indaga sobre la percepción de terceros, el juicio debe reencuadrase hacia lo que puedes controlar: canaliza la fuerza de inicio que muestra **Puer** para corregir las fugas de efectividad que señala **Amissio** en tu Casa 10, asegurando cierres concretos en tus tareas y marcando distancia de las tensiones con compañeros de equipo señaladas en la Casa 11.

---

### Síntesis
Tus jefes te aprecian favorablemente pero perciben cierta dispersión en tus entregas, mientras que la impresión general de tu entorno es positiva si logras consolidar tus resultados y mantenerte al margen de tensiones con el equipo.', NULL, 'sin_verificar', NULL),
	('5ded23c2-ea73-4427-a37b-e979e6ba1d3f', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 03:00:34.972106+00', 'en que trabajare en 10 años mas, en que rubro? seguire en informatica? que se ve en mi camino', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 2], [1, 1, 1, 1], [2, 1, 2, 2], [1, 2, 2, 1]]', '[[2, 1, 2, 1], [2, 1, 1, 2], [2, 1, 2, 2], [2, 1, 2, 1]]', '[[1, 1, 1, 1], [1, 1, 2, 1], [2, 2, 1, 1], [2, 2, 2, 1]]', '[2, 2, 1, 2]', '[2, 2, 1, 2]', '[2, 2, 2, 2]', '[2, 2, 2, 2]', '[[2, 2, 2, 2], [1, 1, 1, 1], [2, 1, 2, 2], [1, 2, 2, 1], [2, 1, 2, 1], [2, 1, 1, 2], [2, 1, 2, 2], [2, 1, 2, 1], [1, 1, 1, 1], [1, 1, 2, 1], [2, 2, 1, 1], [2, 2, 2, 1]]', '*Nota preliminar:* La geomancia clásica de este sistema no calcula fechas ni plazos exactos; por tanto, no determina un calendario a diez años vista, sino que juzga la tendencia, la condición actual y la naturaleza del asunto consultado.

*   **Veredicto del Juez:** El Juez es **Populus**. Su veredicto es neutro y refleja colectividad, fluctuación y dependencia del entorno o de corrientes masivas. No ofrece un sí rotundo ni un no categórico, sino un estado de tránsito donde el resultado depende de la adaptación a los grupos o estructuras sociales predominantes, sin aportar una estabilidad fija por sí mismo.
*   **Camino (Testigos):** Ambos Testigos muestran **Carcer**. Esto es altamente significativo al repetirse la misma figura en ambas posiciones: insiste en rigidez, limitación, confinamiento o estructuras cerradas que pesan fuertemente sobre el camino del asunto. El Testigo Derecho (el pasado y la base del consultante) y el Testigo Izquierdo (el desenlace y el otro lado) convergen en la misma restricción, señalando que el proceso está sujeto a contención, marcos estrictos o la sensación de estar atado a un entorno laboral o mental del cual cuesta salir.
*   **Detalle de la casa del tema (Casa 10):** En la casa de la carrera y la reputación se encuentra **Coniunctio**. Esta figura indica combinación, alianzas, mezcla de disciplinas o trabajo en red. Respecto a la pregunta de si seguirá en informática, **Coniunctio** apunta a la integración de sistemas, la unión de diferentes áreas o la colaboración técnica, sugiriendo que la continuidad en el rubro no se dará de forma aislada, sino mediante la fusión de la tecnología con otras disciplinas, contratos o redes de colaboración.
*   **Estado del consultante (Casa 1):** En la casa 1 se encuentra **Populus**, lo que refleja a un consultante influenciado por las circunstancias colectivas, el entorno general o la corriente del lugar, mostrando adaptabilidad pero también falta de iniciativa propia individual, dejándose llevar por el fluir de la masa o de las condiciones externas.
*   **Reconciliador:** El Reconciliador es **Populus**. Al coincidir exactamente con la figura del Juez y de la casa 1, refuerza el tono general de la tirada: el desenlace y la integración del consultante con el resultado se apoyan en la misma naturaleza mutable y colectiva, cerrando el ciclo con la necesidad de amoldarse al flujo del entorno sin imponer una voluntad férrea.
*   **Sobrinas y Madres:** Cabe destacar la fuerte presencia de **Via** en la Madre 2 y la Sobrina 1, lo que subraya el tránsito, el movimiento y los caminos alternativos en el desarrollo del asunto. Asimismo, **Puer** se repite entre las Hijas (Hija 1 e Hija 4) y la casa 8, introduciendo impulsividad, energía marcial o riesgos latentes que contrastan con la rigidez de los Testigos.
*   **Condición o consejo accionable:** La continuidad en el rubro informático o la dirección profesional a largo plazo está condicionada por la capacidad de establecer alianzas estratégicas y adaptarse a los cambios estructurales. Se aconseja observar las propias limitaciones institucionales o mentales y buscar la integración de habilidades en lugar de la rigidez.
*   **Síntesis:** El asunto de la carrera se inclina hacia una dinámica de colaboración y adaptación a los cambios colectivos, condicionado por fuertes restricciones estructurales que exigen flexibilidad dentro de entornos cerrados o normados.', NULL, 'sin_verificar', NULL),
	('41da33a4-3ace-4acb-8f5c-529876b2ab9a', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 03:01:52.796921+00', 'se me ve ascendiendo  a algo mas que SRE en mi carrera el año 2028?', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2], [2, 1, 2, 2]]', '[[2, 1, 2, 2], [2, 2, 1, 1], [2, 1, 1, 2], [1, 2, 2, 2]]', '[[1, 2, 1, 1], [2, 2, 1, 2], [2, 1, 1, 1], [1, 1, 1, 2]]', '[1, 2, 2, 1]', '[1, 2, 2, 1]', '[2, 2, 2, 2]', '[2, 2, 2, 1]', '[[2, 2, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2], [2, 1, 2, 2], [2, 1, 2, 2], [2, 2, 1, 1], [2, 1, 1, 2], [1, 2, 2, 2], [1, 2, 1, 1], [2, 2, 1, 2], [2, 1, 1, 1], [1, 1, 1, 2]]', 'Respecto al plazo consultado, la geomancia clásica no calcula fechas exactas ni calendarios como el año 2028; su función es dictaminar la tendencia y las condiciones estructurales del asunto.

### 1. Veredicto del Juez
El Juez es **Populus**. Esta figura es neutra y dependiente del entorno: refleja a la multitud, la permanencia en la masa y la falta de diferenciación individual. No otorga el impulso ni el relieve necesarios para destacar o ser elevado por encima del estado actual. El veredicto es un **no matizado** respecto al ascenso dentro de la estructura evaluada.

### 2. El camino hacia la sentencia (Los Testigos)
Tanto el **Testigo Derecho** como el **Testigo Izquierdo** presentan la misma figura: **Fortuna Major**.
La repetición exacta de **Fortuna Major** en ambos lados del camino es de gran relevancia: sostiene que existen méritos reales, capacidad técnica y una base sólida tanto en la preparación previa (Testigo Derecho) como en el desarrollo del esfuerzo (Testigo Izquierdo). Sin embargo, esta solidez personal no logra romper la inercia del entorno colectivo que señala el Juez **Populus**.

### 3. Detalle de la casa del tema (Casa 10)
En la **Casa 10** (carrera, jerarquía y ascenso) se sitúa **Carcer**. Esta figura indica encierro, contención, límites rígidos y falta de movilidad. Su presencia en la posición del tema dictamina un bloqueo institucional o corporativo que impide escalar a un rango superior. Esta limitación se ve acentuada al repetirse **Carcer** en la posición de la **Sobrina 2**, reforzando la presencia de una barrera administrativa o jerárquica firme.

### 4. Estado del consultante (Casa 1)
La **Casa 1** muestra a **Cauda Draconis**. Esta figura señala un punto de partida marcado por el desgaste, la necesidad de soltar o una posición de desventaja en la base. Al figurar también como **Madre 1**, confirma que la situación de origen en la que se fundamenta la consulta padece de un lastre que frena la expansión.

### 5. El Reconciliador
El **Reconciliador** es **Cauda Draconis** (resultado de la interacción entre el Juez **Populus** y la **Casa 1** **Cauda Draconis**).
La reaparición de **Cauda Draconis** por tercera vez en la tirada insiste de manera determinante en que la resolución final no proviene de la obtención de un cargo más alto dentro de este marco, sino de la finalización de un ciclo o la purga de las condiciones actuales.

### 6. Condición y consejo accionable
Aunque **Acquisitio** en la **Casa 11** (redes y apoyos) y **Fortuna Minor** en la **Casa 7** muestran que existen contactos favorables y oportunidades dinámicas a su alrededor, el obstáculo principal de **Carcer** en la **Casa 10** no cederá bajo la estructura presente. El camino accionable no consiste en forzar la promoción en este entorno, sino en preparar el terreno para cortar con la inercia actual (**Cauda Draconis**) y buscar la proyección en un marco distinto.

### 7. Síntesis en una frase
El mérito personal es sólido, pero la estructura actual se mantendrá cerrada al ascenso, exigiendo un cambio de ciclo antes que una promoción interna.', NULL, 'sin_verificar', NULL),
	('ba4a0386-88de-49d5-acf6-4b1431560bd4', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 03:09:59.181549+00', 'se me ve ascendiendo a algo mas que SRE en mi carrera el año 2028 si me cambio de empresa', 'trabajo', 'Trabajo / carrera', 10, '[[1, 2, 2, 1], [1, 2, 1, 2], [2, 2, 2, 2], [2, 1, 2, 2]]', '[[1, 1, 2, 2], [2, 2, 2, 1], [2, 1, 2, 2], [1, 2, 2, 2]]', '[[2, 2, 1, 1], [2, 1, 2, 2], [1, 1, 2, 1], [1, 1, 2, 2]]', '[2, 1, 1, 1]', '[2, 2, 2, 1]', '[2, 1, 1, 2]', '[1, 1, 1, 1]', '[[1, 2, 2, 1], [1, 2, 1, 2], [2, 2, 2, 2], [2, 1, 2, 2], [1, 1, 2, 2], [2, 2, 2, 1], [2, 1, 2, 2], [1, 2, 2, 2], [2, 2, 1, 1], [2, 1, 2, 2], [1, 1, 2, 1], [1, 1, 2, 2]]', '**Aclaración sobre el plazo (2028):** La geomancia clásica de este sistema no calcula fechas, meses ni plazos específicos en el calendario. El oráculo juzga la tendencia estructural y la condición bajo la cual el asunto se resuelve o se bloquea.

---

### Veredicto del Juez
**Veredicto: Sí condicionado.**
El Juez de la tirada es **Fortuna Minor**. Esta figura indica un éxito rápido, una apertura o un ascenso de carácter secundario o volátil, que depende del impulso externo y de la agilidad más que de una estructura permanente preexistente. Muestra que la oportunidad de ascender más allá de un rol de SRE al cambiar de empresa se presenta, pero la posición obtenida requerirá un esfuerzo constante para sostenerse y no desplomarse tras el impulso inicial.

---

### El camino hacia la sentencia (Los Testigos)
* **Testigo Derecho (El consultante / El punto de partida):** **Acquisitio**. Muestra un estado de acumulación, ganancia de experiencia y capacidad consolidada en tu trayectoria previa. Partes de una posición de valor real y habilidades capitalizadas.
* **Testigo Izquierdo (El entorno / El desenlace del cambio):** **Cauda Draconis**. Contradice la bonanza de la partida. Indica que el terreno de llegada o el cambio de empresa trae consigo un desecho, un entorno con vicios ocultos, mala gestión o compromisos que se degradan. 

*Nota de repetición:* **Cauda Draconis** no solo es el Testigo Izquierdo, sino que aparece también en la Hija 2 y en la **Casa 6** (trabajo cotidiano). Esta insistencia refuerza que el peligro principal no está en tu capacidad, sino en las condiciones operativas reales y cotidianas del nuevo empleo.

---

### Detalle de la casa del tema (Casa 10: Carrera y ascenso)
En la **Casa 10** se ubica **Albus**. Esta figura favorece la autoridad basada en la inteligencia, el análisis claro, la estrategia y la reputación técnica bien fundamentada. Indica que el ascenso efectivo hacia roles de mayor jerarquía (como arquitectura, dirección técnica o gestión) exige que el movimiento se sustente en la claridad conceptual y acuerdos por escrito impecables.

*Nota de repetición:* **Albus** se repite de forma masiva en la tirada: Madre 4, Hija 3, Sobrina 2, Casa 4, Casa 7 y **Casa 10**. Esta omnipresencia exige frialdad intelectual, estudio riguroso de las ofertas y negociación transparente. La mente y la diplomacia lógica deben dominar la decisión.

Asimismo, cabe señalar que las figuras desfavorables **Tristitia** (que se repite en Hija 1, Sobrina 4, Casa 5 y Casa 12) y **Cauda Draconis** señalan fricciones en la ejecución y la presencia de bloqueos o frustraciones si la transición se hace a ciegas.

---

### Estado del consultante (Casa 1)
En la **Casa 1** figura **Fortuna Major**. Tu estado actual es de gran solidez, protección y recursos propios. No estás en una posición de debilidad ni necesitas desesperadamente dar un salto a ciegas. Tu valor profesional actual es firme y te da el control para exigir condiciones claras antes de actuar.

---

### El Reconciliador
El Reconciliador es **Via**. Esta figura de tránsito y movimiento muestra cómo el desenlace impacta tu situación: el cambio de empresa abre un camino de marcha continua. No llegarás a una posición estática de descanso, sino a una vía dinámica donde tendrás que adaptarte sobre la marcha para esquivar los escollos que marca **Cauda Draconis**.

---

### Condición y consejo accionable
1. **Evalúa la oferta con rigor analítico:** Dado que **Albus** domina la Casa 10 y la Casa 4 (el final del asunto), no te muevas por promesas verbales o títulos ostentosos. Exige contratos, descripción clara de responsabilidades y alcance del rol por escrito.
2. **Audita el lugar de llegada:** Con **Cauda Draconis** en el Testigo Izquierdo y la Casa 6, investiga la cultura interna, la rotación de personal y el estado técnico de la empresa de destino antes de firmar; hay riesgo de heredar deudas técnicas o dinámicas de trabajo tóxicas.
3. **Aprovecha tu fuerza actual:** Al tener **Fortuna Major** en Casa 1 y **Acquisitio** en el Testigo Derecho, negocia desde una postura de fuerza, sin prisa e imponiendo tus condiciones.

*Aviso:* La geomancia juzga la tendencia simbólica de la tirada; para decisiones contractuales o financieras de envergadura, respalda siempre este juicio con una evaluación profesional y legal de las ofertas laborales.

---

### Síntesis en una frase
El ascenso más allá de SRE es viable mediante un cambio de empresa (**Fortuna Minor**), pero solo si negocias con extrema claridad intelectual (**Albus**) y filtras rigurosamente los vicios ocultos de la nueva organización (**Cauda Draconis**).', NULL, 'sin_verificar', NULL),
	('15893a9b-cb41-4eee-9e3c-2b091bd58e6c', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 03:20:17.895085+00', 'que deberia hacer o como deberia presentarme si quiero ascender de mi cargo SRE en falabella? ya q la estructura es tan rigida aca?', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 1], [1, 2, 1, 1], [1, 2, 2, 2], [2, 2, 1, 1]]', '[[2, 1, 1, 2], [2, 2, 2, 2], [2, 1, 2, 1], [1, 1, 2, 1]]', '[[1, 2, 1, 2], [1, 2, 1, 1], [2, 1, 1, 2], [1, 2, 2, 2]]', '[2, 2, 2, 1]', '[1, 1, 1, 2]', '[1, 1, 1, 1]', '[1, 1, 1, 2]', '[[2, 2, 2, 1], [1, 2, 1, 1], [1, 2, 2, 2], [2, 2, 1, 1], [2, 1, 1, 2], [2, 2, 2, 2], [2, 1, 2, 1], [1, 1, 2, 1], [1, 2, 1, 2], [1, 2, 1, 1], [2, 1, 1, 2], [1, 2, 2, 2]]', '### Veredicto del Juez
El veredicto para este asunto es un **sí condicionado**. 

El Juez es **Via**, una figura neutra-contextual de elemento Agua que no otorga un ascenso automático por mera inercia ni promete estabilidad absoluta de entrada. **Via** representa una transición, un pasaje estrecho y la necesidad imperiosa de cambiar la ruta o el enfoque actual. El ascenso en la estructura no está denegado, pero exige atravesar un camino directo y sin desviaciones, condicionado a que abandones la estrategia que has empleado hasta hoy.

---

### El camino (Los Testigos)
El camino hacia la resolución muestra un fuerte contraste entre el origen y el destino:

* **Testigo Derecho (El consultante / El pasado del asunto):** Ocupado por **Cauda Draconis**. Muestra un punto de partida viciado, caracterizado por la reactividad, el agotamiento de recursos o una forma errónea de encarar el problema.
* **Testigo Izquierdo (El entorno / El desenlace):** Ocupado por **Caput Draconis**. Representa la meta correcta: una entrada firme, la cabeza fría, la disciplina y la consolidación de un nuevo nivel.

La transición desde **Cauda Draconis** hacia **Caput Draconis** indica que la única vía de progreso exige cortar tajantemente con la postura del pasado para adoptar un perfil estructurado y estratégico.

---

### Detalle de la casa del tema (Casa 10: Trabajo y Carrera)
La Casa 10 está ocupada por **Rubeus**. 

Esta figura no aparece sola: se repite de forma insistente en la **Madre 2**, la **Sobrina 2** y la **Casa 2**. En geomancia, la reiteración de una figura en múltiples posiciones refuerza su significado: la estructura jerárquica y el ambiente profesional de la empresa están dominados por la rigidez, la fricción, la volatilidad y decisiones guiadas por la confrontación o la autoridad impulsiva. 

Intentar ascender chocando contra esa rigidez o mostrando molestia ante la inflexibilidad del entorno solo activará el aspecto destructivo de **Rubeus**. Presentarte con reclamos o demandas en un terreno dominado por esta figura destruirá tus opciones.

---

### Estado del consultante (Casa 1)
La Casa 1 está ocupada por **Cauda Draconis**.

Esta figura insiste al repetirse en la **Madre 1** y en el **Testigo Derecho**. Esta triple presencia de **Cauda Draconis** señala que el principal obstáculo no es únicamente la empresa, sino tu posición actual o tu modo de presentarte. Refleja un enfoque debilitado, desgaste en tu rol presente o el riesgo de incurrir en un autosabotaje por actuar desde la frustración frente a la rigidez institucional.

---

### El Reconciliador
El Reconciliador es **Caput Draconis**, coincidiendo exactamente con el **Testigo Izquierdo**.

Esta repetición de **Caput Draconis** confirma la resolución del conflicto: el desenlace favorece al consultante solo si se produce una alineación completa con las cualidades de esta figura. Para resolver la fluidez de la vía (**Via**) y superar la debilidad inicial (**Cauda Draconis**), debes adoptar la naturaleza de **Caput Draconis**: construcción, metodología, sobriedad y visión de largo plazo.

Por su parte, la **Casa 4** (el final del asunto) muestra a **Laetitia**, lo cual señala un término favorable y ordenado para esta etapa si se cumple la condición planteada.

---

### Tiempo del asunto
La geomancia clásica de este sistema **no calcula fechas, meses ni plazos específicos**. El oráculo juzga la tendencia y la condición del asunto, no la precisión de un calendario. La velocidad del resultado dependerá estrictamente de qué tan rápido ejecutes la reestructuración de tu perfil.

---

### Condición y consejo accionable
1. **Puda y descarte (de Cauda Draconis a Caput Draconis):** Elimina cualquier narrativa de queja sobre la rigidez de la empresa en tus entrevistas o conversaciones con superiores. No intentes cambiar la cultura corporativa.
2. **Presentación técnica y cuantitativa:** Como SRE (Site Reliability Engineer), tu estrategia frente a la autoridad (**Rubeus**) debe ser la reducción de riesgo. Presenta tus logros mediante métricas frías: tiempo de actividad, automatización, prevención de fallas y ahorro de costos. 
3. **Estrategia de contención:** Muéstrate como un ancla de estabilidad y orden (**Caput Draconis**) frente a un entorno volátil (**Rubeus**). No pidas el ascenso por mérito acumulado en el pasado; demuéstralo como la consecuencia lógica para la seguridad de la infraestructura futura.

*(Aviso: Esta interpretación oracular evalúa las tendencias del asunto y no sustituye el asesoramiento profesional en materia laboral, legal o de carrera).*

---

### Síntesis
El ascenso es viable únicamente si dejas de confrontar la rigidez de la empresa y replanteas tu presentación con métricas frías, estabilidad técnica y una estrategia de reducción de riesgos.', NULL, 'sin_verificar', NULL);


--
-- Data for Name: uso_diario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."uso_diario" ("user_id", "fecha", "consultas") VALUES
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25', 5),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-26', 1);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 15, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 2YTzSSg9VFfaWsYnUPvkLmwFYxP2QSSqUaKwATtiwZKdfSZxIRNDbcAR6fKfEqH

RESET ALL;
