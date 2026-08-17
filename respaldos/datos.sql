SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 5LFGJMrhwAAiEBT6oDwXlCefX7VtrU7I2XfFPsLP0k4pxpsuShhFNSucr3z78hb

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
	('00000000-0000-0000-0000-000000000000', '4b455333-26d4-486a-9281-9dda59d1e695', 'authenticated', 'authenticated', 'fabianignaciomv@gmail.com', '$2a$10$TyRkEQASqXmydOcEXq89u.URBea2NccvK.7d1NZeGxIgUoNPpw3Vi', '2026-07-24 21:16:54.459058+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-07-25 02:18:27.551066+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "4b455333-26d4-486a-9281-9dda59d1e695", "email": "fabianignaciomv@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-07-24 21:16:54.439366+00', '2026-08-13 21:51:05.786823+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


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
	('beb28c74-7dcb-49c8-934b-0ee558d06b0f', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 02:18:27.551882+00', '2026-08-13 21:51:05.811598+00', NULL, 'aal1', NULL, '2026-08-13 21:51:05.811424', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1', '181.173.145.43', NULL, NULL, NULL, NULL, NULL);


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
	('00000000-0000-0000-0000-000000000000', 15, '5y54wr6ytwdw', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-26 03:51:18.018255+00', '2026-07-27 14:18:40.956561+00', '7ldtuutldneb', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 16, 'rcth5lcuy75t', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-27 14:18:40.9817+00', '2026-07-27 19:42:12.810644+00', '5y54wr6ytwdw', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 17, 'uvj7fcjz4ztv', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-27 19:42:12.82601+00', '2026-07-29 21:36:14.593318+00', 'rcth5lcuy75t', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 18, 'vhdjmptg4ycu', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-07-29 21:36:14.617437+00', '2026-08-03 18:03:34.353182+00', 'uvj7fcjz4ztv', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 19, '2p6qjstxz7uf', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-03 18:03:34.377782+00', '2026-08-03 19:50:42.07373+00', 'vhdjmptg4ycu', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 20, 'aiagjzubkl5i', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-03 19:50:42.091226+00', '2026-08-04 22:28:46.510122+00', '2p6qjstxz7uf', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 21, 'hex4fhwfexca', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-04 22:28:46.532476+00', '2026-08-07 13:49:11.519723+00', 'aiagjzubkl5i', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 22, 'xfjeujk3jyxj', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-07 13:49:11.539439+00', '2026-08-07 15:04:34.87436+00', 'hex4fhwfexca', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 23, 'tytsuwe2q7es', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-07 15:04:34.890791+00', '2026-08-07 16:40:49.805451+00', 'xfjeujk3jyxj', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 24, 'yadqdmoecnbd', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-07 16:40:49.818595+00', '2026-08-11 20:16:46.15382+00', 'tytsuwe2q7es', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 25, 'vtujxdbfo2hs', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-11 20:16:46.176717+00', '2026-08-13 00:22:29.617581+00', 'yadqdmoecnbd', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 26, 'lweoiswghet4', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-13 00:22:29.635248+00', '2026-08-13 13:44:08.484087+00', 'vtujxdbfo2hs', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 27, 'ehgj76qxunec', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-13 13:44:08.505867+00', '2026-08-13 18:15:13.408739+00', 'lweoiswghet4', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 28, 'lldsirhdw4bo', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-13 18:15:13.425144+00', '2026-08-13 19:19:02.304404+00', 'ehgj76qxunec', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 29, 'd4mlziocvznc', '4b455333-26d4-486a-9281-9dda59d1e695', true, '2026-08-13 19:19:02.316888+00', '2026-08-13 21:51:05.755979+00', 'lldsirhdw4bo', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f'),
	('00000000-0000-0000-0000-000000000000', 30, 'p37tt3ye2dgh', '4b455333-26d4-486a-9281-9dda59d1e695', false, '2026-08-13 21:51:05.772967+00', '2026-08-13 21:51:05.772967+00', 'd4mlziocvznc', 'beb28c74-7dcb-49c8-934b-0ee558d06b0f');


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

INSERT INTO "public"."consultas" ("id", "user_id", "creada_en", "pregunta", "tema_id", "tema_etiqueta", "casa_tema", "madres", "hijas", "sobrinas", "testigo_derecho", "testigo_izquierdo", "juez", "reconciliador", "casas", "interpretacion", "resultado_real", "acierto", "verificada_en", "origen_id") VALUES
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
Tus jefes te aprecian favorablemente pero perciben cierta dispersión en tus entregas, mientras que la impresión general de tu entorno es positiva si logras consolidar tus resultados y mantenerte al margen de tensiones con el equipo.', NULL, 'sin_verificar', NULL, NULL),
	('5ded23c2-ea73-4427-a37b-e979e6ba1d3f', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25 03:00:34.972106+00', 'en que trabajare en 10 años mas, en que rubro? seguire en informatica? que se ve en mi camino', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 2], [1, 1, 1, 1], [2, 1, 2, 2], [1, 2, 2, 1]]', '[[2, 1, 2, 1], [2, 1, 1, 2], [2, 1, 2, 2], [2, 1, 2, 1]]', '[[1, 1, 1, 1], [1, 1, 2, 1], [2, 2, 1, 1], [2, 2, 2, 1]]', '[2, 2, 1, 2]', '[2, 2, 1, 2]', '[2, 2, 2, 2]', '[2, 2, 2, 2]', '[[2, 2, 2, 2], [1, 1, 1, 1], [2, 1, 2, 2], [1, 2, 2, 1], [2, 1, 2, 1], [2, 1, 1, 2], [2, 1, 2, 2], [2, 1, 2, 1], [1, 1, 1, 1], [1, 1, 2, 1], [2, 2, 1, 1], [2, 2, 2, 1]]', '*Nota preliminar:* La geomancia clásica de este sistema no calcula fechas ni plazos exactos; por tanto, no determina un calendario a diez años vista, sino que juzga la tendencia, la condición actual y la naturaleza del asunto consultado.

*   **Veredicto del Juez:** El Juez es **Populus**. Su veredicto es neutro y refleja colectividad, fluctuación y dependencia del entorno o de corrientes masivas. No ofrece un sí rotundo ni un no categórico, sino un estado de tránsito donde el resultado depende de la adaptación a los grupos o estructuras sociales predominantes, sin aportar una estabilidad fija por sí mismo.
*   **Camino (Testigos):** Ambos Testigos muestran **Carcer**. Esto es altamente significativo al repetirse la misma figura en ambas posiciones: insiste en rigidez, limitación, confinamiento o estructuras cerradas que pesan fuertemente sobre el camino del asunto. El Testigo Derecho (el pasado y la base del consultante) y el Testigo Izquierdo (el desenlace y el otro lado) convergen en la misma restricción, señalando que el proceso está sujeto a contención, marcos estrictos o la sensación de estar atado a un entorno laboral o mental del cual cuesta salir.
*   **Detalle de la casa del tema (Casa 10):** En la casa de la carrera y la reputación se encuentra **Coniunctio**. Esta figura indica combinación, alianzas, mezcla de disciplinas o trabajo en red. Respecto a la pregunta de si seguirá en informática, **Coniunctio** apunta a la integración de sistemas, la unión de diferentes áreas o la colaboración técnica, sugiriendo que la continuidad en el rubro no se dará de forma aislada, sino mediante la fusión de la tecnología con otras disciplinas, contratos o redes de colaboración.
*   **Estado del consultante (Casa 1):** En la casa 1 se encuentra **Populus**, lo que refleja a un consultante influenciado por las circunstancias colectivas, el entorno general o la corriente del lugar, mostrando adaptabilidad pero también falta de iniciativa propia individual, dejándose llevar por el fluir de la masa o de las condiciones externas.
*   **Reconciliador:** El Reconciliador es **Populus**. Al coincidir exactamente con la figura del Juez y de la casa 1, refuerza el tono general de la tirada: el desenlace y la integración del consultante con el resultado se apoyan en la misma naturaleza mutable y colectiva, cerrando el ciclo con la necesidad de amoldarse al flujo del entorno sin imponer una voluntad férrea.
*   **Sobrinas y Madres:** Cabe destacar la fuerte presencia de **Via** en la Madre 2 y la Sobrina 1, lo que subraya el tránsito, el movimiento y los caminos alternativos en el desarrollo del asunto. Asimismo, **Puer** se repite entre las Hijas (Hija 1 e Hija 4) y la casa 8, introduciendo impulsividad, energía marcial o riesgos latentes que contrastan con la rigidez de los Testigos.
*   **Condición o consejo accionable:** La continuidad en el rubro informático o la dirección profesional a largo plazo está condicionada por la capacidad de establecer alianzas estratégicas y adaptarse a los cambios estructurales. Se aconseja observar las propias limitaciones institucionales o mentales y buscar la integración de habilidades en lugar de la rigidez.
*   **Síntesis:** El asunto de la carrera se inclina hacia una dinámica de colaboración y adaptación a los cambios colectivos, condicionado por fuertes restricciones estructurales que exigen flexibilidad dentro de entornos cerrados o normados.', NULL, 'sin_verificar', NULL, NULL),
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
El mérito personal es sólido, pero la estructura actual se mantendrá cerrada al ascenso, exigiendo un cambio de ciclo antes que una promoción interna.', NULL, 'sin_verificar', NULL, NULL),
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
El ascenso más allá de SRE es viable mediante un cambio de empresa (**Fortuna Minor**), pero solo si negocias con extrema claridad intelectual (**Albus**) y filtras rigurosamente los vicios ocultos de la nueva organización (**Cauda Draconis**).', NULL, 'sin_verificar', NULL, NULL),
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
El ascenso es viable únicamente si dejas de confrontar la rigidez de la empresa y replanteas tu presentación con métricas frías, estabilidad técnica y una estrategia de reducción de riesgos.', NULL, 'sin_verificar', NULL, NULL),
	('7c55cb96-c75b-4451-9f61-bf2d95ee29ff', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-27 14:22:27.062893+00', 'si impulso que me aparezca una buena oferta laboral para ascender en mi empresa actual de manera interna o que me aparezca una oportunidad en una empresa externa, cómo se ve la energía respecto a este movimiento, ya que sé que las cosas están un poco estancadas acá donde estoy.', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 1], [1, 1, 2, 1], [2, 2, 2, 1], [1, 2, 1, 1]]', '[[2, 1, 2, 1], [2, 1, 2, 2], [2, 2, 2, 1], [1, 1, 1, 1]]', '[[1, 1, 2, 2], [1, 2, 1, 2], [2, 2, 2, 1], [1, 1, 1, 2]]', '[2, 1, 1, 2]', '[1, 1, 1, 1]', '[1, 2, 2, 1]', '[1, 2, 2, 2]', '[[2, 2, 2, 1], [1, 1, 2, 1], [2, 2, 2, 1], [1, 2, 1, 1], [2, 1, 2, 1], [2, 1, 2, 2], [2, 2, 2, 1], [1, 1, 1, 1], [1, 1, 2, 2], [1, 2, 1, 2], [2, 2, 2, 1], [1, 1, 1, 2]]', '*Aviso: La geomancia clásica de este sistema no calcula fechas, plazos ni tiempos concretos; juzga la tendencia y la condición del asunto. Las decisiones de carrera y financieras mayores deben valorarse con criterio profesional.*

**Veredicto del Juez**: El Juez es **Fortuna Major**, una figura marcadamente favorable vinculada a la estabilidad duradera y al éxito sostenido. Esto indica un **sí condicionado** al movimiento de buscar una mejora laboral. La figura señala que el asunto posee un fundamento sólido para prosperar, pero su éxito no surge de la velocidad o la improvisación, sino de la solidez y del peso de los méritos a largo plazo.

**Camino (Testigos)**: El camino hacia esta sentencia se compone de dos fuerzas contrastantes. El **Testigo Derecho**, que refleja el origen o la postura del consultante, es **Fortuna Minor**, una influencia favorable pero inclinada hacia los resultados rápidos, breves o transitorios. El **Testigo Izquierdo**, que muestra el desenlace o la respuesta del entorno, es **Via**, una figura neutra y fluida que representa el tránsito, el cambio constante y la falta de fijación. Esta combinación revela que el impulso inicial parte del deseo de cambios ágiles (Testigo Derecho), mientras que la resolución final dependerá de aceptar un proceso de transición y movimiento continuo (Testigo Izquierdo). Cabe destacar la presencia múltiple de **Cauda Draconis** en las Madres (1 y 3), en la Hija 3, en la Sobrina 3 y en múltiples casas (1, 3, 7 y 11): esta repetición insistente de la Cola del Dragón señala un patrón profundo de cierres, finales necesarios o la necesidad de dejar atrás un entorno viciado antes de que el éxito del Juez pueda manifestarse plenamente.

**Detalle de la casa del tema (Casa 10)**: La casa 10, que rige la carrera y la reputación pública, está ocupada por **Puella**. Esta figura favorable aporta una cualidad de receptividad, diplomacia y búsqueda de armonía o aprobación en el ámbito profesional. Indica que la posición actual en el terreno laboral se beneficia de una aproximación amable, negociadora y enfocada en la estética o en las buenas relaciones con la autoridad, más que de la confrontación directa.

**Estado del consultante (Casa 1)**: La casa 1 está ocupada por **Cauda Draconis**, lo que sitúa al consultante bajo una influencia desfavorable de desapego, salida de una situación o fin de un ciclo. Esta posición muestra que la energía personal actual está marcada por el agotamiento de una etapa previa o por la necesidad imperativa de clausurar un ciclo de estancamiento antes de poder proyectarse hacia el ascenso deseado.

**Reconciliador**: El Reconciliador es **Amissio**, una figura neutra de desprendimiento o pérdida. Su función aquí es matizar el impacto del desenlace sobre el consultante indicando que, para alcanzar la estabilidad que promete el Juez, es indispensable soltar algo: abandonar viejos hábitos de trabajo, desvincularse de la rigidez del entorno actual o aceptar la pérdida de una comodidad conocida.

**Condición o consejo accionable**: La condición para que el movimiento prospere es actuar con estrategia a largo plazo, asumiendo que el estancamiento actual (reflejado en los múltiples cierres de **Cauda Draconis**) requiere dejar ir lo que ya no sirve antes de buscar nuevas oportunidades. Conviene observar la diplomacia en la carrera (**Puella**) sin precipitarse en falsas urgencias, preparando el terreno para un cambio de ciclo inevitable.

**Síntesis final**: El movimiento hacia una mejora laboral cuenta con el respaldo de un desenlace sólido y favorable, pero exige como condición indispensable cerrar con el estancamiento actual y desprenderse de dinámicas pasadas para permitir que la transición fluya con éxito.', NULL, 'sin_verificar', NULL, NULL),
	('502f808a-5272-4c29-b1c0-c2b106d0a750', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-27 14:38:02.528952+00', 'si impulso mediante un hechizo/ritual que me aparezca una buena oferta laboral para ascender en mi empresa actual de manera interna o que me aparezca una oportunidad en una empresa externa, cómo se ve la energía respecto a este movimiento, ya que sé que las cosas están un poco estancadas acá donde estoy. anteriormente ya lo he hecho y ha funcionado bien', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 2], [1, 2, 2, 2], [2, 2, 1, 1], [2, 1, 2, 2]]', '[[2, 1, 2, 2], [2, 2, 2, 1], [2, 2, 1, 2], [2, 2, 1, 2]]', '[[1, 2, 2, 2], [2, 1, 1, 1], [2, 1, 2, 1], [2, 2, 2, 2]]', '[1, 1, 1, 1]', '[2, 1, 2, 1]', '[1, 2, 1, 2]', '[1, 2, 1, 2]', '[[2, 2, 2, 2], [1, 2, 2, 2], [2, 2, 1, 1], [2, 1, 2, 2], [2, 1, 2, 2], [2, 2, 2, 1], [2, 2, 1, 2], [2, 2, 1, 2], [1, 2, 2, 2], [2, 1, 1, 1], [2, 1, 2, 1], [2, 2, 2, 2]]', 'Veredicto del Juez: El Juez de esta tirada es **Puella**, una figura favorable que emite un veredicto de **sí condicionado** respecto a la efectividad de impulsar una nueva oferta u oportunidad laboral. No obstante, recuerda que la geomancia clásica de este sistema no calcula fechas, plazos ni tiempos cronológicos específicos, sino que juzga la tendencia y la condición del asunto. 

Camino de los Testigos: El Testigo Derecho, que muestra a **Via**, refleja el camino neutral y de tránsito del consultante ante el estancamiento mencionado. El Testigo Izquierdo, que muestra a **Puer**, aporta una energía impulsiva, directa y de confrontación o acción rápida hacia el exterior. Además, cabe destacar la presencia repetida de **Carcer** tanto en la Hija 3 como en la Hija 4 (y trasladado a las casas 7 y 8), lo que refuerza e insiste con fuerza en los bloqueos estructurales, las restricciones y las limitaciones profundas que existen en el entorno o en las estructuras actuales del consultante. Asimismo, la figura de **Populus** se repite tanto en la Madre 1 como en la Sobrina 4 y en la Casa 12, insistiendo en una dinámica de colectividad, pasividad o de estar sujeto a las mareas del entorno en lugar de ejercer un control absoluto.

Detalle de la casa del tema (Casa 10 - Carrera y reputación): En la casa relevante para la carrera y la autoridad encontramos a **Acquisitio**. Esta figura es altamente favorable para obtener beneficios, capturar nuevas opciones y abrir puertas materiales o profesionales, lo cual valida de manera positiva la aspiración central de encontrar una vía de salida al estancamiento actual.

Estado del consultante (Casa 1): La figura que ocupa la primera casa es **Populus**, lo que indica que el estado del consultante es de gran receptividad, adaptabilidad a lo colectivo y reflejo de las circunstancias del momento, sin hallarse en una postura de mando unilateral sino de asimilación del entorno.

Reconciliador: El Reconciliador es **Puella**, idéntico a la figura del Juez. Esto sintoniza de forma armónica el resultado final con el desenlace, indicando que el impacto de este movimiento sobre el consultante traerá una resolución apacible, aunque sujeta al manejo superficial o volátil de los recursos que representa esta figura.

Condición o consejo accionable: La condición para que este impulso mágico o ritual logre materializar la oferta anhelada radica en evitar la rigidez excesiva y canalizar la energía con dirección clara, observando que las restricciones del entorno (visibles en las figuras de restricción de la tirada) exigen paciencia táctica y evitar decisiones puramente arrebatadas. *(Nota: Esta lectura geomántica ofrece un juicio simbólico y estratégico sobre la tendencia del asunto, pero no sustituye el consejo profesional en decisiones financieras o laborales mayores).*

Síntesis: El movimiento impulsado tiene una tendencia favorable hacia la obtención de ganancias profesionales, condicionado a sortear las limitaciones estructurales existentes mediante una acción medida y flexible.', NULL, 'sin_verificar', NULL, NULL),
	('bf575738-6d7e-49c3-8ef6-d590714ff5cb', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-03 18:08:56.56477+00', '¿Cuál es la tendencia de mi relación de pareja y si el asunto se inclina hacia la continuidad o la ruptura?', 'pareja', 'Pareja / socio', 7, '[[1, 1, 2, 1], [1, 2, 2, 1], [2, 1, 2, 2], [2, 1, 2, 2]]', '[[1, 1, 2, 2], [1, 2, 1, 1], [2, 2, 2, 2], [1, 1, 2, 2]]', '[[2, 1, 2, 2], [2, 2, 2, 2], [2, 1, 1, 1], [1, 1, 2, 2]]', '[2, 1, 2, 2]', '[1, 2, 1, 1]', '[1, 1, 1, 1]', '[2, 2, 1, 2]', '[[1, 1, 2, 1], [1, 2, 2, 1], [2, 1, 2, 2], [2, 1, 2, 2], [1, 1, 2, 2], [1, 2, 1, 1], [2, 2, 2, 2], [1, 1, 2, 2], [2, 1, 2, 2], [2, 2, 2, 2], [2, 1, 1, 1], [1, 1, 2, 2]]', '## Respuesta directa
**Depende de…**

El vínculo se encuentra en un punto donde las circunstancias externas o el simple paso del tiempo inclinan la balanza hacia un distanciamiento, pero el resultado final aún no está escrito de forma definitiva. La tendencia muestra que la relación se mueve hacia caminos separados si ambos se limitan a dejar que las cosas fluyan sin tomar las riendas. 

**Lo que lo define:** Se requiere un esfuerzo consciente y un cambio profundo en la manera de afrontar las restricciones cotidianas para evitar que la separación se vuelva irreversible.

---

## La lectura

El **Juez** (la sentencia general del asunto) es **Via** (el camino, neutral y mutable), lo que indica que el asunto se encuentra en una encrucijada donde el movimiento es inevitable, pero sin una garantía fija de continuidad o ruptura por sí solo; representa una vía de tránsito donde las decisiones que se tomen marcarán el destino. 

El camino hacia esta sentencia se compone de los Testigos. El Testigo Derecho (el consultante y el origen del asunto) es **Albus** (el blanco, favorable y claro), mostrando claridad mental y una disposición abierta por parte de quien consulta. El Testigo Izquierdo (el otro y el desenlace hacia el que se inclina el vínculo) es **Rubeus** (el rojo, desfavorable y apasionado), introduciendo tensiones, impulsividad y una corriente subterránea de conflicto que empuja hacia el desgaste. Cabe destacar que **Albus** también se manifiesta de forma repetida en las Madres 3 y 4, así como en la Sobrina 1, lo que refuerza con insistencia la necesidad de claridad, orden y lucidez intelectual en el origen de esta situación. Asimismo, **Tristitia** (la tristeza, desfavorable y restrictiva) se repite de manera notable en las Hijas 1 y 4, en la Sobrina 4 y en las Casas 5, 8 y 12, una insistencia geomántica que señala un peso emocional sostenido, cargas del pasado y un aislamiento o bloqueo profundo que opera en segundo plano dentro de la dinámica relacional.

En la **Casa 7** (la pareja y los socios), que es la casa del tema, encontramos a **Populus** (el pueblo, neutral y reflejo de masas). Esta figura refleja que la relación está sujeta a las circunstancias colectivas, a la rutina o a la inercia del entorno, actuando como un espejo de lo que ambos aportan sin tomar una iniciativa propia firme.

En la **Casa 1** (el estado del consultante), se sitúa **Coniunctio** (la unión, neutral y vinculante), lo que muestra que quien consulta mantiene una disposición natural a asociarse, a buscar acuerdos y a sostener el lazo, aunque esto deba medirse con los demás factores de la tirada.

El **Reconciliador** (el matiz de cómo el desenlace afecta al consultante) es **Carcer** (la cárcel, desfavorable y restrictiva), indicando que el desenlace de este proceso dejará una sensación de confinamiento, limitación o de estar atado a una situación de la que es difícil escapar. 

Como consejo accionable, la estructura aconseja no dejar que la inercia marque el rumbo de la relación: es necesario romper con la rigidez interna y afrontar los bloqueos acumulados mediante un diálogo transparente, sin ceder ante la impulsividad o el aislamiento. 

En síntesis, la relación transita por un camino mutable donde la inercia y las tensiones ocultas empujan hacia la separación, quedando el resultado condicionado a la capacidad de superar los bloqueos restrictivos que pesan sobre el vínculo.', NULL, 'sin_verificar', NULL, NULL),
	('7644a007-60e9-4fd2-ab14-a7218ff74d99', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-04 22:33:50.108633+00', '¿Qué factor o causa interna provocó la cancelación del proceso de selección para el puesto de DevOps en NotCo?', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 2], [1, 2, 1, 2], [1, 2, 2, 1], [1, 1, 2, 1]]', '[[2, 1, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [2, 2, 1, 1]]', '[[1, 2, 1, 2], [2, 1, 2, 2], [2, 1, 1, 2], [2, 1, 1, 1]]', '[1, 1, 1, 2]', '[2, 2, 2, 1]', '[1, 1, 1, 1]', '[1, 1, 1, 1]', '[[2, 2, 2, 2], [1, 2, 1, 2], [1, 2, 2, 1], [1, 1, 2, 1], [2, 1, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [2, 2, 1, 1], [1, 2, 1, 2], [2, 1, 2, 2], [2, 1, 1, 2], [2, 1, 1, 1]]', '## Respuesta directa
**Depende de…**
El proceso se frenó debido a factores externos de estancamiento y a una falta de definición clara en la dirección que tomó la empresa, más allá de la preparación del candidato. Las decisiones tomadas en el ámbito corporativo se vieron paralizadas o redirigidas por dinámicas ajenas al control directo del postulante. 
**Lo que lo define:** La revisión de cómo las condiciones de la propia empresa y sus cambios de ruta internos determinaron la interrupción del proceso.

---

## La lectura

El Juez (la sentencia general del asunto) está ocupado por **Via** (el camino, neutral y de tránsito), lo que indica que el asunto no tiene un veredicto definitivo de éxito o fracaso absoluto, sino que señala un estado de tránsito, estancamiento o un cambio de dirección imprevisto en el curso de los acontecimientos. Esta figura muestra un escenario donde las cosas simplemente se detuvieron o tomaron otra ruta sin una resolución tajante.

En cuanto al camino hacia esta sentencia, el Testigo Derecho (el consultante o el pasado del asunto) muestra a **Caput Draconis** (cabeza del dragón, favorable y de apertura), lo que refleja que el inicio del proceso o la postura inicial del candidato contaba con buenos auspicios y disposición de entrada. Por otro lado, el Testigo Izquierdo (el otro o el desenlace) presenta a **Cauda Draconis** (cola del dragón, desfavorable y de cierre o pérdida), marcando que el desenlace estuvo fuertemente condicionado por un corte abrupto, una salida de camino o una clausura repentina de la oportunidad por parte de la empresa.

Observando la casa del tema principal, la Casa 10 (carrera, reputación y resultado público), esta se encuentra habitada por **Albus** (el blanco, favorable y claro). Esta figura denota claridad, transparencia o una estructura ordenada en el plano profesional, lo que sugiere que por el lado de las competencias o la presentación del perfil no existía una deficiencia técnica evidente; sin embargo, se trataba de un entorno corporativo tal vez demasiado rígido o sujeto a filtros muy estrictos.

En el estado del consultante, la Casa 1 (el consultante y su estado actual) refleja a **Populus** (el pueblo, neutral y reflejo colectivo), una figura que muestra pasividad, estar sujeto a las circunstancias del grupo o depender de decisiones masivas y externas en lugar de tener autonomía sobre el resultado. 

Las Madres y Sobrinas aportan matices clave: la segunda Madre y la primera Sobrina comparten a **Puella** (la niña, favorable y superficial o blanda), lo que apunta a cierta ligereza, falta de firmeza o decisiones cambiantes en los primeros impulsos del proceso. Asimismo, la primera y cuarta Sobrina repiten a **Acquisitio** (la ganancia, favorable), reflejando que había expectativas económicas o de beneficio mutuo sobre la mesa que finalmente no lograron retenerse debido a la fuerte presencia de **Cauda Draconis** en el Testigo Izquierdo y en la Casa 6 (trabajo cotidiano y subordinados), la cual advierte sobre obstáculos operativos o caídas en la dinámica laboral interna de la compañía.

Finalmente, el Reconciliador (el matiz de cómo el desenlace afecta al consultante) repite a **Via** (el camino). Esta coincidencia con el Juez refuerza que la experiencia deja al consultante en una posición de tránsito, sin pérdidas irreparables en su capacidad profesional, pero ante la necesidad de desviar su atención hacia nuevos trayectos.

**Consejo accionable:** Dado que el oráculo muestra un cierre de ruta impulsado por factores corporativos ajenos y una postura de espera por parte del consultante, el enfoque debe trasladarse a buscar nuevos horizontes profesionales donde la capacidad de dirección propia no dependa de la rigidez de procesos externos. Recuerde que esta lectura es una valoración de tendencias y condiciones estructurales, no un sustituto de la evaluación objetiva de sus opciones en el mercado laboral.

**Síntesis:** El proceso se desvió por dinámicas corporativas de cierre y mutación, dejando al consultante en una etapa de tránsito que exige redirigir sus esfuerzos hacia otras oportunidades.', NULL, 'sin_verificar', NULL, NULL),
	('9e1fcb2b-4f88-4375-a58a-7cca8894f09e', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-04 22:36:43.076548+00', 'se abrira nuevamente el procso en el futuro? me tomaran en cuenta si es asi?', 'trabajo', 'Trabajo / carrera', 10, '[[2, 2, 2, 2], [1, 2, 1, 2], [1, 2, 2, 1], [1, 1, 2, 1]]', '[[2, 1, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [2, 2, 1, 1]]', '[[1, 2, 1, 2], [2, 1, 2, 2], [2, 1, 1, 2], [2, 1, 1, 1]]', '[1, 1, 1, 2]', '[2, 2, 2, 1]', '[1, 1, 1, 1]', '[1, 1, 1, 1]', '[[2, 2, 2, 2], [1, 2, 1, 2], [1, 2, 2, 1], [1, 1, 2, 1], [2, 1, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [2, 2, 1, 1], [1, 2, 1, 2], [2, 1, 2, 2], [2, 1, 1, 2], [2, 1, 1, 1]]', '## Respuesta directa
**Depende de…**
El proceso podría reanudarse en algún momento, pero no hay una certeza de que vuelvan a considerarte directamente a ti de inmediato, ya que las circunstancias se mueven hacia nuevos rumbos y cambios de dirección. 
**Lo que lo define:** Que la apertura futura de la vacante dependerá de que cambien las condiciones internas de la empresa y de que logres posicionarte nuevamente de manera activa ante ellos.

---

## La lectura

El Juez (la sentencia general del asunto) se mantiene en **Via** (el camino, neutral y de tránsito), lo que indica que no hay una respuesta definitiva de cierre total ni de apertura inmediata, sino un estado de tránsito o de caminos que pueden volver a abrirse más adelante según sople el viento institucional. 

En cuanto al camino que conduce a este escenario, el Testigo Derecho (el consultante o el pasado del asunto) presenta a **Caput Draconis** (cabeza del dragón, favorable y de apertura), lo que confirma que tu entrada original al proceso tuvo un comienzo propicio y de buena acogida. En contraste, el Testigo Izquierdo (el otro o el desenlace) muestra a **Cauda Draconis** (cola del dragón, desfavorable y de cierre o pérdida), señalando que el desenlace anterior fue un corte tajante y que cualquier futura reapertura cargará con la sombra de esa interrupción.

Al observar la casa del tema, la Casa 10 (carrera, reputación y resultado público), esta se encuentra habitada por **Albus** (el blanco, favorable y claro). Esta posición muestra que tu perfil profesional y tu reputación en relación con este puesto conservan orden y claridad, lo que significa que no se descarta una buena impresión técnica de fondo, reforzada además por el hecho de que **Albus** también se repite en la Hija 3 y en la Sobrina 2, insistiendo en que la estructura y la transparencia de tus competencias siguen siendo puntos a favor.

En cuanto al estado del consultante, la Casa 1 (el consultante y su estado actual) está ocupada por **Populus** (el pueblo, neutral y reflejo colectivo), figura que se repite exactamente en la Madre 1, reflejando una postura de espera, sujeta a los tiempos y decisiones que tome la organización en conjunto, sin poder forzar por ti mismo la reapertura del concurso.

El Reconciliador vuelve a ser **Via** (el camino, neutral y de tránsito), lo que matiza el desenlace indicando que el vínculo con este asunto queda abierto a nuevos desplazamientos, sin garantizar una línea recta hacia tu contratación pero permitiendo el tránsito futuro. Como consejo accionable, dado que la geomancia clásica no calcula fechas ni plazos, no debes aguardar pasivamente a una convocatoria; debes observar los movimientos de la empresa (Casa 10) manteniendo tu propia claridad profesional y buscando nuevas rutas si el camino institucional se demora demasiado. 

En síntesis, aunque la estructura de tu perfil profesional es limpia, el camino del asunto permanece en tránsito y sujeto a cierres previos, por lo que una posible reapertura requerirá de nuevas circunstancias y de una postura más activa de tu parte.', NULL, 'sin_verificar', NULL, '7644a007-60e9-4fd2-ab14-a7218ff74d99'),
	('4c544e4c-8bf7-441b-b1bd-978baef4e444', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-07 13:58:32.316647+00', 'seguimos mal con mi pareja y cada ve se siente mas lejano pero me esta impotando menos, de aqui a fin de año, se ve que terminalos la relacion?', 'pareja', 'Pareja / socio', 7, '[[1, 2, 2, 1], [2, 1, 2, 2], [1, 2, 2, 1], [2, 1, 1, 1]]', '[[1, 2, 1, 2], [2, 1, 2, 1], [2, 2, 2, 1], [1, 2, 1, 1]]', '[[1, 1, 2, 1], [1, 1, 1, 2], [1, 1, 1, 1], [1, 2, 1, 2]]', '[2, 2, 1, 1]', '[2, 1, 2, 1]', '[2, 1, 1, 2]', '[1, 1, 1, 1]', '[[1, 2, 2, 1], [2, 1, 2, 2], [1, 2, 2, 1], [2, 1, 1, 1], [1, 2, 1, 2], [2, 1, 2, 1], [2, 2, 2, 1], [1, 2, 1, 1], [1, 1, 2, 1], [1, 1, 1, 2], [1, 1, 1, 1], [1, 2, 1, 2]]', '## Respuesta directa

**Sí, el vínculo se encamina hacia la ruptura.**
Las circunstancias indican un término precipitado impulsado por el distanciamiento de la otra parte y un desapego creciente de tu lado. El proceso no tenderá a la continuidad ni al arreglo, sino a una separación rápida que te ubicará en una posición personal de mayor firmeza e independencia.
**Lo que lo define:** La separación no vendrá por un desgaste lento ni por negociaciones prolongadas, sino por un quiebre reactivo que facilitará tu liberación.

## La lectura

El **Juez** (la sentencia general del asunto) muestra a **Fortuna Minor** (la Fortuna Menor, cambio rápido e inestabilidad). Esta figura dictamina que la relación carece de soporte sólido para mantenerse en el tiempo; predice un evento precipitado, una resolución veloz o una salida rápida antes que la preservación de la pareja.

Al analizar el camino hacia este veredicto, el **Testigo Derecho** (el consultante y la base del asunto) presenta a **Laetitia** (la Alegría, ligereza y alivio). Esto confirma que tu estado respecto a la relación evoluciona hacia el desprendimiento y la búsqueda de tranquilidad personal: el distanciamiento del otro no te destruye, sino que te descarga de un peso. Por su parte, el **Testigo Izquierdo** (el otro extremo y el desenlace hacia el que se mueve la situación) muestra a **Puer** (el Niño, impulsividad, conflicto y acción abrupta). La presencia de **Puer** es especialmente relevante porque se repite en la **Hija 2** y en la **Casa 6** (el trabajo cotidiano y las cargas), lo que insiste en que el detonante del final vendrá impregnado de discusiones reactivas, inmadurez o una decisión intempestiva impulsada por la otra persona o por el desgaste de la convivencia diaria.

En la **Casa 7** (la casa de la pareja y las alianzas), encontramos a **Cauda Draconis** (la Cola del Dragón, pérdida, drenaje y cierre definitivo). Esta figura también aparece previamente en la **Hija 3**, lo que refuerza de manera contundente la naturaleza del vínculo: se trata de un canal agotado, una relación que está expulsando sus últimos residuos y donde no hay construcción posible. **Cauda Draconis** en la casa del tema es la marca de la separación y el fin de un ciclo.

En contraste, la **Casa 1** (el estado del consultante) alberga a **Fortuna Major** (la Fortuna Mayor, solidez, autonomía y bien propio), figura que además se reitera en la **Madre 1**, la **Madre 3** y la **Casa 3** (el entorno cercano y la mente). Esta múltiple repetición de **Fortuna Major** enfatiza tu fortaleza interna: no eres la parte perjudicada ni quedas destruida tras esta ruptura. Te mantienes sobre tus propios pies, recuperando autoridad y estabilidad personal.

El **Reconciliador** (el ajuste final de la sentencia sobre el consultante) es **Via** (el Camino, la dispersión y el cambio de ruta), que también se manifiesta en la **Sobrina 3** y en la **Casa 11** (las aspiraciones futuras). La integración de la tirada confirma que el desenlace te empuja a tomar tu propio rumbo y dejar atrás la vía compartida.

Respecto al plazo consultado ("de aquí a fin de año"), es necesario señalar que la geomancia de este sistema no calcula fechas de calendario ni plazos exactos. Sin embargo, la naturaleza dinámica de **Fortuna Minor** y la impulsividad de **Puer** indican que la marea del asunto se mueve con rapidez y no sostendrá la estructura actual durante mucho tiempo.

**Consejo accionable:** No intentes frenar un quiebre que te beneficia. La tirada indica que tu solidez personal está intacta; utiliza la distancia actual para consolidar tu independencia y deja que el evento de ruptura ocurra sin engancharte en discusiones estériles.

**Síntesis:** La relación se dirige a un cierre definitivo impulsado por la inestabilidad y el conflicto, proceso del cual saldrás en una posición de plena fortaleza y autonomía personal.', NULL, 'sin_verificar', NULL, NULL),
	('9e077587-f5cf-41c5-b179-0d3dcceedfd4', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-07 13:59:56.246835+00', 'test', 'pareja', 'Pareja / socio', 7, '[[1, 2, 1, 1], [2, 2, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2]]', '[[1, 2, 1, 2], [2, 2, 2, 1], [1, 2, 1, 1], [1, 1, 2, 2]]', '[[1, 2, 1, 2], [1, 1, 2, 2], [1, 2, 1, 1], [2, 1, 1, 1]]', '[2, 1, 1, 2]', '[1, 1, 2, 2]', '[1, 2, 1, 2]', '[2, 2, 2, 1]', '[[1, 2, 1, 1], [2, 2, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2], [1, 2, 1, 2], [2, 2, 2, 1], [1, 2, 1, 1], [1, 1, 2, 2], [1, 2, 1, 2], [1, 1, 2, 2], [1, 2, 1, 1], [2, 1, 1, 1]]', '## Respuesta directa

**Sí, pero…**

El vínculo o acuerdo presenta una fachada favorable de entendimiento y afinidad mutua, pero internamente existe una fuerte carga de impulsividad, desconfianza o tensión que ambos participantes comparten por igual. Si esa reactividad de fondo no se gestiona con cabeza fría, el agrado inicial terminará sofocado por fricciones y bloqueos.

**Lo que lo define:** Frenar los arrebatos de ambas partes y aclarar los límites concretos antes de formalizar la alianza.

---

## La lectura

### El Juez
La sentencia recae en **el Juez (la sentencia general del asunto)**, ocupado por **Puella (armonía, atracción y complacencia)**. Esto indica una inclinación favorable hacia el acuerdo, la buena disposición de las partes y el entendimiento en el plano inmediato o estético. Sin embargo, esta posición advierte que la solución tiende a ser blanda si se sostiene únicamente en las formas amables o en la fascinación del momento.

### El camino: los Testigos
El tránsito hacia la sentencia muestra una divergencia clara entre el origen y el desenlace:
* **El Testigo Derecho (el consultante y el pasado del asunto)** presenta a **Fortuna Minor (éxito rápido pero inestable)**. Señala un arranque con empuje, agilidad y circunstancias externas favorables de corta duración.
* **El Testigo Izquierdo (el otro participante y el desenlace)** presenta a **Tristitia (peso, restricción y estancamiento)**. Revela que el desenlace del camino se topa con exigencias severas, enfado o enfriamiento. Lo que comenzó con fluidez se vuelve rígido e insatisfactorio.

### La casa del tema y el estado del consultante
En **la casa 7 (la casa relevante para pareja o socio)** encontramos a **Rubeus (impulsividad, conflicto y pasión desenfrenada)**. Al examinar **la casa 1 (el estado del consultante)**, se observa exactamente la misma figura: **Rubeus**. 

Esta duplicación de la misma figura en ambas posiciones es el factor crítico de la tirada: señala que el consultante y el socio o pareja están actuando como espejos exactos. La tensión, el enojo o la desconfianza no provienen de un solo lado; ambas partes comparten la misma tendencia a reaccionar de forma intempestiva o apasionada, alimentando el conflicto en lugar de resolverlo.

### El Reconciliador y el final del asunto
**El Reconciliador (el impacto final en el consultante)** muestra a **Cauda Draconis (pérdida o cese desgastante)**. Esto indica que la forma en que el desenlace afecta al consultante exige cortar con patrones tóxicos o desprenderse de falsas expectativas para evitar una salida perjudicial. Por su parte, la **casa 4 (el final del asunto)**, que alberga a Fortuna Minor, confirma que el cierre del asunto será veloz y requerirá atención constante para no diluirse.

### Consejo accionable
No tome decisiones de vinculación bajo el efecto de la prisa o del enojo. Reconozca el impulso agresivo o reactivo propio antes de juzgar el del otro y establezca reglas operativas estrictas por escrito.

### Síntesis
El acuerdo es viable en la superficie, pero se descarrilará si ambas partes no moderan la impulsividad destructiva que comparten.', NULL, 'sin_verificar', NULL, NULL),
	('c9c2885e-63e0-4305-a537-f2c555e26e82', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-07 14:01:01.302861+00', 'test2', 'pareja', 'Pareja / socio', 7, '[[1, 2, 1, 1], [2, 2, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2]]', '[[1, 2, 1, 2], [2, 2, 2, 1], [1, 2, 1, 1], [1, 1, 2, 2]]', '[[1, 2, 1, 2], [1, 1, 2, 2], [1, 2, 1, 1], [2, 1, 1, 1]]', '[2, 1, 1, 2]', '[1, 1, 2, 2]', '[1, 2, 1, 2]', '[2, 2, 2, 1]', '[[1, 2, 1, 1], [2, 2, 2, 1], [1, 2, 1, 2], [2, 1, 1, 2], [1, 2, 1, 2], [2, 2, 2, 1], [1, 2, 1, 1], [1, 1, 2, 2], [1, 2, 1, 2], [1, 1, 2, 2], [1, 2, 1, 1], [2, 1, 1, 1]]', '## Respuesta directa

**Sí, pero…**

El veredicto anterior se sostiene: existe disposición favorable para el entendimiento formal, pero la tendencia de fondo hacia la tensión compartida permanece intacta. Lo que inicia de forma rápida y entusiasta corre el riesgo de enfriarse y bloquearse si no se frena la impulsividad mutua antes de actuar.

**Lo que lo define:** Establecer acuerdos firmes por escrito y moderar las reacciones intempestivas de ambas partes.

---

## La lectura

El veredicto emitido originalmente se sostiene plenamente, ya que este seguimiento se analiza a partir del mismo escudo de figuras trazado previamente.

### El Juez
La resolución recae en **el Juez (la sentencia general del asunto)**, ocupado por **Puella (armonía, atracción y concordia)**. Su presencia otorga una inclinación favorable hacia el acuerdo y la diplomacia. No obstante, al ser una figura blanda, advierte que las buenas intenciones o la mera atracción superficial no bastan para sostener el vínculo si no hay una estructura firme. Cabe destacar que Puella se repite de forma constante en la tirada —como **Madre 3**, **Hija 1**, **Sobrina 1**, así como en la **casa 3**, **casa 5** y **casa 9**—, lo cual refuerza que la búsqueda de entendimiento y la imagen armónica son el marco dominante, aunque con riesgo de quedarse en una complacencia frágil.

### El camino: los Testigos
El tránsito entre el origen y el desenlace muestra una divergencia clara:
* **El Testigo Derecho (el consultante y el origen del asunto)** presenta a **Fortuna Minor (éxito rápido pero inestable)**. Señala un arranque con empuje, agilidad y circunstancias externas propicias de corta duración.
* **El Testigo Izquierdo (el otro y el desenlace del asunto)** muestra a **Tristitia (peso, restricción y estancamiento)**. Revela que el trayecto desemboca en exigencias rigurosas, enfriamiento o frustración. Tristitia se repite además en **Hija 4**, **Sobrina 2**, la **casa 8** y la **casa 10**, insistiendo en que la rigidez y las cargas no resueltas pesan severamente sobre el futuro de la relación.

### La casa del tema y el estado del consultante
En **la casa 7 (la casa relevante de la pareja o socio)** se halla **Rubeus (impulsividad, conflicto y pasión desmedida)**. Al examinar **la casa 1 (el estado del consultante)**, reaparece exactamente la misma figura: **Rubeus**.

Esta duplicación explícita de Rubeus en ambas casas —reforzada por su presencia en **Madre 1**, **Hija 3**, **Sobrina 3** y la **casa 11**— es el núcleo del juicio: confirma que el consultante y la otra parte operan bajo el mismo nivel de reactividad o impaciencia. Ninguno de los dos actúa con distancia neutral; el conflicto potencial proviene de un espejo donde la impulsividad de uno retroalimenta la del otro.

### El Reconciliador y el final del asunto
**El Reconciliador (el impacto final en el consultante)** presenta a **Cauda Draconis (pérdida, cese o desprendimiento)**. Esta figura —presente también como **Madre 2**, **Hija 2**, en la **casa 2** y la **casa 6**— indica que la conclusión exige cortar quirúrgicamente con vicios relacionales o expectativas irrealistas para evitar un desgaste mayor. Por su parte, **la casa 4 (el final del asunto)** alberga a Fortuna Minor, lo que reitera un cierre rápido pero sujeto a fluctuaciones.

### Consejo accionable
No tome decisiones de vinculación bajo el efecto del enojo o la prisa. Reconozca el impulso reactivo propio antes de juzgar el del otro y fije reglas operativas claras y escritas desde el principio.

### Síntesis
El acuerdo es viable en apariencia, pero se deteriorará hacia la rigidez y el conflicto a menos que ambas partes frenen su propia impulsividad y fijen límites concretos.', NULL, 'sin_verificar', NULL, '9e077587-f5cf-41c5-b179-0d3dcceedfd4'),
	('fad8ee29-afbd-4ad1-b846-5da9c24b0f61', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-11 20:26:10.96253+00', 'como sigue la relacion de aqui a fin de año', 'pareja', 'Pareja / socio', 7, '[[1, 2, 2, 2], [1, 2, 1, 1], [2, 2, 1, 2], [1, 2, 1, 1]]', '[[1, 1, 2, 1], [2, 2, 2, 2], [2, 1, 1, 1], [2, 1, 2, 1]]', '[[2, 2, 1, 1], [1, 2, 2, 1], [1, 1, 2, 1], [2, 2, 1, 2]]', '[1, 2, 1, 2]', '[1, 1, 1, 1]', '[2, 1, 2, 1]', '[1, 1, 2, 1]', '[[1, 2, 2, 2], [1, 2, 1, 1], [2, 2, 1, 2], [1, 2, 1, 1], [1, 1, 2, 1], [2, 2, 2, 2], [2, 1, 1, 1], [2, 1, 2, 1], [2, 2, 1, 1], [1, 2, 2, 1], [1, 1, 2, 1], [2, 2, 1, 2]]', '## Respuesta directa

**Sí, pero…**

El oráculo muestra que la relación se encamina hacia una obtención clara o un balance definido hacia fin de año, pero este desenlace trae consigo restricciones y un clima de encierro. Aunque el resultado apunta a consolidar un rumbo, el camino y el contexto del vínculo actual están marcados por la rigidez.

**Lo que lo define:** La evolución del vínculo dependerá de cómo manejen los límites y las dificultades prácticas que ya se manifiestan en el día a día.

---

## La lectura

H1 y H2. El escudo analizado se levantó **HOY**, el 11 de agosto de 2026, y es el único que juzga la pregunta presente. En una consulta anterior, fechada el 7 de agosto de 2026, el Juez de aquella tirada fue *Coniunctio* (figura ausente en el escudo actual, perteneciente exclusivamente a la tirada pasada), la cual indicó en su momento una tendencia hacia la ruptura y el distanciamiento. El hecho de que el Juez de hoy sea distinto marca un cambio en la fase del asunto: pasamos de la disolución a un escenario donde se concreta un resultado neto, aunque atravesado por tensiones estructurales.

El Juez (**Acquisitio** (la sentencia general del asunto)) se inclina favorablemente hacia la obtención de un resultado tangible y la resolución del tema planteado. 

En cuanto al camino, el **Testigo Derecho** (**Amissio** (la pérdida o la liberación de aquello que se sostiene)) refleja el estado o el pasado reciente del asunto por parte del consultante, orientado a soltar o dejar ir; mientras que el **Testigo Izquierdo** (**Via** (el camino, el tránsito neutral y el movimiento)) muestra que la contraparte o el flujo de los acontecimientos avanza sin una dirección fija pero en constante desplazamiento. 

En la **Casa 7** (la pareja, los socios y los adversarios declarados), encontramos a **Caput Draconis** (la cabeza del dragón, favorable y de inicio), lo cual señala que la posición del vínculo en sí misma abre una nueva puerta o un punto de inflexión. 

El estado del consultante, reflejado en la **Casa 1**, está ocupado por **Laetitia** (la alegría, favorable, elemento Fuego), una figura que se repite como Madre 1, mostrando un ánimo interno de desahogo o bienestar personal que contrasta con las dificultades externas del entorno.

El **Reconciliador** (**Puer** (el niño, neutra-contextual)), que también aparece múltiples veces en esta tirada (en la Hija 1, la Sobrina 3, la Casa 5 y la Casa 11), aporta un matiz de impulsividad y energía marcial que influye en cómo el desenlace afecta al consultante, advirtiendo sobre reacciones apresuradas o falta de templanza ante los conflictos.

Las Sobrinas muestran contrastes severos: **Fortuna Major** (la fortuna mayor, favorable) en la Sobrina 1 e Y **Albus** (el blanco, favorable, elemento Agua) en la Sobrina 4 aportan estabilidad y claridad, pero **Carcer** (la cáscara o la cárcel, desfavorable) en la Sobrina 2 —figura que también se repite en la Casa 10— introduce un fuerte componente de restricción y pesadez en el ámbito público o en las metas a largo plazo de la relación. 

**Síntesis:** El asunto avanza hacia una resolución concreta guiada por la obtención de un balance final, pero este proceso exige sortear un marco de rigidez y posibles reacciones impulsivas que condicionan la estabilidad del vínculo de aquí a fin de año.', NULL, 'sin_verificar', NULL, '4c544e4c-8bf7-441b-b1bd-978baef4e444'),
	('13535ce0-bbce-4443-917a-851460cb0d84', '4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-11 20:28:57.456409+00', 'terminamos o no con mi pareja de cara a fin de año', 'pareja', 'Pareja / socio', 7, '[[2, 2, 2, 2], [2, 2, 2, 1], [2, 1, 2, 1], [2, 1, 2, 2]]', '[[2, 2, 2, 2], [2, 2, 1, 1], [2, 2, 2, 2], [2, 1, 1, 2]]', '[[2, 2, 2, 1], [2, 2, 2, 1], [2, 2, 1, 1], [2, 1, 1, 2]]', '[2, 2, 2, 2]', '[2, 1, 2, 1]', '[2, 1, 2, 1]', '[2, 1, 2, 1]', '[[2, 2, 2, 2], [2, 2, 2, 1], [2, 1, 2, 1], [2, 1, 2, 2], [2, 2, 2, 2], [2, 2, 1, 1], [2, 2, 2, 2], [2, 1, 1, 2], [2, 2, 2, 1], [2, 2, 2, 1], [2, 2, 1, 1], [2, 1, 1, 2]]', '## Respuesta directa
**Sí, pero…**
El vínculo avanza hacia un cierre o una definición contundente de cara a fin de año, pero este desenlace no llega de forma limpia ni alivia el malestar acumulado. La situación se encamina a cristalizarse en un formato rígido que requerirá lidiar con restricciones y un peso emocional sostenido.
**Lo que lo define:** La evolución dependerá de cómo se gestionen las limitaciones prácticas y el desgaste cotidiano que ya pesan sobre ambas partes.

---

## La lectura
El Juez (**Acquisitio**) determina la sentencia general del asunto: un resultado de obtención neta o cierre de balances, indicando que la situación actual llegará a una definición concreta y tangible hacia el final del período consultado. 

En cuanto al camino que conduce a este desenlace, los Testigos muestran una polaridad clara. El Testigo Derecho (**Populus**) representa al consultante y al punto de partida del asunto, reflejando una postura pasiva, estática y sujeta al fluir de las circunstancias colectivas o externas, sin iniciativa propia para alterar el rumbo. El Testigo Izquierdo (**Acquisitio**) representa a la otra parte y al desarrollo de los acontecimientos, aportando una fuerza de acumulación y consolidación que empuja el desenlace hacia una resolución material.

Al observar la casa del tema, la Casa 7 (Pareja, socios, adversarios declarados) contiene a **Populus**, lo que señala que el vínculo en sí mismo se encuentra en un estado de estancamiento, reflejando pasividad, dependencia del entorno o una espera inerte donde ninguna de las partes toma las riendas del cambio. La Casa 1 (el consultante, su cuerpo y su estado actual) también se encuentra ocupada por **Populus**, lo que refuerza la misma condición de espejo y falta de agencia individual en este momento, mostrando al consultante duplicando la energía estática de la relación.

El Reconciliador (**Acquisitio**) modera el impacto del desenlace sobre el consultante repitiendo la figura de la sentencia, lo que indica que el resultado final traerá una ganancia o un cierre definitivo, aunque ese balance estará atravesado por las cargas restrictivas que dominan el trasfondo de la tirada. Las Sobrinas y Madres muestran una fuerte repetición de figuras pesadas, destacando a **Tristitia** y a **Rubeus** en la Casa 4 (hogar, padre, raíces, final del asunto), lo cual contradice la promesa de ganancia simple del Juez al imprimir un clima de amargura, bloqueo y final áspero en las bases del vínculo. 

Cabe señalar que esta consulta se da en continuidad con un historial previo donde el Juez ha variado. En la consulta del 7 de agosto el Juez fue *Coniunctio* (de aquella tirada) apuntando a una unión o un quiebre reactivo, mientras que en la lectura anterior del mismo 11 de agosto el Juez fue **Acquisitio**, al igual que hoy, lo que muestra que la tendencia hacia una definición contundente se mantiene firme a lo largo de los días, estabilizándose en un balance inevitable. La geomancia no calcula fechas exactas, por lo que este desenlace no fija un día calendario, sino una tendencia ineludible hacia el cierre del ciclo. *Nota: Esta lectura es una guía simbólica y no sustituye el consejo profesional o legal en decisiones de esta magnitud.*

**Síntesis:** El asunto se encamina hacia una definición material ineludible impulsada por la contraparte, mientras el consultante permanece en una postura estática, resultando en un cierre inevitable que, aunque define el rumbo, carga con restricciones y desgaste estructural.', NULL, 'sin_verificar', NULL, '4c544e4c-8bf7-441b-b1bd-978baef4e444');


--
-- Data for Name: uso_diario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."uso_diario" ("user_id", "fecha", "consultas") VALUES
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-25', 5),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-26', 1),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-07-27', 8),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-03', 2),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-04', 4),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-07', 3),
	('4b455333-26d4-486a-9281-9dda59d1e695', '2026-08-11', 3);


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

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 30, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 5LFGJMrhwAAiEBT6oDwXlCefX7VtrU7I2XfFPsLP0k4pxpsuShhFNSucr3z78hb

RESET ALL;
