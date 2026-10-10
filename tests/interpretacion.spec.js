'use strict';

/* Lo que la capa de interpretación calcula en código para que el modelo no
   tenga que hacerlo: perfección, Reconciliador informativo, repeticiones
   reales y valencia por tema. Cuatro cartas reales con el resultado
   esperado calculado a mano. No necesitan navegador. */

const { test, expect } = require('@playwright/test');
const path = require('path');

const app = require(path.join(__dirname, '..', 'app.js'));

const nombre = (puntos) => app.figuraPorPuntos(puntos).nombre;
const madresDe = (filas) => filas.map((f) => f.split('').map(Number));

function carta(filas, casaTema) {
  const escudo = app.calcularEscudo(madresDe(filas));
  return {
    escudo,
    perfeccion: app.calcularPerfeccion(escudo.casas, casaTema),
    reconciliador: app.reconciliadorInformativo(escudo),
    repeticiones: app.repeticionesReales(escudo.casas, escudo),
  };
}

test.describe('Cartas reales', () => {
  test('A (casa 10): traslación por Laetitia, Reconciliador repite al Juez', () => {
    const c = carta(['2222', '1222', '1112', '1211'], 10);
    console.log('A', JSON.stringify(c.perfeccion), JSON.stringify(c.reconciliador));

    expect(c.perfeccion).toEqual({ modo: 'traslacion', figura: 'Laetitia', casas: [2, 9] });
    expect(nombre(c.escudo.madres[0])).toBe('Populus');
    expect(nombre(c.escudo.reconciliador)).toBe(nombre(c.escudo.juez));
    expect(c.reconciliador.informativo).toBe(false);
  });

  test('B (casa 7): traslación por Carcer', () => {
    const c = carta(['2122', '1221', '1211', '1111'], 7);
    console.log('B', JSON.stringify(c.perfeccion), JSON.stringify(c.reconciliador));

    expect(c.perfeccion).toEqual({ modo: 'traslacion', figura: 'Carcer', casas: [2, 6] });
    expect(c.reconciliador.informativo).toBe(true);
  });

  test('C (casa 9): negación', () => {
    const c = carta(['1111', '2112', '2111', '2121'], 9);
    console.log('C', JSON.stringify(c.perfeccion), JSON.stringify(c.reconciliador));

    expect(c.perfeccion.modo).toBe('negacion');
  });

  test('D (casa 7): traslación por Caput Draconis, Reconciliador Populus, Amissio en 2 casas', () => {
    const c = carta(['1212', '2111', '1221', '1211'], 7);
    console.log('D', JSON.stringify(c.perfeccion), JSON.stringify(c.reconciliador),
      JSON.stringify(c.repeticiones));

    expect(c.perfeccion).toEqual({ modo: 'traslacion', figura: 'Caput Draconis', casas: [2, 8] });
    expect(nombre(c.escudo.juez)).toBe('Amissio');
    expect(nombre(c.escudo.madres[0])).toBe('Amissio');
    expect(nombre(c.escudo.reconciliador)).toBe('Populus');
    expect(c.reconciliador.informativo).toBe(false);

    // 2 casas reales (1 y 12) más el Juez; no "5 posiciones".
    const amissio = c.repeticiones.enCasas.find((r) => r.figura === 'Amissio');
    expect(amissio.casas).toEqual([1, 12]);
    expect(c.repeticiones.coincidencias).toContainEqual({ posicion: 'Juez', figura: 'Amissio', casas: [1, 12] });
  });
});

