'use strict';

/* El service worker tiene que dar dos cosas a la vez: que la app abra sin
   conexión, y que un despliegue nuevo no quede servido a medias (página nueva
   con JavaScript viejo). Lo segundo ya rompió el botón de revisar la pregunta. */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const fuenteSw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

test.describe('Estrategia de caché', () => {
  test('no sirve el JavaScript desde la caché antes que de la red', () => {
    // El patrón peligroso es responder con lo guardado y revalidar después:
    // deja la página nueva conviviendo con el script anterior.
    expect(fuenteSw, 'el JS no puede resolverse primero contra la caché')
      .not.toContain('return guardada || desdeRed;');
    // La respuesta arranca por fetch, con la caché solo en el catch.
    const manejador = fuenteSw.slice(fuenteSw.indexOf("addEventListener('fetch'"));
    expect(manejador).toContain('evento.respondWith(\n    fetch(peticion)');
  });

  test('deja pasar de largo lo que no es propio', () => {
    // Gemini, Supabase y los CDN nunca deben interceptarse: son datos vivos.
    expect(fuenteSw).toContain('url.origin !== self.location.origin');
  });

  test('solo intercepta GET', () => {
    expect(fuenteSw).toContain("peticion.method !== 'GET'");
  });
});

test.describe('Funcionamiento sin conexión', () => {
  test('la app abre con la red cortada', async ({ page, context }) => {
    await page.goto('/index.html', { waitUntil: 'networkidle' });

    // Registrar y esperar a que tome el control.
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
    });
    await expect.poll(
      () => page.evaluate(() => !!navigator.serviceWorker.controller),
      { timeout: 15000 }
    ).toBe(true);

    // Una visita más para que los recursos queden guardados.
    await page.reload({ waitUntil: 'networkidle' });

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page).toHaveTitle(/Geomancia/);
      await expect(page.locator('#btn-comenzar')).toBeVisible();
      // El JavaScript también tiene que haber sobrevivido, no solo el HTML.
      expect(await page.evaluate(() => typeof calcularEscudo)).toBe('function');
    } finally {
      await context.setOffline(false);
    }
  });
});
