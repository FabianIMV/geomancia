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
    // `alPedir` deja mirar el prompt que se mandó (para verificar que un
    // seguimiento lleve la memoria de la tirada) y devolver un texto distinto.
    let texto = opciones.texto;
    if (opciones.alPedir) {
      let cuerpo = null;
      try {
        cuerpo = ruta.request().postDataJSON();
      } catch (err) {
        cuerpo = null;
      }
      const prompt = (cuerpo && cuerpo.contents && cuerpo.contents[0].parts[0].text) || '';
      const propuesto = opciones.alPedir(prompt);
      if (propuesto) texto = propuesto;
    }
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
          content: { parts: [{ text: texto || INTERPRETACION_DE_PRUEBA }] },
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
          // La base borra en cascada los seguimientos (origen_id): se imita acá
          // o el test de borrado de un hilo mentiría.
          for (var j = filas.length - 1; j >= 0; j--) {
            if (filas[j].id === val || filas[j].origen_id === val) filas.splice(j, 1);
          }
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

async function stubSupabase(page, activo, sentryDsn) {
  await page.route('**/supabase.min.js', function (ruta) {
    return ruta.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: activo === false ? 'window.supabase = undefined;' : SUPABASE_FALSO,
    });
  });
  await page.route('**/config.js', function (ruta) {
    const base = activo === false
      ? { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }
      : { SUPABASE_URL: 'https://prueba.supabase.co', SUPABASE_ANON_KEY: 'anon-de-prueba' };
    if (sentryDsn) base.SENTRY_DSN = sentryDsn;
    return ruta.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.GEOMANCIA_CONFIG = ' + JSON.stringify(base) + ';',
    });
  });
}

// Secuencia fija para pasar la pantalla del umbral en los tests: no importa
// cuál sea, solo que sea siempre la misma para poder reproducirla.
const SECUENCIA_UMBRAL_DE_PRUEBA = ['Fuego', 'Aire', 'Agua'];

async function trazarSecuenciaUmbral(page, secuencia) {
  for (const elemento of secuencia) {
    await page.click('.elemento-sello[data-elemento="' + elemento + '"]');
  }
  await page.click('#btn-trazar-sello');
}

// La primera vez en cada contexto de test no hay sello guardado: hay que
// trazarlo dos veces (una lo define, otra lo confirma) antes de que se abra
// la pantalla de inicio de verdad.
async function pasarUmbral(page, secuencia) {
  secuencia = secuencia || SECUENCIA_UMBRAL_DE_PRUEBA;
  await page.waitForSelector('#pantalla-portal.activa');
  await trazarSecuenciaUmbral(page, secuencia);
  await trazarSecuenciaUmbral(page, secuencia);
  await page.waitForSelector('#pantalla-inicio.activa', { timeout: 10000 });
}

// Deja la app lista: clave de Gemini presente, servicios simulados y el
// umbral ya cruzado.
async function prepararApp(page, opciones) {
  opciones = opciones || {};
  await stubGemini(page, opciones.gemini);
  await stubSupabase(page, opciones.supabase, opciones.sentryDsn);
  if (opciones.sentryBundle) {
    await page.route('**/bundle.min.js', function (ruta) {
      return ruta.fulfill({ status: 200, contentType: 'application/javascript', body: opciones.sentryBundle });
    });
  } else if (opciones.sentryBundle === null) {
    await page.route('**/bundle.min.js', function (ruta) { return ruta.abort(); });
  }
  await page.addInitScript(function () {
    localStorage.setItem('geomancia_gemini_api_key', 'CLAVE-DE-PRUEBA');
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await pasarUmbral(page);
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
  pasarUmbral,
  SECUENCIA_UMBRAL_DE_PRUEBA,
};
