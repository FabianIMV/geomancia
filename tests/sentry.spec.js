'use strict';

/* El monitoreo de errores no puede filtrar datos íntimos. Estos tests
   verifican el saneado, que es donde un descuido tendría consecuencias
   reales: las preguntas de una consulta son información personal. */

const { test, expect } = require('@playwright/test');
const path = require('path');
const app = require(path.join(__dirname, '..', 'app.js'));
const { prepararApp } = require('./ayuda');

test.describe('Saneado de datos sensibles', () => {
  test('borra la pregunta y la interpretación del texto', () => {
    const contexto = {
      pregunta: '¿Debería dejar mi trabajo en la empresa?',
      interpretacion: 'El Juez indica un cierre doloroso del ciclo laboral.',
    };
    const texto = 'Falló al procesar "¿Debería dejar mi trabajo en la empresa?" ' +
      'con el resultado: El Juez indica un cierre doloroso del ciclo laboral.';
    const limpio = app.limpiarDatosSensibles(texto, contexto);

    expect(limpio).not.toContain('dejar mi trabajo');
    expect(limpio).not.toContain('cierre doloroso');
    expect(limpio).toContain('[PREGUNTA]');
    expect(limpio).toContain('[INTERPRETACION]');
  });

  test('borra la clave de Gemini de la URL, que viaja en la query', () => {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      'gemini-flash-latest:generateContent?key=AIzaSyD-ejemplo-de-clave-secreta-123';
    const limpio = app.limpiarDatosSensibles(url, {});

    expect(limpio).not.toContain('AIzaSyD-ejemplo');
    expect(limpio).toContain('[CLAVE]');
    // La URL sigue siendo legible para diagnosticar.
    expect(limpio).toContain('gemini-flash-latest');
  });

  test('borra tokens JWT y direcciones de correo', () => {
    const texto = 'Sesión de fabian@ejemplo.com con token ' +
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.firma-de-prueba';
    const limpio = app.limpiarDatosSensibles(texto, {});

    expect(limpio).not.toContain('fabian@ejemplo.com');
    expect(limpio).not.toContain('eyJhbGciOiJIUzI1NiI');
    expect(limpio).toContain('[EMAIL]');
    expect(limpio).toContain('[TOKEN]');
  });

  test('sanea el evento completo, incluidos los campos anidados', () => {
    const contexto = { pregunta: '¿Me van a subir el sueldo este año?', interpretacion: '' };
    const evento = {
      message: 'Error con la consulta ¿Me van a subir el sueldo este año?',
      breadcrumbs: [
        { data: { url: 'https://api.example.com/x?key=AIzaSyClaveDePrueba12345' } },
      ],
      extra: { detalle: 'usuario fabian@ejemplo.com' },
    };
    const limpio = app.limpiarEventoSentry(evento, contexto);
    const serializado = JSON.stringify(limpio);

    expect(serializado).not.toContain('subir el sueldo');
    expect(serializado).not.toContain('AIzaSyClaveDePrueba');
    expect(serializado).not.toContain('fabian@ejemplo.com');
    // La estructura del evento se conserva para que siga sirviendo.
    expect(limpio.breadcrumbs).toHaveLength(1);
  });

  test('no manda nada si el evento no se puede sanear', () => {
    const circular = {};
    circular.yo = circular; // JSON.stringify falla
    expect(app.limpiarEventoSentry(circular, {})).toBeNull();
  });

  test('deja intacto un texto sin nada sensible', () => {
    const texto = 'No se pudo contactar al oráculo tras 3 intentos.';
    expect(app.limpiarDatosSensibles(texto, {})).toBe(texto);
  });
});

test.describe('Activación de Sentry', () => {
  test('sin DSN configurado no se inicia ni se carga nada', async ({ page }) => {
    await page.route('**/bundle.min.js', (ruta) => ruta.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.Sentry = { init: function () { window.__sentryIniciado = true; } };',
    }));
    await prepararApp(page); // config.js de prueba no trae SENTRY_DSN
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__sentryIniciado)).toBeUndefined();
  });

  test('la app funciona igual si el CDN de Sentry no carga', async ({ page }) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.route('**/bundle.min.js', (ruta) => ruta.abort());

    await prepararApp(page);
    await page.click('#btn-comenzar');
    await page.fill('#input-pregunta', '¿Anda sin Sentry?');
    await page.click('#btn-a-generacion');
    await page.waitForSelector('#pantalla-resultado.activa', { timeout: 20000 });
    expect(errores).toEqual([]);
  });
});

test.describe('Configuración real del repositorio', () => {
  const fs = require('fs');

  test('el DSN configurado está bien formado', () => {
    const crudo = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
    const dsn = (crudo.match(/SENTRY_DSN:\s*'([^']*)'/) || [])[1] || '';
    if (!dsn) {
      // Sin DSN no hay monitoreo, pero es una configuración válida.
      return;
    }
    // Un DSN mal escrito rompe Sentry en silencio; conviene que falle acá.
    expect(dsn).toMatch(/^https:\/\/[0-9a-f]+@o\d+\.ingest\.[a-z0-9.]+sentry\.io\/\d+$/);
  });

  test('los fallos que la app atrapa se reportan explícitamente', () => {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    // Sentry solo captura errores no atrapados por su cuenta, y esta app atrapa
    // casi todo: sin estas llamadas, los fallos que importan no llegarían.
    expect(fuente).toContain("reportarError(ultimoError");
    expect(fuente).toContain("'bitacora.guardar'");
    expect(fuente).toContain("'bitacora.leer'");
  });
});

test.describe('Botón de diagnóstico en la app', () => {
  const DSN_PRUEBA = 'https://abc@o1.ingest.us.sentry.io/1';

  test('no aparece si no hay DSN configurado', async ({ page }) => {
    await prepararApp(page); // config.js de prueba no trae SENTRY_DSN
    await expect(page.locator('#btn-probar-sentry')).toBeHidden();
  });

  test('reporta con precisión si el script de Sentry no cargó', async ({ page }) => {
    await prepararApp(page, { supabase: false, sentryDsn: DSN_PRUEBA, sentryBundle: null });

    await expect(page.locator('#btn-probar-sentry')).toBeVisible();
    await page.click('#btn-probar-sentry');
    await expect(page.locator('#estado-sentry')).toContainText('no cargó');
  });

  test('confirma la entrega cuando Sentry responde que se envió', async ({ page }) => {
    const bundle = `window.Sentry = {
      init: function () {},
      captureException: function () { return 'evt-123'; },
      getClient: function () { return { flush: function () { return Promise.resolve(true); } }; },
    };`;
    await prepararApp(page, { supabase: false, sentryDsn: DSN_PRUEBA, sentryBundle: bundle });

    await page.click('#btn-probar-sentry');
    await expect(page.locator('#estado-sentry')).toContainText('Enviado', { timeout: 8000 });
    await expect(page.locator('#estado-sentry')).toContainText('evt-123');
  });

  test('avisa cuando Sentry no confirma la entrega a tiempo', async ({ page }) => {
    const bundle = `window.Sentry = {
      init: function () {},
      captureException: function () { return 'evt-999'; },
      getClient: function () { return { flush: function () { return Promise.resolve(false); } }; },
    };`;
    await prepararApp(page, { supabase: false, sentryDsn: DSN_PRUEBA, sentryBundle: bundle });

    await page.click('#btn-probar-sentry');
    await expect(page.locator('#estado-sentry')).toContainText('no confirmó la entrega', { timeout: 8000 });
  });
});
