'use strict';

/* Invariantes de la matemática del escudo y de la aleatoriedad.
   No necesitan navegador: se evalúan sobre app.js directamente. */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const app = require(path.join(__dirname, '..', 'app.js'));

test.describe('Matemática del escudo', () => {
  test('el Juez siempre tiene un total de puntos par', () => {
    // Se recorren las 65.536 combinaciones posibles de las 4 Madres. Se acumulan
    // los fallos y se afirma una sola vez: un expect por vuelta hace lentísimo
    // el recorrido completo.
    const fallos = [];
    let revisadas = 0;
    for (let m = 0; m < 65536; m++) {
      const madres = [];
      for (let i = 0; i < 4; i++) {
        const nibble = (m >> (i * 4)) & 0xf;
        madres.push([0, 1, 2, 3].map((b) => ((nibble >> b) & 1 ? 1 : 2)));
      }
      const escudo = app.calcularEscudo(madres);
      const total = escudo.juez.reduce((a, b) => a + b, 0);
      if (total % 2 !== 0) fallos.push(JSON.stringify(madres));
      revisadas++;
    }
    expect(revisadas).toBe(65536);
    expect(fallos, 'Madres con Juez impar').toEqual([]);
  });

  test('la verificación del Juez corta la tirada, no la deja pasar con un aviso', () => {
    // Con entradas válidas el Juez nunca sale impar, así que la guarda no se
    // puede disparar desde afuera: se comprueba que sea un throw y no un log,
    // que fue justamente la corrección pedida en la auditoría.
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const guarda = fuente.slice(
      fuente.indexOf('const totalPuntosJuez'),
      fuente.indexOf('const casas = madres.concat')
    );
    expect(guarda).toContain('totalPuntosJuez % 2 !== 0');
    expect(guarda, 'la verificación debe cortar con throw').toContain('throw new Error');
    expect(guarda, 'no alcanza con avisar por consola').not.toContain('console.error');
  });

  test('cualquier figura sumada consigo misma da Populus', () => {
    app.FIGURAS.forEach((f) => {
      expect(app.sumaFiguras(f.puntos, f.puntos)).toEqual([2, 2, 2, 2]);
    });
  });

  test('hay 16 figuras y 12 casas, sin patrones repetidos', () => {
    expect(app.FIGURAS).toHaveLength(16);
    expect(app.CASAS).toHaveLength(12);
    const patrones = new Set(app.FIGURAS.map((f) => f.puntos.join('')));
    expect(patrones.size).toBe(16);
  });
});

test.describe('Validación anti-alucinación', () => {
  const escudo = app.calcularEscudo([[2, 1, 2, 1], [1, 2, 2, 2], [2, 1, 2, 2], [1, 2, 1, 1]]);

  test('acepta un texto que solo nombra figuras presentes', () => {
    expect(app.figurasAlucinadas('El Juez Puer y la casa con Amissio.', escudo)).toEqual([]);
  });

  test('detecta figuras que no están en la tirada', () => {
    const fuera = app.figurasAlucinadas('Aparece Laetitia junto a Tristitia.', escudo);
    expect(fuera.sort()).toEqual(['Laetitia', 'Tristitia']);
  });

  test('no confunde palabras corrientes con nombres de figuras', () => {
    // "vía" con tilde y en minúscula no es la figura Via.
    expect(app.figurasAlucinadas('Conviene buscar otra vía previa.', escudo)).toEqual([]);
  });
});

test.describe('Aleatoriedad de las líneas', () => {
  test('el trazado usa el generador criptográfico, no Math.random', () => {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const bloque = fuente.slice(fuente.indexOf('function bytesAleatorios'), fuente.indexOf('const DEMORA_REVELADO_MADRE_MS'));
    expect(bloque).toContain('crypto.getRandomValues');
    // Math.random solo puede aparecer como último recurso, dentro del aviso.
    expect(bloque).toContain('crypto.getRandomValues no está disponible');
  });

  test('el rango de puntos por línea divide exacto a 256 (sin sesgo de módulo)', () => {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const m = fuente.match(/RANGO_PUNTOS_POR_LINEA\s*=\s*(\d+)/);
    expect(m).not.toBeNull();
    expect(256 % Number(m[1])).toBe(0);
  });
});
