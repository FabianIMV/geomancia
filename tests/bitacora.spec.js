'use strict';

/* Cuenta, guardado opcional, verificación posterior, borrado y respaldo. */

const { test, expect } = require('@playwright/test');
const { prepararApp, consultar, iniciarSesion, stubGemini } = require('./ayuda');

test.describe('Acceso', () => {
  test('rechaza credenciales incorrectas con un mensaje accionable', async ({ page }) => {
    await prepararApp(page);
    await page.click('#btn-sesion');
    await page.fill('#input-email', 'consultante@ejemplo.com');
    await page.fill('#input-password', 'clave-equivocada');
    await page.click('#btn-entrar');
    await expect(page.locator('#error-sesion')).toContainText('incorrectos');
  });

  test('valida el email y el largo de la contraseña antes de llamar al servicio', async ({ page }) => {
    await prepararApp(page);
    await page.click('#btn-sesion');
    await page.fill('#input-email', 'no-es-un-email');
    await page.fill('#input-password', 'clave-correcta');
    await page.click('#btn-entrar');
    await expect(page.locator('#error-email')).toContainText('email válido');

    await page.fill('#input-email', 'consultante@ejemplo.com');
    await page.fill('#input-password', '123');
    await page.click('#btn-entrar');
    await expect(page.locator('#error-email')).toContainText('6 caracteres');
  });

  test('entra y muestra la sesión abierta', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await expect(page.locator('#estado-sesion')).toContainText('consultante@ejemplo.com');
    await expect(page.locator('#btn-sesion')).toBeHidden();
  });

  test('el ingreso sobrevive a un almacenamiento lleno', async ({ page }) => {
    // Safari lanza QuotaExceededError al escribir la sesión si no hay espacio.
    await page.addInitScript(() => {
      const real = window.localStorage.setItem.bind(window.localStorage);
      window.localStorage.setItem = function (k, v) {
        if (String(v).length > 200) {
          const e = new Error('The quota has been exceeded.');
          e.name = 'QuotaExceededError';
          throw e;
        }
        return real(k, v);
      };
    });
    await prepararApp(page);
    await iniciarSesion(page);
    await expect(page.locator('#btn-bitacora')).toBeVisible();
  });
});

test.describe('Guardado opcional', () => {
  test('no guarda sin que el consultante lo pida', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await consultar(page, '¿Se guarda solo?');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });

    await expect(page.locator('#bloque-guardado')).toBeVisible();
    expect(await page.evaluate(() => window.__filas.length)).toBe(0);
  });

  test('guarda y permite quitar lo guardado', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await consultar(page, '¿Guardar y quitar?');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });

    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');
    expect(await page.evaluate(() => window.__filas.length)).toBe(1);

    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Guardar en mi bitácora');
    expect(await page.evaluate(() => window.__filas.length)).toBe(0);
  });

  test('lo guardado conserva el escudo completo para poder auditarlo', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await consultar(page, '¿Guarda todo el escudo?', 'trabajo');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');

    const fila = await page.evaluate(() => window.__filas[0]);
    ['madres', 'hijas', 'sobrinas', 'casas'].forEach((k) => {
      expect(Array.isArray(fila[k]), 'falta ' + k).toBe(true);
      expect(fila[k].length).toBeGreaterThan(0);
    });
    ['testigo_derecho', 'testigo_izquierdo', 'juez', 'reconciliador'].forEach((k) => {
      expect(fila[k], 'falta ' + k).toHaveLength(4);
    });
    expect(fila.casas).toHaveLength(12);
    expect(fila.acierto).toBe('sin_verificar');
    expect(fila.interpretacion.length).toBeGreaterThan(0);
  });
});

