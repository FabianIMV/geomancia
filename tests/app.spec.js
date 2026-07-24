'use strict';

/* Recorridos de la app en el navegador. Cubren las regresiones que ya nos
   mordieron una vez: markdown sin renderizar, interpretación vacía guardada
   como válida, pregunta arrastrada entre consultas y export incompleto. */

const { test, expect } = require('@playwright/test');
const { prepararApp, consultar, iniciarSesion, stubGemini } = require('./ayuda');

test.describe('Consulta completa', () => {
  test('calcula el escudo, muestra el Juez y las 12 casas', async ({ page }) => {
    await prepararApp(page);
    await consultar(page, '¿Prospera el proyecto?');

    await expect(page.locator('#juez-destacado .figura-nombre')).not.toBeEmpty();
    await expect(page.locator('#carta-casas .casa')).toHaveCount(12);
    await expect(page.locator('#escudo-completo .figura')).toHaveCount(16);
  });

  test('no hay nada que trazar a mano: la tirada es automática', async ({ page }) => {
    await prepararApp(page);
    await page.click('#btn-comenzar');
    await page.fill('#input-pregunta', '¿Es automático?');
    await page.click('#btn-a-generacion');
    await expect(page.locator('#zona-toque')).toHaveCount(0);
    await expect(page.locator('#selector-modo')).toHaveCount(0);
    await page.waitForSelector('#pantalla-resultado.activa', { timeout: 20000 });
  });

  test('dos tiradas seguidas dan escudos distintos', async ({ page }) => {
    await prepararApp(page);
    const vistos = [];
    for (let i = 0; i < 3; i++) {
      if (i > 0) await page.click('#btn-nueva-consulta');
      await consultar(page, 'tirada ' + i);
      vistos.push(await page.evaluate(() => JSON.stringify(estado.lineas)));
    }
    expect(new Set(vistos).size).toBeGreaterThan(1);
  });

  test('muestra la figura animada mientras espera la interpretación', async ({ page }) => {
    await prepararApp(page, { gemini: { demoraMs: 1500 } });
    await consultar(page, '¿Se ve la espera?');
    await expect(page.locator('#interpretacion-cargando')).toBeVisible();
    await expect(page.locator('#figura-cargando .punto').first()).toBeVisible();
    await expect(page.locator('#interpretacion-cargando')).toBeHidden({ timeout: 20000 });
  });
});

test.describe('Renderizado de la interpretación', () => {
  test('los títulos y las reglas del Markdown no salen literales', async ({ page }) => {
    await prepararApp(page);
    await consultar(page, '¿Se ve bien el formato?');
    const texto = page.locator('#interpretacion-texto');
    await expect(texto.locator('h4').first()).toBeVisible({ timeout: 20000 });

    const html = await texto.innerHTML();
    expect(html, 'quedaron ### sin renderizar').not.toContain('###');
    expect(html, 'quedaron --- sin renderizar').not.toContain('---');
    expect(html).toContain('<hr>');
    expect(html).toContain('<strong>firmeza</strong>');
    expect(html).toContain('<em>matices</em>');
    await expect(texto.locator('ul li')).toHaveCount(2);
  });

  test('el texto visible no conserva marcas de Markdown', async ({ page }) => {
    await prepararApp(page);
    await consultar(page, '¿Sin asteriscos?');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
    const visible = await page.locator('#interpretacion-texto').innerText();
    expect(visible).not.toContain('**');
    expect(visible).not.toContain('###');
  });
});

test.describe('Fallos del modelo', () => {
  test('si el modelo falla no se inventa una lectura de respaldo', async ({ page }) => {
    await prepararApp(page, { gemini: { fallar: true } });
    await consultar(page, '¿Qué pasa si falla?');

    await expect(page.locator('#interpretacion-estado')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#interpretacion-estado')).toContainText('No se pudo obtener');
    await expect(page.locator('#interpretacion-texto')).toBeEmpty();
    await expect(page.locator('#btn-reintentar')).toBeVisible();
    // Nunca debe quedar una interpretación falsa en el estado.
    expect(await page.evaluate(() => estado.interpretacion)).toBe('');
  });

  test('el error real de la API queda visible para diagnosticar', async ({ page }) => {
    await prepararApp(page, { gemini: { fallar: true } });
    await consultar(page, '¿Se ve el error?');
    await expect(page.locator('#interpretacion-estado')).toContainText('Último error', { timeout: 60000 });
  });
});

test.describe('La pregunta no se arrastra', () => {
  test('tras consultar, la pantalla de pregunta aparece vacía', async ({ page }) => {
    await prepararApp(page);
    await consultar(page, 'primera pregunta');
    await page.click('#btn-nueva-consulta');
    await page.click('#btn-comenzar');
    await expect(page.locator('#input-pregunta')).toHaveValue('');
  });

  test('un borrador sin consultar se conserva al ir y volver', async ({ page }) => {
    await prepararApp(page);
    await page.click('#btn-comenzar');
    await page.fill('#input-pregunta', 'borrador a medio escribir');
    await page.click('#btn-atras-pregunta');
    await page.click('#btn-comenzar');
    await expect(page.locator('#input-pregunta')).toHaveValue('borrador a medio escribir');
  });
});

test.describe('Exportar la lectura', () => {
  test('el Markdown copiado permite auditar la tirada entera', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await prepararApp(page);
    await consultar(page, '¿Está completo el export?', 'trabajo');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });

    const md = await page.evaluate(() => construirMarkdownExport());
    expect(md).toContain('## Semilla (las 4 Madres)');
    expect(md, 'faltan las Hijas').toContain('## Hijas');
    expect(md, 'falta la carta de casas').toContain('## Carta de 12 casas');
    expect(md, 'no se marca la casa del tema').toContain('casa del tema');
    for (let i = 1; i <= 12; i++) expect(md).toContain('Casa ' + i + ' (');
  });

  test('lo copiado va sin marcas de Markdown en texto plano', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await prepararApp(page);
    await consultar(page, '¿Copia limpio?');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
    const plano = await page.evaluate(() => markdownATextoPlano(construirMarkdownExport()));
    expect(plano).not.toContain('##');
    expect(plano).not.toContain('**');
  });
});

test.describe('Sin bitácora configurada', () => {
  test('la app funciona igual y no ofrece cuenta', async ({ page }) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await prepararApp(page, { supabase: false });

    await expect(page.locator('#btn-sesion')).toBeHidden();
    await expect(page.locator('#btn-bitacora')).toBeHidden();

    await consultar(page, '¿Anda sin cuenta?');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#bloque-guardado')).toBeHidden();
    expect(errores).toEqual([]);
  });
});
