# Pendiente — traspaso

Documento de continuidad. Si retomás este proyecto en otra sesión, leé esto
antes de tocar nada.

## Dónde viven las credenciales (decisión tomada)

**No hace falta un vault de terceros.** El proyecto ya tiene dos almacenes de
secretos gratuitos y suficientes, y sumar un tercero (Doppler, Infisical, Vault)
agregaría una dependencia y un punto de fallo sin ganancia real para una app
personal:

| Dónde | Para qué | Cómo se carga |
|---|---|---|
| **GitHub Actions Secrets** | Secretos de *build*: desplegar funciones, correr migraciones, hacer backups | Repo → Settings → Secrets and variables → Actions |
| **Supabase Edge Function secrets** | Secretos de *runtime*: la clave de Gemini que usa el proxy | `supabase secrets set NOMBRE=valor` (o desde el panel) |
| `config.js` (en el repo) | Solo la URL y la **anon key** de Supabase | Ya está. Son públicas por diseño; lo que protege es RLS |

Regla que no se rompe: **la `service_role` key y la contraseña de la base nunca
se pegan en el chat ni se commitean**. Se cargan directo en GitHub Secrets.

### Secretos a crear (nombres exactos que esperan los workflows)

| Secreto | De dónde sale |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase → cuenta → Access Tokens → generar |
| `SUPABASE_PROJECT_REF` | `cvzcjrhxifecieeefdpq` (está en la URL del proyecto) |
| `SUPABASE_DB_PASSWORD` | Settings → Database (se puede resetear) |
| `GEMINI_API_KEY` | Google AI Studio. Conviene **generar una nueva** y revocar la actual |

---

## Estado actual

Funciona y está desplegado en GitHub Pages desde `main`:

- Escudo geomántico completo con verificación matemática (el Juez corta con
  `throw` si sale impar)
- Tirada automática con `crypto.getRandomValues`, sin sesgo de módulo
- Interpretación con Gemini: cadena de 3 modelos, reintento sin `thinkingConfig`
  ante `400 INVALID_ARGUMENT`, validación anti-alucinación con 2 reintentos
  correctivos, y **sin lectura de respaldo** (si el modelo falla, se dice)
- Bitácora privada en Supabase con RLS, guardado opcional, verificación
  posterior, borrado y export en Markdown/JSON
- PWA instalable con service worker (red primero para HTML)
- **CI con 33 tests que bloquea el despliegue** (`.github/workflows/ci.yml`)

## Lo que falta, por prioridad

### 1. Proxy de la clave de Gemini (seguridad — lo más urgente)

**Problema:** hoy la clave de Gemini vive en el `localStorage` del navegador y
viaja desde el cliente. Cualquiera que abra las herramientas de desarrollo la ve.

**Solución:** una Edge Function de Supabase que reciba el prompt, le agregue la
clave del lado del servidor, llame a Gemini y devuelva el texto.

Pasos:

1. Crear `supabase/functions/interpretar/index.ts`:
   - Verificar el JWT del usuario (`Authorization: Bearer`) contra Supabase;
     rechazar si no hay sesión válida
   - Leer `GEMINI_API_KEY` de `Deno.env.get`
   - Replicar la cadena de modelos y el `generationConfig` que hoy están en
     `app.js` (`GEMINI_MODEL_CANDIDATES`, `temperature 0.6`, `topP 0.9`,
     `maxOutputTokens 4096`, `thinkingConfig` con el fallback ante 400)
   - Devolver `{ texto }` o `{ error }` con el status real, para no perder el
     diagnóstico que tanto costó conseguir
2. En `app.js`, reemplazar `llamarGemini` por una llamada a la función, dejando
   el camino con clave propia como alternativa si la función no está configurada
3. Workflow `.github/workflows/supabase.yml` que despliegue la función con
   `supabase functions deploy interpretar` usando `SUPABASE_ACCESS_TOKEN`
4. Actualizar los tests: hoy `tests/ayuda.js` simula
   `**generativelanguage.googleapis.com**`; habrá que simular también el
   endpoint de la función

**Ojo:** la validación anti-alucinación debe quedar en el cliente *o* moverse a
la función, pero no desaparecer. Es lo que evita que el modelo cite figuras que
no están en la tirada — ya pasó en producción.

### 2. Migraciones versionadas

Hoy `supabase-schema.sql` es un archivo suelto que se corrió a mano. Pasar a
`supabase/migrations/NNNN_descripcion.sql` y aplicarlas desde CI con
`supabase db push`. Sin esto no hay forma de saber qué versión tiene la base.

### 3. Rate limiting

Nada impide gastar la cuota de Gemini con 200 consultas seguidas. Tabla
`uso_diario (user_id, fecha, consultas)` con RLS, y el chequeo dentro de la
Edge Function del punto 1 (en el cliente no sirve: se puede saltar).

### 4. Registro de errores

Tabla `errores` donde el cliente escriba los fallos (mensaje, contexto, fecha)
para poder diagnosticar sin depender de capturas de pantalla.

### 5. Backup automático

Workflow programado (`schedule: cron`) que exporte la bitácora y la commitee al
repo. El plan gratuito de Supabase pausa proyectos inactivos y no garantiza
backups.

### 6. Estadísticas de acierto (producto, no infra)

Pantalla con tasa de acierto global y por tema/figura del Juez. Los datos ya se
guardan (`acierto`, `resultado_real`); falta leerlos y mostrarlos.

---

## Cosas aprendidas que conviene no reaprender a los golpes

- **El texto de prueba de los tests no puede nombrar figuras geománticas.** El
  escudo es aleatorio y el validador rechaza cualquier figura ausente; los tests
  se vuelven intermitentes. Ver `INTERPRETACION_DE_PRUEBA` en `tests/ayuda.js`.
- **`gemini-flash-lite-latest` rechaza `thinkingConfig`** con un
  `400 INVALID_ARGUMENT` genérico que no menciona el campo. Por eso el reintento
  se dispara ante cualquier 400, no solo si el mensaje dice "thinking".
- **Supabase usa `localStorage` crudo para la sesión.** Su prueba de soporte
  escribe una clave diminuta; si el espacio está casi lleno, la prueba pasa pero
  la escritura real lanza `QuotaExceededError` y aborta el login. Por eso hay un
  adaptador propio en `iniciarSupabase()` que nunca lanza.
- **El correo incluido de Supabase no permite editar plantillas sin SMTP propio**
  y tiene un límite de envío muy bajo. Por eso el acceso es con contraseña y no
  con enlace mágico. Requiere "Confirm email" desactivado.
- **El entorno de Claude Code tiene bloqueada la salida a `supabase.co`.** No se
  puede verificar la conexión real desde la sesión; hay que probar en el celular.
- **Para correr los tests en ese entorno** hace falta apuntar al Chromium ya
  instalado: `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
  npx playwright test`. En CI no hace falta.

## Lo que no hay que tocar

La matemática del escudo (transposición de Hijas, sumas XOR, Testigos, Juez),
los datos de las 16 figuras, el flujo de pantallas y la estética.