test.describe('Bitácora', () => {
  async function guardarUna(page, pregunta) {
    await consultar(page, pregunta);
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');
  }

  test('redibuja el escudo y las casas de una consulta guardada', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Se puede auditar después?');

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');

    // Se dibuja recién al abrir, para no cargar la lista de entrada.
    await expect(page.locator('.entrada-cuerpo .bloque-escudo .figura')).toHaveCount(0);
    await page.click('.entrada-cuerpo .bloque-escudo > summary');
    await expect(page.locator('.entrada-cuerpo .bloque-escudo .figura')).toHaveCount(16);

    await page.click('.entrada-cuerpo .bloque-casas > summary');
    await expect(page.locator('.entrada-cuerpo .bloque-casas .casa')).toHaveCount(12);
  });

  test('registra la verificación posterior', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Se verifica?');

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');
    await page.fill('.verificacion textarea', 'Ocurrió tal cual.');
    await page.click('.btn-acierto:has-text("Acertó")');
    await page.click('.verificacion .btn-secundario');

    await expect(page.locator('.marca-acierto')).toHaveText('Acertó');
    const fila = await page.evaluate(() => window.__filas[0]);
    expect(fila.resultado_real).toBe('Ocurrió tal cual.');
    expect(fila.acierto).toBe('acerto');
  });

  test('elimina una entrada pidiendo confirmación', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Se puede borrar?');

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');
    await page.click('.zona-borrado .btn-enlace-peligro');
    await expect(page.locator('.confirmar-borrado')).toBeVisible();

    await page.click('.confirmar-borrado .btn-quitar');
    await expect(page.locator('.entrada-bitacora')).toHaveCount(0);
    expect(await page.evaluate(() => window.__filas.length)).toBe(0);
    await expect(page.locator('#estado-bitacora')).toContainText('Todavía no hay consultas');
  });

  test('exporta el respaldo con el escudo y las 12 casas', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Sirve el respaldo?');

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');
    await expect(page.locator('#bloque-exportar')).toBeVisible();

    const md = await page.evaluate(() => bitacoraAMarkdown(consultasCargadas));
    expect(md).toContain('# Bitácora de geomancia');
    expect(md).toContain('### Hijas');
    expect(md).toContain('### Carta de 12 casas');
    expect(md).toContain('¿Sirve el respaldo?');

    const descarga = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btn-exportar-json'),
    ]);
    expect(descarga[0].suggestedFilename()).toMatch(/^bitacora-geomancia-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

test.describe('Hilos', () => {
  // Sin nombres de figuras: el escudo es aleatorio y el validador
  // anti-alucinación rechazaría cualquiera que no esté en la tirada.
  const LECTURA_DE_HILO = [
    '## Respuesta directa',
    '**Sí, pero…** el asunto sigue inclinándose igual que la vez pasada.',
    '',
    '## La lectura',
    'La sentencia se sostiene y el camino no cambió de signo.',
  ].join('\n');

  async function guardarUna(page, pregunta, tema) {
    await consultar(page, pregunta, tema);
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');
    await page.click('#btn-nueva-consulta');
  }

  // Sigue el asunto de la primera entrada de la bitácora y guarda el resultado.
  async function seguirAsunto(page, pregunta) {
    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');
    await page.click('.entrada-bitacora > .entrada-cuerpo > .btn-seguir-asunto');
    await expect(page.locator('#pantalla-pregunta.activa')).toBeVisible();
    await page.fill('#input-pregunta', pregunta);
    await page.click('#btn-a-generacion');
    await page.waitForSelector('#pantalla-resultado.activa', { timeout: 20000 });
    // La pantalla se activa ANTES de pedir la interpretación: hay que esperar a
    // que la lectura esté, o se lee el prompt antes de que se haya mandado.
    await page.waitForSelector('#bloque-guardado:not([hidden])', { timeout: 20000 });
  }

  test('seguir un asunto traza una tirada nueva y la cuelga del hilo', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Conseguiré el trabajo?');

    await stubGemini(page, { texto: LECTURA_DE_HILO });
    await seguirAsunto(page, '¿Y un mes después, cómo sigue?');

    // La lectura se ve sin abrir nada: es la regresión que motivó el rediseño.
    await expect(page.locator('#interpretacion-texto')).toContainText('Respuesta directa');
    await expect(page.locator('#cartel-hilo-resultado')).toContainText('¿Conseguiré el trabajo?');

    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');

    const filas = await page.evaluate(() => window.__filas);
    expect(filas).toHaveLength(2);
    expect(filas[1].origen_id).toBe(filas[0].id);
    expect(filas[1].tema_id).toBe(filas[0].tema_id);
    // Es una tirada NUEVA: el escudo no se copió del anterior.
    expect(filas[1].madres).not.toEqual(filas[0].madres);
  });

  test('el prompt del paso siguiente lleva la memoria del asunto', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Conseguiré el trabajo?');

    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');
    await page.fill('.verificacion textarea', 'Me llamaron para una segunda entrevista.');
    await page.click('.btn-acierto:has-text("Parcial")');
    await page.click('.verificacion .btn-secundario');
    await expect(page.locator('.marca-acierto').first()).toHaveText('Parcial');
    await page.click('#btn-volver-bitacora');

    const prompts = [];
    await stubGemini(page, {
      texto: LECTURA_DE_HILO,
      alPedir: (prompt) => { prompts.push(prompt); },
    });
    await seguirAsunto(page, '¿Conviene insistir con ellos?');

    const prompt = prompts[prompts.length - 1];
    expect(prompt).toContain('ESTA CONSULTA CONTINÚA UN ASUNTO YA CONSULTADO');
    expect(prompt).toContain('--- ANTES EN ESTE MISMO ASUNTO ---');
    expect(prompt).toContain('¿Conseguiré el trabajo?');
    expect(prompt).toContain('Juez de aquella tirada:');
    expect(prompt).toContain('Me llamaron para una segunda entrevista.');
    expect(prompt).toContain('¿Conviene insistir con ellos?');
    // El escudo de hoy sigue estando, y es el que juzga.
    expect(prompt).toContain('--- ESCUDO COMPLETO ---');
    // El proxy rechaza por encima de 20000; el constructor recorta antes.
    expect(prompt.length).toBeLessThanOrEqual(18000);
  });

  test('salir del hilo deja la consulta suelta', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Sigo en el hilo?');

    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');
    await page.click('.entrada-bitacora > .entrada-cuerpo > .btn-seguir-asunto');
    await expect(page.locator('#cartel-hilo-pregunta')).toContainText('¿Sigo en el hilo?');

    await page.click('#cartel-hilo-pregunta .btn-enlace');
    await expect(page.locator('#cartel-hilo-pregunta')).toBeHidden();

    await page.fill('#input-pregunta', '¿Esta es suelta?');
    await page.click('#btn-a-generacion');
    await page.waitForSelector('#pantalla-resultado.activa', { timeout: 20000 });
    await expect(page.locator('#cartel-hilo-resultado')).toBeHidden();
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');

    const filas = await page.evaluate(() => window.__filas);
    expect(filas[1].origen_id).toBeFalsy();
  });

  test('encadena tres consultas sobre el mismo asunto', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Cómo viene el asunto?');

    const prompts = [];
    await stubGemini(page, {
      texto: LECTURA_DE_HILO,
      alPedir: (prompt) => { prompts.push(prompt); },
    });

    await seguirAsunto(page, '¿Segundo paso?');
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');
    await page.click('#btn-nueva-consulta');

    await seguirAsunto(page, '¿Tercer paso?');
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');

    const ultimo = prompts[prompts.length - 1];
    expect(ultimo).toContain('¿Cómo viene el asunto?');
    expect(ultimo).toContain('¿Segundo paso?');
    expect(ultimo).toContain('[2]');

    const filas = await page.evaluate(() => window.__filas);
    expect(filas).toHaveLength(3);
    // El hilo es plano: los tres cuelgan de la raíz.
    expect(filas[1].origen_id).toBe(filas[0].id);
    expect(filas[2].origen_id).toBe(filas[0].id);

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');
    await expect(page.locator('.entrada-bitacora')).toHaveCount(1);
    await expect(page.locator('.entrada-bitacora > summary .entrada-meta'))
      .toContainText('hilo de 3 consultas');
  });

  test('borrar la consulta raíz se lleva el hilo entero', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Se puede borrar el hilo?');

    await stubGemini(page, { texto: LECTURA_DE_HILO });
    await seguirAsunto(page, '¿Y con esto qué pasa?');
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');
    await page.click('.entrada-bitacora > summary');
    await expect(page.locator('.entrada-hilo')).toHaveCount(1);

    const borradoRaiz = '.entrada-bitacora > .entrada-cuerpo > .zona-borrado';
    await page.click(borradoRaiz + ' .btn-enlace-peligro');
    await expect(page.locator(borradoRaiz + ' .confirmar-borrado')).toContainText('1 seguimiento');
    await page.click(borradoRaiz + ' .confirmar-borrado .btn-quitar');

    await expect(page.locator('.entrada-bitacora')).toHaveCount(0);
    expect(await page.evaluate(() => window.__filas.length)).toBe(0);
    await expect(page.locator('#estado-bitacora')).toContainText('Todavía no hay consultas');
  });

  test('filtra por tema y ordena la bitácora', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Cómo va el trabajo?', 'trabajo');
    await guardarUna(page, '¿Cómo va el viaje?', 'viaje');

    await page.click('#btn-bitacora');
    await expect(page.locator('.entrada-bitacora')).toHaveCount(2);
    await expect(page.locator('.entrada-bitacora .entrada-pregunta').first())
      .toHaveText('¿Cómo va el viaje?');

    await page.selectOption('#orden-bitacora', 'antiguas');
    await expect(page.locator('.entrada-bitacora .entrada-pregunta').first())
      .toHaveText('¿Cómo va el trabajo?');

    await page.selectOption('#filtro-tema', 'viaje');
    await expect(page.locator('.entrada-bitacora')).toHaveCount(1);

    await page.selectOption('#filtro-tema', 'salud');
    await expect(page.locator('.entrada-bitacora')).toHaveCount(0);
    await expect(page.locator('#estado-bitacora')).toContainText('Ninguna consulta de ese tema');
  });

  test('el respaldo en Markdown escribe cada paso como tirada propia', async ({ page }) => {
    await prepararApp(page);
    await iniciarSesion(page);
    await guardarUna(page, '¿Sirve el respaldo del hilo?');

    await stubGemini(page, { texto: LECTURA_DE_HILO });
    await seguirAsunto(page, '¿Y el mes que viene?');
    await page.click('#btn-guardar-bitacora');
    await expect(page.locator('#btn-guardar-bitacora')).toHaveText('Quitar de mi bitácora');

    await page.click('#btn-nueva-consulta');
    await page.click('#btn-bitacora');

    const md = await page.evaluate(() => bitacoraAMarkdown(consultasCargadas));
    expect(md).toContain('1 tiradas · 1 seguimientos');
    expect(md).toContain('## 1.1 — Seguimiento de «¿Sirve el respaldo del hilo?»: ¿Y el mes que viene?');
    // Cada paso lleva su propia tirada, así que la carta se escribe dos veces.
    expect(md.match(/### Carta de 12 casas/g)).toHaveLength(2);
  });
});

