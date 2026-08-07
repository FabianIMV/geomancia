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

// --- 2bis. Simetría vertical: SOLO Populus, Via, Coniunctio y Carcer son palíndromos ---
// (la tabla original fallaba esto: daba Fortuna Major y Fortuna Minor en su lugar)
function esPalindromo(puntos) { return puntos[0] === puntos[3] && puntos[1] === puntos[2]; }
const simetricas = FIGURAS.filter(function (f) { return esPalindromo(f.puntos); })
  .map(function (f) { return f.nombre; }).sort();
afirmar(
  JSON.stringify(simetricas) === JSON.stringify(['Carcer', 'Coniunctio', 'Populus', 'Via']),
  'Las únicas figuras verticalmente simétricas son Populus, Via, Coniunctio y Carcer (encontradas: ' + simetricas.join(', ') + ')'
);

// --- 2ter. Una sola línea activa, en el elemento que le corresponde ---
// La posición de esa única línea activa fija el elemento sin ambigüedad para
// estas cuatro; ver el comentario de FIGURAS. No se verifican las otras doce.
const ELEMENTOS = ['Fuego', 'Aire', 'Agua', 'Tierra'];
const UNA_LINEA_ACTIVA = { Laetitia: 0, Rubeus: 1, Albus: 2, Tristitia: 3 };
Object.keys(UNA_LINEA_ACTIVA).forEach(function (nombre) {
  const figura = FIGURAS.find(function (f) { return f.nombre === nombre; });
  const activas = figura.puntos.map(function (v, i) { return v === 1 ? i : -1; }).filter(function (i) { return i !== -1; });
  const posEsperada = UNA_LINEA_ACTIVA[nombre];
  const posicionOk = activas.length === 1 && activas[0] === posEsperada;
  afirmar(
    posicionOk,
    nombre + ' tiene su única línea activa en ' + ELEMENTOS[posEsperada] +
      ' (encontradas en: ' + activas.map(function (i) { return ELEMENTOS[i]; }).join(', ') + ')'
  );
  afirmar(
    figura.elemento === ELEMENTOS[posEsperada],
    nombre + '.elemento es \'' + ELEMENTOS[posEsperada] + '\' (guardado: \'' + figura.elemento + '\')'
  );
});

// --- 3. Debe haber exactamente 12 casas, 1..12 ---
afirmar(CASAS.length === 12, 'Hay 12 casas');
CASAS.forEach(function (c, i) {
  afirmar(c.numero === i + 1, 'Casa en posición ' + i + ' tiene número ' + (i + 1));
});

// --- 4. Caso de prueba fijo: verifica transposición, sumas XOR, testigos y juez ---
// Los comentarios muestran el nombre que le corresponde a cada binario según
// la tabla FIGURAS vigente; los binarios en sí (lo que realmente se verifica
// más abajo) no cambian con una corrección de nombres.
const M1 = [2, 1, 2, 1]; // Acquisitio
const M2 = [1, 2, 2, 2]; // Laetitia
const M3 = [2, 1, 2, 2]; // Rubeus
const M4 = [1, 2, 1, 1]; // Puella

const escudo = calcularEscudo([M1, M2, M3, M4]);

const esperado = {
  hijas: [
    [2, 1, 2, 1], // Acquisitio
    [1, 2, 1, 2], // Amissio
    [2, 2, 2, 1], // Tristitia
    [1, 2, 2, 1], // Carcer
  ],
  sobrinas: [
    [1, 1, 2, 1], // Puer
    [1, 1, 1, 1], // Via
    [1, 1, 1, 1], // Via
    [1, 2, 2, 2], // Laetitia
  ],
  testigoDerecho: [2, 2, 1, 2],   // Albus
  testigoIzquierdo: [2, 1, 1, 1], // Caput Draconis
  juez: [2, 1, 2, 1],             // Acquisitio
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