test.describe('Perfección: cada modo', () => {
  // Se arman cartas de casas a mano: solo importa qué figura cae en cada casa.
  const FIG = Object.fromEntries(app.FIGURAS.map((f) => [f.nombre, f.puntos]));
  const relleno = ['Via', 'Populus', 'Rubeus', 'Albus', 'Puer', 'Puella', 'Tristitia', 'Laetitia',
    'Carcer', 'Coniunctio', 'Acquisitio', 'Amissio'];
  function casasCon(asignadas) {
    return relleno.map((n, i) => FIG[asignadas[i + 1] || n]);
  }

  test('ocupación: la misma figura en la 1 y en la casa del tema', () => {
    const casas = casasCon({ 1: 'Fortuna Major', 7: 'Fortuna Major' });
    expect(app.calcularPerfeccion(casas, 7)).toEqual({ modo: 'ocupacion', figura: 'Fortuna Major', casas: [1, 7] });
  });

  test('conjunción: la figura de la 1 junto a la casa del tema', () => {
    const casas = casasCon({ 1: 'Fortuna Major', 7: 'Fortuna Minor', 8: 'Fortuna Major' });
    expect(app.calcularPerfeccion(casas, 7)).toEqual({ modo: 'conjuncion', figura: 'Fortuna Major', casas: [8] });
  });

  test('conjunción con vuelta: la casa 12 es vecina de la 1', () => {
    const casas = casasCon({ 1: 'Fortuna Major', 7: 'Fortuna Minor', 12: 'Fortuna Minor' });
    expect(app.calcularPerfeccion(casas, 7)).toEqual({ modo: 'conjuncion', figura: 'Fortuna Minor', casas: [12] });
  });

  test('mutación: los dos significadores juntos en otra parte', () => {
    const casas = casasCon({ 1: 'Fortuna Major', 7: 'Fortuna Minor', 4: 'Fortuna Minor', 5: 'Fortuna Major' });
    expect(app.calcularPerfeccion(casas, 7)).toEqual({ modo: 'mutacion', figura: null, casas: [4, 5] });
  });

  test('sin casa del tema no hay perfección que calcular', () => {
    expect(app.calcularPerfeccion(casasCon({}), null).modo).toBe('no_aplica');
  });
});

test.describe('Repeticiones sin tautologías', () => {
  test('Madre 1 y Casa 1 no cuentan como dos apariciones', () => {
    // En la carta C, Via está en la casa 1 (= Madre 1) y en la 6: son 2, no 3.
    const escudo = app.calcularEscudo(madresDe(['1111', '2112', '2111', '2121']));
    const via = app.repeticionesReales(escudo.casas, escudo).enCasas.find((r) => r.figura === 'Via');
    expect(via.casas).toEqual([1, 6]);
    const texto = app.detectarRepeticiones(escudo, escudo.casas).join('\n');
    expect(texto).toContain('Via está en 2 casas: Casa 1, Casa 6.');
    expect(texto).not.toMatch(/Madre|Hija|Sobrina/);
  });
});

test.describe('Valencia por tema', () => {
  test('cubre las 16 figuras y solo usa valores válidos', () => {
    const validos = new Set(['favorable', 'desfavorable', 'neutra']);
    const temas = app.TEMAS.map((t) => t.id);
    expect(Object.keys(app.VALENCIA).sort()).toEqual(app.FIGURAS.map((f) => f.nombre).sort());
    app.FIGURAS.forEach((f) => {
      temas.forEach((t) => expect(validos.has(app.valenciaPara(f.nombre, t).valencia), f.nombre + '/' + t).toBe(true));
    });
  });

  test('los casos clásicos que la etiqueta genérica leía mal', () => {
    expect(app.valenciaPara('Amissio', 'pareja').valencia).toBe('favorable');
    expect(app.valenciaPara('Amissio', 'dinero').valencia).toBe('desfavorable');
    expect(app.valenciaPara('Acquisitio', 'dinero').valencia).toBe('favorable');
    expect(app.valenciaPara('Carcer', 'viaje').valencia).toBe('desfavorable');
    expect(app.valenciaPara('Carcer', 'hogar').valencia).toBe('favorable');
    expect(app.valenciaPara('Via', 'viaje').valencia).toBe('favorable');
    expect(app.valenciaPara('Via', 'hogar').valencia).toBe('desfavorable');
  });
});

test.describe('Lo que recibe el prompt', () => {
  test('la carta D de pareja lleva perfección, Reconciliador y valencia ya resueltos', () => {
    const escudo = app.calcularEscudo(madresDe(['1212', '2111', '1221', '1211']));
    const b = app.bloquesDeTirada(escudo, escudo.casas, 7, 'pareja');

    expect(b.bloquePerfeccion).toContain('TRASLACIÓN');
    expect(b.bloquePerfeccion).toContain('Caput Draconis está en la Casa 2 y Casa 8');
    expect(b.bloquePerfeccion).toContain('el asunto SE CONCRETA');
    expect(b.bloqueReconciliador).toContain('NO informativo');
    expect(b.bloqueEscudo).toContain('Madre 1 (= Casa 1)');
    expect(b.bloqueSignificados).toContain('Amissio (La Pérdida) — favorable para este tema');
    expect(b.bloqueRepeticiones).not.toMatch(/aparece \d+ veces/);
  });
});
