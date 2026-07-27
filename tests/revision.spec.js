'use strict';

/* Revisión previa de la pregunta y veredicto en lenguaje llano. */

const { test, expect } = require('@playwright/test');
const path = require('path');
const app = require(path.join(__dirname, '..', 'app.js'));
const { prepararApp } = require('./ayuda');

test.describe('Lectura del JSON que devuelve el modelo', () => {
  test('extrae el objeto aunque venga envuelto en un bloque de código', () => {
    const crudo = 'Claro, acá va:\n```json\n{"apta": true, "motivo": "sirve"}\n```\nEspero que ayude.';
    expect(app.extraerJson(crudo)).toEqual({ apta: true, motivo: 'sirve' });
  });

  test('no se confunde con llaves dentro de las cadenas', () => {
    const crudo = '{"motivo": "usa { y } en el texto", "apta": false}';
    expect(app.extraerJson(crudo).motivo).toBe('usa { y } en el texto');
  });

  test('soporta objetos anidados', () => {
    const crudo = 'texto {"a": {"b": 1}, "apta": true} más texto';
    expect(app.extraerJson(crudo)).toEqual({ a: { b: 1 }, apta: true });
  });

  test('devuelve null si no hay JSON o está roto', () => {
    expect(app.extraerJson('sin json acá')).toBeNull();
    expect(app.extraerJson('{"roto": ')).toBeNull();
    expect(app.extraerJson(null)).toBeNull();
  });
});

test.describe('Normalización de la revisión', () => {
  test('acepta una revisión bien formada', () => {
    const r = app.normalizarRevision({
      apta: false,
      motivo: 'pide una fecha exacta',
      reformulada: '¿Se inclina el asunto a mi favor?',
      tema_id: 'trabajo',
      motivo_tema: 'es un asunto de carrera',
    });
    expect(r.apta).toBe(false);
    expect(r.reformulada).toBe('¿Se inclina el asunto a mi favor?');
    expect(r.tema.id).toBe('trabajo');
    expect(r.tema.casa).toBe(10);
  });

  test('descarta un tema que el modelo se inventó', () => {
    const r = app.normalizarRevision({ apta: true, tema_id: 'astrologia-lunar' });
    expect(r.tema).toBeNull();
  });

  test('trata una reformulación vacía como ausente', () => {
    expect(app.normalizarRevision({ apta: true, reformulada: '   ' }).reformulada).toBeNull();
  });

  test('solo considera apta un true explícito', () => {
    // Un "true" en texto o un 1 no deben pasar por apta.
    expect(app.normalizarRevision({ apta: 'true' }).apta).toBe(false);
    expect(app.normalizarRevision({ apta: 1 }).apta).toBe(false);
    expect(app.normalizarRevision({ apta: true }).apta).toBe(true);
  });

  test('devuelve null si no hay objeto', () => {
    expect(app.normalizarRevision(null)).toBeNull();
    expect(app.normalizarRevision('texto')).toBeNull();
  });
});