test.describe('Proxy de interpretación', () => {
  test('usa el proxy cuando está desplegado, sin exponer la clave', async ({ page }) => {
    let recibidoPorProxy = null;
    await page.route('**/functions/v1/interpretar', async (ruta) => {
      const req = ruta.request();
      recibidoPorProxy = {
        autorizacion: req.headers()['authorization'] || '',
        tienePrompt: !!JSON.parse(req.postData() || '{}').prompt,
      };
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ texto: '### Veredicto\nLo dijo el proxy.' }),
      });
    });
    // Si el cliente llamara a Gemini directo, este stub lo delataría.
    let llamoAGeminiDirecto = false;
    await page.route('**generativelanguage.googleapis.com**', async (ruta) => {
      llamoAGeminiDirecto = true;
      await ruta.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'directo' }] } }] }) });
    });

    await prepararApp(page);
    await iniciarSesion(page);
    await consultar(page, '¿Pasa por el proxy?');
    await expect(page.locator('#interpretacion-texto')).toContainText('Lo dijo el proxy', { timeout: 20000 });

    expect(recibidoPorProxy, 'no se llamó al proxy').not.toBeNull();
    expect(recibidoPorProxy.autorizacion).toContain('Bearer ');
    expect(recibidoPorProxy.tienePrompt).toBe(true);
    expect(llamoAGeminiDirecto, 'la clave del navegador no debería usarse').toBe(false);
  });

  test('si el proxy no está desplegado sigue con la clave propia', async ({ page }) => {
    await page.route('**/functions/v1/interpretar', (ruta) => ruta.fulfill({ status: 404, body: '' }));
    await prepararApp(page);
    await iniciarSesion(page);
    await consultar(page, '¿Cae a la clave propia?');
    await expect(page.locator('#interpretacion-texto h4').first()).toBeVisible({ timeout: 20000 });
  });

  test('el límite diario se muestra tal cual, sin caer a la clave propia', async ({ page }) => {
    test.setTimeout(90000); // la app reintenta tres veces antes de rendirse
    await page.route('**/functions/v1/interpretar', (ruta) => ruta.fulfill({
      status: 429, contentType: 'application/json',
      body: JSON.stringify({ error: 'Llegaste al límite de 40 consultas por día. Vuelve mañana.', limite_alcanzado: true }),
    }));
    await prepararApp(page);
    await iniciarSesion(page);
    await consultar(page, '¿Respeta el límite?');
    await expect(page.locator('#interpretacion-estado')).toContainText('límite de 40', { timeout: 60000 });
  });
});

test.describe('Mostrar/ocultar contraseña', () => {
  test('permite ver el texto real escrito en el campo', async ({ page }) => {
    await prepararApp(page);
    await page.click('#btn-sesion');
    await page.fill('#input-password', 'lo-que-escribi');

    await expect(page.locator('#input-password')).toHaveAttribute('type', 'password');
    await page.click('#btn-ver-password');
    await expect(page.locator('#input-password')).toHaveAttribute('type', 'text');
    await expect(page.locator('#input-password')).toHaveValue('lo-que-escribi');

    await page.click('#btn-ver-password');
    await expect(page.locator('#input-password')).toHaveAttribute('type', 'password');
  });
});
