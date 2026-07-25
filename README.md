# Geomancia — El Oráculo del Veredicto

App web (HTML + CSS + JavaScript vanilla, sin frameworks ni build) que implementa un
oráculo de **geomancia occidental clásica** en español, mobile-first, instalable como PWA,
con interpretación generada por IA y una bitácora privada para auditar los veredictos.

Responde preguntas concretas sobre el mundo mediante el escudo geomántico completo
(4 Madres, 4 Hijas, 4 Sobrinas, 2 Testigos, Juez y Reconciliador) y la carta de las 12 casas
astrológicas.

## Cómo funciona

1. El consultante formula una pregunta concreta y elige el tema/casa relevante.
2. Se generan las 16 líneas del escudo automáticamente, con `crypto.getRandomValues`
   (generador criptográfico del sistema, sin sesgo de módulo) — no hay nada que trazar a mano.
3. El sitio calcula algorítmicamente Hijas, Sobrinas, Testigos, Juez y Reconciliador, y arma
   la carta de casas. Una verificación interna corta la tirada (`throw`) si el Juez sale con
   un total de puntos impar, cosa que la aritmética nunca debería permitir.
4. Se pide la interpretación a Gemini con instrucciones estrictas de geomante hermético:
   veredicto condicionado (no determinista), cobertura obligatoria de Juez + Testigos +
   Reconciliador + casa del tema, y prohibición explícita de nombrar figuras que no estén en
   la tirada. Un validador propio (`figurasAlucinadas`) rechaza y reintenta si el modelo
   menciona una figura ajena al escudo. **No hay lectura de respaldo**: si el modelo falla
   tras los reintentos, se muestra el error y se deja reintentar — nunca se inventa un
   veredicto ni se guarda una interpretación vacía como si fuera válida.
5. Si el consultante tiene sesión, puede guardar la lectura en su bitácora privada (Supabase)
   y, más tarde, registrar qué ocurrió realmente para medir el acierto del oráculo.
6. La lectura se puede copiar con el formato ya renderizado (para pegarla con títulos y
   negritas en notas del celular) o exportar junto con toda la bitácora en Markdown o JSON.

## Arquitectura

```
┌─────────────────┐      HTTPS       ┌──────────────────────┐
│  Navegador       │ ───────────────▶ │  GitHub Pages        │
│  (index.html +   │ ◀─────────────── │  (sitio estático)    │
│   app.js)        │                  └──────────────────────┘
│                  │
│  ┌────────────┐  │      sesión + datos     ┌───────────────────────┐
│  │ Service     │  │ ───────────────────────▶│  Supabase             │
│  │ Worker      │  │ ◀───────────────────────│  - Auth (email+clave) │
│  │ (offline)   │  │                          │  - Postgres + RLS     │
│  └────────────┘  │                          │  - Edge Function      │
│                  │      prompt (con sesión)  │    "interpretar"       │
│                  │ ───────────────────────▶ │       │                │
│                  │ ◀─────────────────────── │       ▼                │
│                  │      interpretación       │  Gemini API           │
│                  │                          │  (clave del servidor)  │
└──────────────────┘                          └───────────────────────┘
```

- **El sitio es estático**: no hay servidor propio. Vive en GitHub Pages.
- **La lógica de negocio (matemática del escudo, prompt, validación) corre en el
  navegador**, en `app.js`. Es auditable por cualquiera que abra el código.
- **Supabase** cubre tres roles: autenticación, base de datos con Row Level Security, y el
  proxy de la clave de Gemini (Edge Function). Es el único servicio de backend del proyecto.
- **Gemini** solo se llama desde dos lugares: directo desde el navegador (si no hay sesión,
  con la clave que cada quien pega en su propio dispositivo) o desde la Edge Function (si hay
  sesión, sin que la clave viaje al cliente). El cliente intenta primero el proxy; si no está
  desplegado (404), sigue con la clave propia — nada se rompe en ningún orden de despliegue.

### Por qué no hay backend propio

Un sitio estático + Supabase alcanza para todo lo que la app necesita (auth, datos privados,
una función serverless) sin mantener un servidor, sin facturar cómputo ocioso, y sin más
superficie de ataque que la de los dos servicios administrados. Añadir un backend propio
sumaría infraestructura sin resolver un problema que hoy exista.

## Seguridad y privacidad

- **La clave de Gemini** vive en dos sitios posibles, nunca en el repositorio: en el
  `localStorage` de quien la pega manualmente (camino sin cuenta), o como secreto de la Edge
  Function (camino con cuenta, ver más abajo). El repositorio nunca contiene una clave capaz
  de gastar cuota de terceros.
