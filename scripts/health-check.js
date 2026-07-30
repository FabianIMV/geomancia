'use strict';

/* ==========================================================================
   Chequeo de salud — se ejecuta desde .github/workflows/salud.yml

   Verifica las tres piezas de las que depende la app:
     1. El sitio publicado responde.
     2. La API de Supabase responde (si el proyecto se pausó, esto falla).
     3. La Edge Function del proxy sigue desplegada.

   Además del diagnóstico, este chequeo cumple una función preventiva: el plan
   gratuito de Supabase pausa los proyectos inactivos, y tocarlos con
   regularidad evita que eso ocurra.

   No necesita secretos: la URL y la clave anónima de Supabase son públicas por
   diseño y se leen del propio config.js del repositorio.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const TIEMPO_LIMITE_MS = 15000;

function leerConfig() {
  const crudo = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
  const url = (crudo.match(/SUPABASE_URL:\s*'([^']*)'/) || [])[1] || '';
  const anonKey = (crudo.match(/SUPABASE_ANON_KEY:\s*'([^']*)'/) || [])[1] || '';
  return { url: url.replace(/\/$/, ''), anonKey: anonKey };
}

async function pedir(url, opciones) {
  const controlador = new AbortController();
  const temporizador = setTimeout(function () { controlador.abort(); }, TIEMPO_LIMITE_MS);
  try {
    return await fetch(url, Object.assign({ signal: controlador.signal }, opciones || {}));
  } finally {
    clearTimeout(temporizador);
  }
}

const resultados = [];

function anotar(nombre, ok, detalle) {
  resultados.push({ nombre: nombre, ok: ok, detalle: detalle });
  console.log((ok ? '✓ ' : '✗ ') + nombre + ' — ' + detalle);
}

async function chequearSitio(urlSitio) {
  if (!urlSitio) {
    anotar('Sitio publicado', true, 'omitido (no se indicó URL_SITIO)');
    return;
  }
  try {
    const res = await pedir(urlSitio);
    const cuerpo = res.ok ? await res.text() : '';
    // No alcanza con el 200: GitHub Pages devuelve 200 en su página de error.
    const esLaApp = cuerpo.indexOf('id="app"') !== -1;
    anotar('Sitio publicado', res.ok && esLaApp,
      res.ok
        ? (esLaApp ? 'responde y contiene la app' : 'responde 200 pero el HTML no es la app')
        : ('estado ' + res.status));
  } catch (err) {
    anotar('Sitio publicado', false, 'inalcanzable: ' + err.message);
  }
}

async function chequearBase(cfg) {
  if (!cfg.url || !cfg.anonKey) {
    anotar('API de Supabase', true, 'omitido (Supabase no está configurado)');
    return;
  }
  try {
    const res = await pedir(cfg.url + '/rest/v1/consultas?select=id&limit=1', {
      headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey },
    });
    // Sin sesión, RLS no devuelve filas: lo correcto es 200 con lista vacía.
    // Se exige ese 200 exacto a propósito: cualquier otra cosa (un 401 por
    // clave rotada, un 5xx, o un 403 de algún intermediario) es una señal que
    // conviene mirar, no algo que un chequeo deba dar por bueno.
    if (res.status === 200) {
      anotar('API de Supabase', true, 'responde 200, como corresponde sin sesión');
      return;
    }
    anotar('API de Supabase', false, 'estado ' + res.status +
      ' (se esperaba 200) — ¿proyecto pausado o clave anónima cambiada?');
  } catch (err) {
    anotar('API de Supabase', false, 'inalcanzable: ' + err.message + ' — ¿el proyecto está pausado?');
  }
}

async function chequearFuncion(cfg) {
  if (!cfg.url) {
    anotar('Edge Function interpretar', true, 'omitido (Supabase no está configurado)');
    return;
  }
  try {
    // Se llama a propósito SIN sesión: la función debe rechazar con 401. Ese
    // rechazo es la prueba de que está desplegada y ejecutándose.
    const res = await pedir(cfg.url + '/functions/v1/interpretar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey },
      body: JSON.stringify({ prompt: 'chequeo de salud' }),
    });

    if (res.status === 404) {
      anotar('Edge Function interpretar', false, 'devuelve 404: no está desplegada');
      return;
    }
    if (res.status === 401) {
      anotar('Edge Function interpretar', true, 'viva (rechaza sin sesión, como debe)');
      return;
    }
    // Se conoce la respuesta correcta, así que cualquier otra es sospechosa:
    // un 200 sin sesión sería peor todavía, porque significaría que la función
    // dejó de exigir autenticación.
    anotar('Edge Function interpretar', false,
      'estado inesperado ' + res.status + ' (se esperaba 401)' +
      (res.status === 200 ? ' — ¡está respondiendo SIN exigir sesión!' : ''));
  } catch (err) {
    anotar('Edge Function interpretar', false, 'inalcanzable: ' + err.message);
  }
}

async function principal() {
  const cfg = leerConfig();
  const urlSitio = process.env.URL_SITIO || '';

  console.log('Chequeo de salud — ' + new Date().toISOString());
  console.log('');

  await chequearSitio(urlSitio);
  await chequearBase(cfg);
  await chequearFuncion(cfg);

  const fallos = resultados.filter(function (r) { return !r.ok; });
  console.log('');

  // El workflow lee este archivo para el cuerpo del issue.
  const informe = resultados
    .map(function (r) { return (r.ok ? '- ✅ ' : '- ❌ ') + r.nombre + ': ' + r.detalle; })
    .join('\n');
  try {
    // El salto final no es cosmético: el workflow vuelca este archivo en un
    // bloque delimitado de GITHUB_OUTPUT, y sin él el delimitador de cierre
    // queda pegado a la última línea y Actions rechaza todo el bloque.
    fs.writeFileSync(path.join(__dirname, '..', 'informe-salud.txt'), informe + '\n');
  } catch (err) {
    console.error('No se pudo escribir el informe:', err.message);
  }

  if (fallos.length) {
    console.error(fallos.length + ' chequeo(s) fallido(s).');
    process.exit(1);
  }
  console.log('Todo en orden.');
}

principal().catch(function (err) {
  console.error('El chequeo se cayó:', err);
  process.exit(1);
});
