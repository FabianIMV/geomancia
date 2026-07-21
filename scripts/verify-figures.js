'use strict';

// Script de verificación — se ejecuta una vez con `node scripts/verify-figures.js`.
// No forma parte del sitio publicado.

const path = require('path');
const {
  FIGURAS,
  CASAS,
  figuraPorPuntos,
  transponerHijas,
  calcularEscudo,
} = require(path.join('..', 'app.js'));

let fallos = 0;
function afirmar(condicion, mensaje) {
  if (!condicion) {
    fallos++;
    console.error('✗ ' + mensaje);
  } else {
    console.log('✓ ' + mensaje);
  }
}

// --- 1. Debe haber exactamente 16 figuras ---
afirmar(FIGURAS.length === 16, 'Hay 16 figuras (' + FIGURAS.length + ')');

// --- 2. Los 16 patrones binarios deben ser únicos y cubrir las 16 combinaciones ---
const patrones = new Set();
FIGURAS.forEach(function (f) {
  afirmar(Array.isArray(f.puntos) && f.puntos.length === 4, f.nombre + ' tiene 4 filas');
  f.puntos.forEach(function (v) {
    afirmar(v === 1 || v === 2, f.nombre + ': cada fila es 1 o 2 (valor ' + v + ')');
  });
  const bits = f.puntos.map(function (v) { return v % 2 === 1 ? '1' : '0'; }).join('');
  patrones.add(bits);
});
afirmar(patrones.size === 16, 'Los 16 patrones binarios son únicos (' + patrones.size + ' distintos)');

const todasLasCombinaciones = new Set();
for (let i = 0; i < 16; i++) {
  todasLasCombinaciones.add(i.toString(2).padStart(4, '0'));
}
let cubreTodas = true;
todasLasCombinaciones.forEach(function (c) { if (!patrones.has(c)) cubreTodas = false; });
afirmar(cubreTodas, 'Las 16 figuras cubren las 16 combinaciones binarias posibles');

// --- 3. Debe haber exactamente 12 casas, 1..12 ---
afirmar(CASAS.length === 12, 'Hay 12 casas');
CASAS.forEach(function (c, i) {
  afirmar(c.numero === i + 1, 'Casa en posición ' + i + ' tiene número ' + (i + 1));
});

// --- 4. Caso de prueba fijo: verifica transposición, sumas XOR, testigos y juez ---
const M1 = [2, 1, 2, 1]; // Puer
const M2 = [1, 2, 2, 2]; // Amissio
const M3 = [2, 1, 2, 2]; // Albus
const M4 = [1, 2, 1, 1]; // Rubeus

const escudo = calcularEscudo([M1, M2, M3, M4]);

const esperado = {
  hijas: [
    [2, 1, 2, 1], // Puer
    [1, 2, 1, 2], // Puella
    [2, 2, 2, 1], // Cauda Draconis
    [1, 2, 2, 1], // Fortuna Major
  ],
  sobrinas: [
    [1, 1, 2, 1], // Coniunctio
    [1, 1, 1, 1], // Via
    [1, 1, 1, 1], // Via
    [1, 2, 2, 2], // Amissio
  ],
  testigoDerecho: [2, 2, 1, 2],   // Carcer
  testigoIzquierdo: [2, 1, 1, 1], // Acquisitio
  juez: [2, 1, 2, 1],             // Puer
  reconciliador: [2, 2, 2, 2],    // Populus
};

function comparar(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

afirmar(comparar(transponerHijas([M1, M2, M3, M4]), esperado.hijas), 'Transposición de Hijas correcta');
esperado.hijas.forEach(function (h, i) {
  afirmar(comparar(escudo.hijas[i], h), 'Hija ' + (i + 1) + ' = ' + h.join(',') + ' (' + figuraPorPuntos(h).nombre + ')');
});
esperado.sobrinas.forEach(function (s, i) {
  afirmar(comparar(escudo.sobrinas[i], s), 'Sobrina ' + (i + 1) + ' = ' + s.join(',') + ' (' + figuraPorPuntos(s).nombre + ')');
});
afirmar(comparar(escudo.testigoDerecho, esperado.testigoDerecho), 'Testigo Derecho = ' + esperado.testigoDerecho.join(',') + ' (' + figuraPorPuntos(esperado.testigoDerecho).nombre + ')');
afirmar(comparar(escudo.testigoIzquierdo, esperado.testigoIzquierdo), 'Testigo Izquierdo = ' + esperado.testigoIzquierdo.join(',') + ' (' + figuraPorPuntos(esperado.testigoIzquierdo).nombre + ')');
afirmar(comparar(escudo.juez, esperado.juez), 'Juez = ' + esperado.juez.join(',') + ' (' + figuraPorPuntos(esperado.juez).nombre + ')');
afirmar(comparar(escudo.reconciliador, esperado.reconciliador), 'Reconciliador = ' + esperado.reconciliador.join(',') + ' (' + figuraPorPuntos(esperado.reconciliador).nombre + ')');

// --- 5. El Juez siempre debe tener un total de puntos par ---
const totalJuez = escudo.juez.reduce(function (a, b) { return a + b; }, 0);
afirmar(totalJuez % 2 === 0, 'El Juez tiene un total de puntos par (total=' + totalJuez + ')');

// --- 6. Propiedad general: cualquier figura sumada consigo misma da Populus ---
const { sumaFiguras } = require(path.join('..', 'app.js'));
FIGURAS.forEach(function (f) {
  const autosuma = sumaFiguras(f.puntos, f.puntos);
  afirmar(comparar(autosuma, [2, 2, 2, 2]), f.nombre + ' + ' + f.nombre + ' = Populus');
});

console.log('');
if (fallos === 0) {
  console.log('Todas las verificaciones pasaron (' + FIGURAS.length + ' figuras, ' + CASAS.length + ' casas).');
  process.exit(0);
} else {
  console.error(fallos + ' verificación(es) fallida(s).');
  process.exit(1);
}