- **La `anon key` de Supabase sí vive en `config.js`, en el repo, a propósito**: es pública
  por diseño (la misma que usa cualquier cliente de Supabase) y lo que protege los datos es
  Row Level Security, no el secreto de esa clave.
- **RLS en cada tabla**: `consultas` y `uso_diario` tienen políticas que solo dejan a cada
  usuario leer y escribir sus propias filas (`auth.uid() = user_id`). El límite diario de
  consultas lo escribe únicamente la clave de servicio (`SECURITY DEFINER`); si el cliente
  pudiera escribirlo, el límite no serviría de nada.
- **La Edge Function exige sesión válida** (verifica el `Bearer token` contra
  `auth/v1/user`) antes de gastar la clave de Gemini, y aplica un límite configurable de
  consultas por día por usuario.
- **Nunca se guarda ni se exporta una interpretación vacía o fallida como si fuera válida.**
  Si el modelo no responde tras los reintentos, el estado queda vacío y visible como error.

## Verificar la matemática del escudo y correr los tests

```bash
node scripts/verify-figures.js   # figuras, casas y un caso fijo del escudo
npm install
npm test                          # verificación + suite de Playwright (36 tests)
```

La suite de tests (`tests/`) simula Gemini y Supabase con dobles locales — no necesita
claves ni red para correr — y cubre: la matemática del escudo sobre las 65.536 combinaciones
posibles de Madres, la validación anti-alucinación, que la aleatoriedad no tenga sesgo de
módulo, los recorridos completos de la app (consulta, Markdown renderizado, exportación), la
autenticación, el guardado/borrado en la bitácora, y que el proxy de Gemini se use cuando
está disponible y se degrade a la clave propia cuando no.

El despliegue (`deploy.yml`) depende de que esta suite pase — un error de sintaxis o una
regresión no llegan a publicarse.

## Configuración

### 1. GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions**.

Cada push a `main` corre primero `ci.yml` (tests) y solo si pasa, `deploy.yml` publica el
sitio tal cual está en el repositorio.

### 2. Supabase (bitácora, cuenta y proxy de Gemini)

Todo lo relacionado a Supabase es opcional: sin `config.js` configurado, la app funciona
igual que un sitio sin cuenta ni bitácora, pidiendo la clave de Gemini a cada persona.

1. Crear un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. Cargar en `config.js` la **Project URL** y la **anon key** (Project Settings → Data API).
3. Desactivar **"Confirm email"** en Authentication → Sign In / Providers → Email (el acceso
   es con email + contraseña, no con enlace mágico — ver `PENDIENTE.md` para el porqué).
4. Cargar en **GitHub → Settings → Secrets and variables → Actions** estos secretos:

   | Secreto | De dónde sale |
   |---|---|
   | `SUPABASE_PROJECT_REF` | El ID en la URL del proyecto (ej. `abcdefgh`) |
   | `SUPABASE_ACCESS_TOKEN` | Supabase → cuenta → Access Tokens → generar |
   | `SUPABASE_DB_PASSWORD` | Settings → Database (se puede resetear) |
   | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

5. Con los secretos cargados, el workflow `supabase.yml` (se dispara solo al tocar
   `supabase/**`, o a mano desde la pestaña Actions) aplica las migraciones y despliega la
   Edge Function `interpretar`. Si faltan secretos, el workflow se salta en vez de fallar.

Una vez desplegada la función, cualquier usuario que entre con su cuenta deja de necesitar
su propia clave de Gemini: las consultas pasan por el proxy.

### 3. Respaldo automático de la base

`backup.yml` corre los lunes y commitea al repo (`respaldos/`) un volcado de la base. Usa
los mismos secretos de Supabase; se salta si no están.

## Estructura del repositorio

```
index.html                          Estructura de las pantallas del flujo
style.css                           Estética mobile-first (paleta tierra/arena/cobre)
app.js                              Datos, matemática del escudo, UI, IA, bitácora
config.js                           URL y anon key de Supabase (públicas por diseño)
manifest.json, sw.js, icono-*.png   PWA instalable, con caché para uso sin conexión
scripts/verify-figures.js           Verificación programática del escudo
tests/                              Suite de Playwright (escudo, app, bitácora)
playwright.config.js, package.json  Configuración de los tests

supabase/migrations/                Esquema de la base, versionado
supabase/functions/interpretar/     Edge Function: proxy de la clave de Gemini

.github/workflows/deploy.yml        Deploy a GitHub Pages (depende de ci.yml)
.github/workflows/ci.yml            Tests en cada push/PR
.github/workflows/supabase.yml      Migraciones + despliegue de la Edge Function
.github/workflows/backup.yml        Volcado semanal de la base al repo

PENDIENTE.md                        Traspaso: qué falta, decisiones y trampas conocidas
```
