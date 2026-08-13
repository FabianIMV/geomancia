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

// Resuelve la pantalla previa por su cuenta: recorre el laberinto (mismas
// funciones y estado globales que usa app.js en el navegador) hasta la
// celda final, sin depender de un recorrido fijo.
async function pasarUmbral(page) {
  await page.waitForSelector('#pantalla-portal.activa');
  await page.evaluate(function () {
    function bfs(paredes, inicio, meta) {
      const clave = function (r, c) { return r + ',' + c; };
      const visitado = new Set([clave(inicio.r, inicio.c)]);
      const previo = {};
      const cola = [inicio];
      while (cola.length) {
        const actual = cola.shift();
        if (actual.r === meta.r && actual.c === meta.c) break;
        const p = paredes[actual.r][actual.c];
        const pasos = [];
        if (!p.n) pasos.push({ r: actual.r - 1, c: actual.c, dr: -1, dc: 0 });
        if (!p.s) pasos.push({ r: actual.r + 1, c: actual.c, dr: 1, dc: 0 });
        if (!p.o) pasos.push({ r: actual.r, c: actual.c - 1, dr: 0, dc: -1 });
        if (!p.e) pasos.push({ r: actual.r, c: actual.c + 1, dr: 0, dc: 1 });
        pasos.forEach(function (paso) {
          const k = clave(paso.r, paso.c);
          if (!visitado.has(k)) {
            visitado.add(k);
            previo[k] = { desde: actual, dr: paso.dr, dc: paso.dc };
            cola.push({ r: paso.r, c: paso.c });
          }
        });
      }
      const movimientos = [];
      let cursor = { r: meta.r, c: meta.c };
      while (cursor.r !== inicio.r || cursor.c !== inicio.c) {
        const info = previo[clave(cursor.r, cursor.c)];
        movimientos.unshift({ dr: info.dr, dc: info.dc });
        cursor = info.desde;
      }
      return movimientos;
    }
    const meta = { r: LAB_FILAS - 1, c: LAB_COLS - 1 };
    bfs(laberintoParedes, laberintoPosicion, meta).forEach(function (m) {
      moverLaberinto(m.dr, m.dc);
    });
  });
  await page.waitForSelector('#pantalla-inicio.activa', { timeout: 10000 });
}

// Deja la app lista: clave de Gemini presente, servicios simulados y la
// pantalla previa ya cruzada.
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
};