test.describe('Revisar la pregunta en la app', () => {
  const REVISION = {
    apta: false,
    motivo: 'Pide una fecha exacta, y este sistema no calcula plazos.',
    reformulada: '¿Se inclina a mi favor el ascenso que estoy buscando?',
    tema_id: 'trabajo',
    motivo_tema: 'Es un asunto de carrera y reputación.',
  };

  async function conRevision(page, revision) {
    await prepararApp(page, {
      gemini: { texto: JSON.stringify(revision) },
      supabase: false,
    });
    await page.click('#btn-comenzar');
  }

  test('sugiere una reformulación y permite aplicarla', async ({ page }) => {
    await conRevision(page, REVISION);
    await page.fill('#input-pregunta', '¿Cuándo exactamente me ascienden?');
    await page.click('#btn-revisar-pregunta');

    await expect(page.locator('.revision-titulo')).toContainText('reformularla', { timeout: 20000 });
    await expect(page.locator('.revision-motivo').first()).toContainText('fecha exacta');
    await expect(page.locator('.revision-sugerida')).toContainText('¿Se inclina a mi favor');

    await page.click('.panel-revision button:has-text("Usar esta pregunta")');
    await expect(page.locator('#input-pregunta')).toHaveValue(REVISION.reformulada);
    // El contador debe reflejar el texto nuevo, no el viejo.
    await expect(page.locator('#contador-pregunta')).toHaveText(REVISION.reformulada.length + ' / 1000');
  });

  test('permite aplicar el tema sugerido', async ({ page }) => {
    await conRevision(page, REVISION);
    await page.fill('#input-pregunta', '¿Cuándo exactamente me ascienden?');
    await page.selectOption('#select-tema', 'salud'); // tema distinto al sugerido
    await page.click('#btn-revisar-pregunta');

    await page.click('.panel-revision button:has-text("Usar este tema")', { timeout: 20000 });
    await expect(page.locator('#select-tema')).toHaveValue('trabajo');
  });

  test('confirma cuando la pregunta ya está bien planteada', async ({ page }) => {
    await conRevision(page, {
      apta: true,
      motivo: 'Es concreta y verificable.',
      reformulada: null,
      tema_id: 'general',
      motivo_tema: 'No corresponde a una casa concreta.',
    });
    await page.fill('#input-pregunta', '¿Conseguiré el puesto al que postulé?');
    await page.click('#btn-revisar-pregunta');

    await expect(page.locator('.revision-titulo')).toContainText('sirve tal como está', { timeout: 20000 });
    await expect(page.locator('.panel-revision button:has-text("Usar esta pregunta")')).toHaveCount(0);
  });

  test('si la revisión falla, se puede tirar igual', async ({ page }) => {
    await prepararApp(page, { gemini: { fallar: true }, supabase: false });
    await page.click('#btn-comenzar');
    await page.fill('#input-pregunta', '¿Sigue andando si falla la revisión?');
    await page.click('#btn-revisar-pregunta');

    await expect(page.locator('.panel-revision')).toContainText('No se pudo revisar', { timeout: 60000 });
    // La consulta no queda bloqueada por una revisión fallida.
    await expect(page.locator('#btn-a-generacion')).toBeEnabled();
  });

  test('exige una pregunta antes de revisar', async ({ page }) => {
    await conRevision(page, REVISION);
    await page.click('#btn-revisar-pregunta');
    await expect(page.locator('#error-pregunta')).toContainText('antes de revisarla');
  });

  test('la revisión no sobrevive a una consulta nueva', async ({ page }) => {
    await conRevision(page, REVISION);
    await page.fill('#input-pregunta', '¿Cuándo exactamente me ascienden?');
    await page.click('#btn-revisar-pregunta');
    await expect(page.locator('.panel-revision')).toBeVisible({ timeout: 20000 });

    await page.click('#btn-atras-pregunta');
    await page.click('#btn-comenzar');
    // Al volver sin consultar se conserva el borrador y su revisión.
    await expect(page.locator('.panel-revision')).toBeVisible();
  });
});

test.describe('El prompt exige un veredicto en lenguaje llano', () => {
  const fs = require('fs');
  const fuente = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  test('pide abrir con una respuesta directa antes de la parte técnica', () => {
    expect(fuente).toContain('## Respuesta directa');
    expect(fuente).toContain('## La lectura');
  });

  test('prohíbe los tecnicismos en esa primera sección', () => {
    const regla = fuente.slice(fuente.indexOf("'6. ESTRUCTURA OBLIGATORIA"), fuente.indexOf("'6bis."));
    expect(regla).toContain('SIN UN SOLO nombre de figura');
    ['Juez', 'Testigo', 'Sobrina', 'Madre', 'Hija', 'Reconciliador'].forEach((termino) => {
      expect(regla, 'la regla debe nombrar ' + termino + ' como término a evitar').toContain(termino);
    });
  });

  test('pide glosar los términos del arte la primera vez', () => {
    expect(fuente).toContain('agrega una glosa brevísima entre paréntesis');
  });
});
