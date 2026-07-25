'use strict';

/* Utilidades compartidas por los tests: dobles de Gemini y de Supabase, para
   probar la app entera sin depender de servicios externos ni de claves. */

// Texto de interpretación deliberadamente SIN nombres de figuras: el validador
// anti-alucinación rechaza cualquier figura que no esté en el escudo, y el
// escudo es aleatorio en cada tirada.
const INTERPRETACION_DE_PRUEBA = [
  '### Veredicto del Juez',
  'El asunto se inclina con **firmeza**, aunque con *matices*.',
  '',
  '---',
  '',
  '### Camino',
  '- Primer tramo',
  '- Segundo tramo',
  '',
  '### Síntesis',
  'Cierra de manera condicionada.',
].join('\n');

async function stubGemini(page, opciones) {
  opciones = opciones || {};
  await page.route('**generativelanguage.googleapis.com**', async function (ruta) {
    if (opciones.demoraMs) {
      await new Promise(function (r) { setTimeout(r, opciones.demoraMs); });
    }
    if (opciones.fallar) {
      return ruta.fulfill({
        status: opciones.estado || 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 400, message: 'Request contains an invalid argument.' } }),
      });
    }
    return ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{
          finishReason: 'STOP',
          content: { parts: [{ text: opciones.texto || INTERPRETACION_DE_PRUEBA }] },
        }],
      }),
    });
  });
}

// Supabase falso con la misma forma que usa la app. `window.__filas` expone las
// filas guardadas para poder afirmar sobre ellas desde el test.
const SUPABASE_FALSO = `
window.supabase = { createClient: function () {
  var oyentes = [], usuario = null, filas = [], seq = 0;
  window.__filas = filas;
  window.__entrar = function (email) {
    usuario = { id: 'u1', email: email || 'consultante@ejemplo.com' };
    oyentes.forEach(function (cb) { cb('SIGNED_IN', { user: usuario }); });
  };
  function tabla() {
    var api = {
      insert: function (f) { api._ult = Object.assign({ id: 'c' + (++seq), creada_en: new Date().toISOString() }, f); filas.push(api._ult); return api; },
      select: function () { return api; },
      single: function () { return Promise.resolve({ data: api._ult, error: null }); },
      order: function () { return api; },
      limit: function () { return Promise.resolve({ data: filas.slice(), error: null }); },
      update: function (c) { api._cambios = c; return api; },
      delete: function () { api._borrar = true; return api; },
      eq: function (col, val) {
        if (api._borrar) {
          var i = filas.findIndex(function (f) { return f.id === val; });
          if (i >= 0) filas.splice(i, 1);
        } else {
          filas.forEach(function (f) { if (f.id === val) Object.assign(f, api._cambios); });
        }
        return Promise.resolve({ error: null });
      },
    };
    return api;
  }
  return {
    auth: {
      signInWithPassword: function (o) {
        if (o.password === 'clave-correcta') { window.__entrar(o.email); return Promise.resolve({ error: null }); }
        return Promise.resolve({ error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
      },
      signUp: function (o) { window.__entrar(o.email); return Promise.resolve({ data: { session: { user: usuario } }, error: null }); },
      signOut: function () { usuario = null; return Promise.resolve({}); },
      getSession: function () {
        return Promise.resolve({
          data: { session: usuario ? { user: usuario, access_token: 'token-de-prueba' } : null },
        });
      },
      onAuthStateChange: function (cb) { oyentes.push(cb); return { data: { subscription: {} } }; },
    },
    from: tabla,
  };
} };`;

async function stubSupabase(page, activo) {
  await page.route('**/supabase.min.js', function (ruta) {
    return ruta.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: activo === false ? 'window.supabase = undefined;' : SUPABASE_FALSO,
    });
  });
  await page.route('**/config.js', function (ruta) {
    return ruta.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: activo === false
        ? 'window.GEOMANCIA_CONFIG = { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };'
        : 'window.GEOMANCIA_CONFIG = { SUPABASE_URL: "https://prueba.supabase.co", SUPABASE_ANON_KEY: "anon-de-prueba" };',
    });
  });
}

// Deja la app lista: clave de Gemini presente y servicios simulados.
async function prepararApp(page, opciones) {
  opciones = opciones || {};
  await stubGemini(page, opciones.gemini);
  await stubSupabase(page, opciones.supabase);
  await page.addInitScript(function () {
    localStorage.setItem('geomancia_gemini_api_key', 'CLAVE-DE-PRUEBA');
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
}

// Recorre pregunta → generación → resultado.
async function consultar(page, pregunta, tema) {
  await page.click('#btn-comenzar');
  await page.fill('#input-pregunta', pregunta || '¿Sigue en pie el asunto?');
  if (tema) await page.selectOption('#select-tema', tema);
  await page.click('#btn-a-generacion');
  await page.waitForSelector('#pantalla-resultado.activa', { timeout: 20000 });
}

async function iniciarSesion(page, email) {
  await page.click('#btn-sesion');
  await page.fill('#input-email', email || 'consultante@ejemplo.com');
  await page.fill('#input-password', 'clave-correcta');
  await page.click('#btn-entrar');
  await page.waitForSelector('#btn-bitacora:not([hidden])', { timeout: 10000 });
}

module.exports = {
  INTERPRETACION_DE_PRUEBA,
  prepararApp,
  consultar,
  iniciarSesion,
  stubGemini,
  stubSupabase,
};
