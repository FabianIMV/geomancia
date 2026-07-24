'use strict';

/* Cuenta, guardado opcional, verificación posterior, borrado y respaldo. */

const { test, expect } = require('@playwright/test');
const { prepararApp, consultar, iniciarSesion } = require('./ayuda');

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
