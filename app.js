'use strict';

/* ==========================================================================
   CONFIGURACIÓN
   ========================================================================== */

// El workflow de despliegue reemplaza este placeholder por el secret real.
// No debe aparecer en ningún otro lugar del código: el reemplazo es un sed
// literal sobre este archivo durante el build.
const GEMINI_API_KEY = '__GEMINI_API_KEY__';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY;

/* ==========================================================================
   DATOS: LAS 16 FIGURAS GEOMÁNTICAS
   Cada figura: 4 filas [cabeza, cuello, cuerpo, pies].
   1 = punto simple (impar / activo). 2 = punto doble (par / pasivo).
   ========================================================================== */

const FIGURAS = [
  {
    id: 'via',
    nombre: 'Via',
    traduccion: 'El Camino',
    puntos: [1, 1, 1, 1],
    elemento: 'Agua',
    planeta: 'Luna',
    signo: 'Piscis',
    naturaleza: 'neutra-contextual',
    significado:
      'Todo en movimiento: nada se fija todavía. Indica cambio, tránsito o un asunto en curso ' +
      'cuyo resultado depende de la dirección que tome, no de una fuerza propia.',
  },
  {
    id: 'populus',
    nombre: 'Populus',
    traduccion: 'El Pueblo',
    puntos: [2, 2, 2, 2],
    elemento: 'Agua',
    planeta: 'Luna',
    signo: 'Cáncer',
    naturaleza: 'neutra-contextual',
    significado:
      'Una masa pasiva que refleja lo que la rodea. No decide ni actúa por sí misma: amplifica ' +
      'la naturaleza de las figuras vecinas y depende del contexto para inclinarse.',
  },
  {
    id: 'fortuna-major',
    nombre: 'Fortuna Major',
    traduccion: 'La Fortuna Mayor',
    puntos: [1, 2, 2, 1],
    elemento: 'Tierra',
    planeta: 'Sol',
    signo: 'Leo',
    naturaleza: 'favorable',
    significado:
      'Éxito sólido que se construye desde dentro. Fuerza interior, protección y una ventaja ' +
      'que llega temprano y sostiene el asunto hasta el final.',
  },
  {
    id: 'fortuna-minor',
    nombre: 'Fortuna Minor',
    traduccion: 'La Fortuna Menor',
    puntos: [2, 1, 1, 2],
    elemento: 'Fuego',
    planeta: 'Sol',
    signo: 'Leo',
    naturaleza: 'favorable',
    significado:
      'Éxito rápido pero volátil: una ventaja que llega desde fuera y favorece lo inmediato. ' +
      'Buena para lo urgente, poco fiable si el asunto exige estabilidad de largo plazo.',
  },
  {
    id: 'acquisitio',
    nombre: 'Acquisitio',
    traduccion: 'La Ganancia',
    puntos: [2, 1, 1, 1],
    elemento: 'Fuego',
    planeta: 'Júpiter',
    signo: 'Sagitario',
    naturaleza: 'favorable',
    significado:
      'Expansión y acumulación. Ganancia material, de estatus o de oportunidad que crece ' +
      'hacia afuera; una de las figuras más directamente favorables para obtener.',
  },
  {
    id: 'amissio',
    nombre: 'Amissio',
    traduccion: 'La Pérdida',
    puntos: [1, 2, 2, 2],
    elemento: 'Tierra',
    planeta: 'Venus',
    signo: 'Tauro',
    naturaleza: 'neutra-contextual',
    significado:
      'Salida de recursos. Desfavorable si la pregunta busca retener o ganar; favorable si busca ' +
      'soltar una deuda, una carga o un vínculo que ya no conviene sostener.',
  },
  {
    id: 'albus',
    nombre: 'Albus',
    traduccion: 'El Blanco',
    puntos: [2, 1, 2, 2],
    elemento: 'Aire',
    planeta: 'Mercurio',
    signo: 'Géminis',
    naturaleza: 'favorable',
    significado:
      'Claridad tras la turbulencia. Calma, negociación e inteligencia que resuelven el asunto ' +
      'sin choque directo; un alivio modesto pero real.',
  },
  {
    id: 'rubeus',
    nombre: 'Rubeus',
    traduccion: 'El Rojo',
    puntos: [1, 2, 1, 1],
    elemento: 'Agua',
    planeta: 'Marte',
    signo: 'Escorpio',
    naturaleza: 'desfavorable',
    significado:
      'Impulso y confusión. Advierte contra decisiones tomadas por deseo desordenado o ' +
      'calentura; el asunto se mancha si se fuerza antes de tiempo.',
  },
  {
    id: 'puella',
    nombre: 'Puella',
    traduccion: 'La Niña',
    puntos: [1, 2, 1, 2],
    elemento: 'Aire',
    planeta: 'Venus',
    signo: 'Libra',
    naturaleza: 'favorable',
    significado:
      'Armonía y diplomacia. Resuelve por afinidad y belleza más que por fuerza: favorable en lo ' +
      'social y lo afectivo, aunque puede quedarse en la superficie del asunto.',
  },
  {
    id: 'puer',
    nombre: 'Puer',
    traduccion: 'El Niño',
    puntos: [2, 1, 2, 1],
    elemento: 'Fuego',
    planeta: 'Marte',
    signo: 'Aries',
    naturaleza: 'neutra-contextual',
    significado:
      'Energía, iniciativa y valentía. Favorable si el asunto exige actuar ya; desfavorable si ' +
      'exige paciencia, porque empuja a la precipitación.',
  },
  {
    id: 'coniunctio',
    nombre: 'Coniunctio',
    traduccion: 'La Unión',
    puntos: [1, 1, 2, 1],
    elemento: 'Tierra',
    planeta: 'Mercurio',
    signo: 'Virgo',
    naturaleza: 'neutra-contextual',
    significado:
      'Encuentro y mezcla. Une dos asuntos, personas o caminos mediante un intermediario; su ' +
      'valor depende por completo de la naturaleza de lo que se está uniendo.',
  },
  {
    id: 'carcer',
    nombre: 'Carcer',
    traduccion: 'La Cárcel',
    puntos: [2, 2, 1, 2],
    elemento: 'Tierra',
    planeta: 'Saturno',
    signo: 'Capricornio',
    naturaleza: 'desfavorable',
    significado:
      'Bloqueo estructural. Un límite que no cede por voluntad: el asunto queda contenido, ' +
      'retrasado o atado a una condición externa que no se puede saltar.',
  },
  {
    id: 'tristitia',
    nombre: 'Tristitia',
    traduccion: 'La Tristeza',
    puntos: [1, 1, 2, 2],
    elemento: 'Tierra',
    planeta: 'Saturno',
    signo: 'Acuario',
    naturaleza: 'desfavorable',
    significado:
      'Peso y restricción. Indica un cierre doloroso o una carga que se prolonga, aunque en ' +
      'ciertos contextos señala la profundidad necesaria antes de soltar algo.',
  },
  {
    id: 'laetitia',
    nombre: 'Laetitia',
    traduccion: 'La Alegría',
    puntos: [2, 2, 1, 1],
    elemento: 'Agua',
    planeta: 'Júpiter',
    signo: 'Piscis',
    naturaleza: 'favorable',
    significado:
      'Alivio y resolución positiva. Algo que se eleva después de la tensión; buen augurio, ' +
      'especialmente para asuntos que estaban estancados.',
  },
  {
    id: 'caput-draconis',
    nombre: 'Caput Draconis',
    traduccion: 'Cabeza del Dragón',
    puntos: [1, 1, 1, 2],
    elemento: 'Tierra',
    planeta: 'Nodo Norte',
    signo: 'Virgo',
    naturaleza: 'favorable',
    significado:
      'Comienzo propicio. Una puerta que se abre: entrada de algo nuevo y beneficioso al ' +
      'asunto, punto de inicio favorable más que de resultado final.',
  },
  {
    id: 'cauda-draconis',
    nombre: 'Cauda Draconis',
    traduccion: 'Cola del Dragón',
    puntos: [2, 2, 2, 1],
    elemento: 'Fuego',
    planeta: 'Nodo Sur',
    signo: 'Sagitario',
    naturaleza: 'desfavorable',
    significado:
      'Cierre abrupto. Salida o ruptura repentina: advierte que el asunto termina de forma ' +
      'disruptiva o que conviene soltarlo antes de que lo haga por su cuenta.',
  },
];

const FIGURAS_POR_PATRON = {};
FIGURAS.forEach(function (f) { FIGURAS_POR_PATRON[f.puntos.join('')] = f; });

function figuraPorPuntos(puntos) {
  const clave = puntos.join('');
  const figura = FIGURAS_POR_PATRON[clave];
  if (!figura) throw new Error('Patrón de figura desconocido: ' + clave);
  return figura;
}

/* ==========================================================================
   DATOS: LAS 12 CASAS
   ========================================================================== */

const CASAS = [
  { numero: 1, nombre: 'El consultante', significado: 'El consultante, su cuerpo y su estado actual.' },
  { numero: 2, nombre: 'Dinero', significado: 'Dinero, posesiones, objetos perdidos.' },
  { numero: 3, nombre: 'Hermanos y viajes cortos', significado: 'Hermanos, comunicaciones, viajes cortos.' },
  { numero: 4, nombre: 'Hogar', significado: 'Hogar, padre, raíces, final del asunto.' },
  { numero: 5, nombre: 'Hijos y placer', significado: 'Hijos, placer, creatividad.' },
  { numero: 6, nombre: 'Salud y trabajo', significado: 'Salud, trabajo cotidiano, subordinados.' },
  { numero: 7, nombre: 'Pareja y socios', significado: 'Pareja, socios, adversarios declarados.' },
  { numero: 8, nombre: 'Pérdidas y lo oculto', significado: 'Muerte, pérdidas, dinero ajeno, lo oculto del otro.' },
  { numero: 9, nombre: 'Viajes largos', significado: 'Viajes largos, estudios superiores, espiritualidad, ley.' },
  { numero: 10, nombre: 'Carrera', significado: 'Carrera, reputación, autoridad, resultado público.' },
  { numero: 11, nombre: 'Amigos', significado: 'Amigos, redes, esperanzas.' },
  { numero: 12, nombre: 'Enemigos ocultos', significado: 'Enemigos ocultos, cárcel, autosabotaje, lo escondido.' },
];

const TEMAS = [
  { id: 'trabajo', etiqueta: 'Trabajo / carrera', casa: 10 },
  { id: 'dinero', etiqueta: 'Dinero / objeto perdido', casa: 2 },
  { id: 'pareja', etiqueta: 'Pareja / socio', casa: 7 },
  { id: 'salud', etiqueta: 'Salud', casa: 6 },
  { id: 'viaje', etiqueta: 'Viaje', casa: 9 },
  { id: 'hogar', etiqueta: 'Hogar / familia', casa: 4 },
  { id: 'pleito', etiqueta: 'Pleito / contrato', casa: 7 },
  { id: 'oculto', etiqueta: 'Asunto oculto', casa: 12 },
  { id: 'general', etiqueta: 'General (solo el Juez)', casa: null },
];

/* ==========================================================================
   MATEMÁTICA DEL ESCUDO
   ========================================================================== */

function sumaFila(a, b) {
  const paridadA = a % 2; // 1 => impar, 0 => par
  const paridadB = b % 2;
  return paridadA === paridadB ? 2 : 1;
}

function sumaFiguras(figA, figB) {
  return figA.map(function (v, i) { return sumaFila(v, figB[i]); });
}

function transponerHijas(madres) {
  const hijas = [];
  for (let fila = 0; fila < 4; fila++) {
    hijas.push(madres.map(function (m) { return m[fila]; }));
  }
  return hijas;
}

function calcularEscudo(madres) {
  const hijas = transponerHijas(madres);

  const sobrinas = [
    sumaFiguras(madres[0], madres[1]),
    sumaFiguras(madres[2], madres[3]),
    sumaFiguras(hijas[0], hijas[1]),
    sumaFiguras(hijas[2], hijas[3]),
  ];

  const testigoDerecho = sumaFiguras(sobrinas[0], sobrinas[1]);
  const testigoIzquierdo = sumaFiguras(sobrinas[2], sobrinas[3]);
  const juez = sumaFiguras(testigoDerecho, testigoIzquierdo);
  const reconciliador = sumaFiguras(juez, madres[0]);

  const totalPuntosJuez = juez.reduce(function (a, b) { return a + b; }, 0);
  if (totalPuntosJuez % 2 !== 0) {
    // El Juez debe tener siempre un total de puntos par. Si esto se dispara,
    // hay un error en la aritmética del escudo.
    console.error('Verificación de escudo fallida: el Juez tiene un total de puntos impar (' + totalPuntosJuez + ').');
  }

  const casas = madres.concat(hijas, sobrinas);

  return {
    madres: madres,
    hijas: hijas,
    sobrinas: sobrinas,
    testigoDerecho: testigoDerecho,
    testigoIzquierdo: testigoIzquierdo,
    juez: juez,
    reconciliador: reconciliador,
    casas: casas,
  };
}

/* ==========================================================================
   ESTADO EN MEMORIA (sin localStorage / sessionStorage)
   ========================================================================== */

const estado = {
  pregunta: '',
  tema: TEMAS[TEMAS.length - 1],
  modoGeneracion: 'toque',
  lineas: [],       // 16 valores (1|2), en orden de generación
  escudo: null,
  interpretacion: '',
  fecha: null,
};

/* ==========================================================================
   NAVEGACIÓN ENTRE PANTALLAS
   ========================================================================== */

function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(function (el) {
    el.classList.toggle('activa', el.id === id);
  });
  window.scrollTo(0, 0);
}

/* ==========================================================================
   RENDER: FIGURAS Y DOTS
   ========================================================================== */

function crearElementoFigura(puntos, opciones) {
  opciones = opciones || {};
  const cont = document.createElement('div');
  cont.className = 'figura';

  if (opciones.etiqueta) {
    const etiqueta = document.createElement('div');
    etiqueta.className = 'figura-etiqueta';
    etiqueta.textContent = opciones.etiqueta;
    cont.appendChild(etiqueta);
  }

  const lineasWrap = document.createElement('div');
  lineasWrap.className = 'figura-lineas';
  puntos.forEach(function (n) {
    const fila = document.createElement('div');
    fila.className = 'figura-linea';
    for (let i = 0; i < n; i++) {
      const punto = document.createElement('span');
      punto.className = 'punto';
      fila.appendChild(punto);
    }
    lineasWrap.appendChild(fila);
  });
  cont.appendChild(lineasWrap);

  if (opciones.mostrarNombre !== false) {
    const figura = figuraPorPuntos(puntos);
    const nombre = document.createElement('div');
    nombre.className = 'figura-nombre';
    nombre.textContent = figura.nombre + (opciones.mostrarTraduccion === false ? '' : ' · ' + figura.traduccion);
    cont.appendChild(nombre);
  }

  return cont;
}

/* ==========================================================================
   PANTALLA 2: PREGUNTA
   ========================================================================== */

function poblarSelectTemas() {
  const select = document.getElementById('select-tema');
  select.innerHTML = '';
  TEMAS.forEach(function (t) {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.etiqueta;
    select.appendChild(opt);
  });
}

/* ==========================================================================
   PANTALLA 3: GENERACIÓN DE LÍNEAS
   ========================================================================== */

const DURACION_TOQUE_MS = 3000;
let toqueCount = 0;
let toqueIntervalo = null;
let toqueInicio = 0;
let lineaActual = 0;

function iniciarGeneracion() {
  estado.lineas = [];
  lineaActual = 0;
  document.getElementById('madres-formandose').innerHTML = '';

  if (estado.modoGeneracion === 'automatico') {
    for (let i = 0; i < 16; i++) {
      estado.lineas.push(Math.random() < 0.5 ? 1 : 2);
    }
    mostrarMadresFormadas();
    setTimeout(irAPantallaCalculo, 500);
    return;
  }

  document.getElementById('bloque-toque').hidden = false;
  prepararLinea();
}

function prepararLinea() {
  const madreNum = Math.floor(lineaActual / 4) + 1;
  document.getElementById('progreso-linea').textContent =
    'Línea ' + (lineaActual + 1) + ' de 16 — Madre ' + madreNum;
  toqueCount = 0;
  document.getElementById('contador-toque').textContent = '0';
  document.getElementById('barra-tiempo-relleno').style.width = '100%';

  const zona = document.getElementById('zona-toque');
  const manejarToque = function (ev) {
    ev.preventDefault();
    toqueCount++;
    document.getElementById('contador-toque').textContent = String(toqueCount);
  };
  zona.onpointerdown = manejarToque;

  toqueInicio = Date.now();
  clearInterval(toqueIntervalo);
  toqueIntervalo = setInterval(function () {
    const transcurrido = Date.now() - toqueInicio;
    const restante = Math.max(0, DURACION_TOQUE_MS - transcurrido);
    document.getElementById('barra-tiempo-relleno').style.width = (100 * restante / DURACION_TOQUE_MS) + '%';
    if (transcurrido >= DURACION_TOQUE_MS) {
      clearInterval(toqueIntervalo);
      zona.onpointerdown = null;
      finalizarLinea();
    }
  }, 50);
}

function finalizarLinea() {
  const valor = toqueCount % 2 === 1 ? 1 : 2;
  estado.lineas.push(valor);
  lineaActual++;

  if (lineaActual % 4 === 0) {
    mostrarMadresFormadas();
  }

  if (lineaActual >= 16) {
    document.getElementById('bloque-toque').hidden = true;
    setTimeout(irAPantallaCalculo, 400);
    return;
  }

  setTimeout(prepararLinea, 350);
}

function mostrarMadresFormadas() {
  const cont = document.getElementById('madres-formandose');
  cont.innerHTML = '';
  const numMadres = Math.floor(estado.lineas.length / 4);
  for (let m = 0; m < numMadres; m++) {
    const puntos = estado.lineas.slice(m * 4, m * 4 + 4);
    cont.appendChild(crearElementoFigura(puntos, { etiqueta: 'Madre ' + (m + 1) }));
  }
}

/* ==========================================================================
   PANTALLA 4: CÁLCULO ANIMADO DEL ESCUDO
   ========================================================================== */

function irAPantallaCalculo() {
  mostrarPantalla('pantalla-calculo');

  const madres = [
    estado.lineas.slice(0, 4),
    estado.lineas.slice(4, 8),
    estado.lineas.slice(8, 12),
    estado.lineas.slice(12, 16),
  ];
  estado.escudo = calcularEscudo(madres);
  estado.fecha = new Date();

  const pasos = ['Madres…', 'Hijas…', 'Sobrinas…', 'Testigos…', 'El Juez…'];
  const pasoEl = document.getElementById('paso-calculo');
  const barraEl = document.getElementById('barra-calculo-relleno');
  let i = 0;

  const avanzar = function () {
    if (i >= pasos.length) {
      setTimeout(irAPantallaResultado, 350);
      return;
    }
    pasoEl.textContent = pasos[i];
    barraEl.style.width = (100 * (i + 1) / pasos.length) + '%';
    i++;
    setTimeout(avanzar, 480);
  };
  barraEl.style.width = '0%';
  setTimeout(avanzar, 200);
}

/* ==========================================================================
   PANTALLA 5: RESULTADO
   ========================================================================== */

function irAPantallaResultado() {
  mostrarPantalla('pantalla-resultado');
  renderizarJuezDestacado();
  renderizarEscudoCompleto();
  renderizarCartaCasas();
  document.getElementById('aviso-copiado').hidden = true;
  solicitarInterpretacion();
}

function renderizarJuezDestacado() {
  const cont = document.getElementById('juez-destacado');
  cont.innerHTML = '';
  const figuraJuez = figuraPorPuntos(estado.escudo.juez);
  const el = crearElementoFigura(estado.escudo.juez, { etiqueta: 'Juez' });
  const naturaleza = document.createElement('div');
  naturaleza.className = 'naturaleza ' + figuraJuez.naturaleza;
  naturaleza.textContent = figuraJuez.naturaleza.replace('-', ' ');
  el.appendChild(naturaleza);
  cont.appendChild(el);
}

function renderizarEscudoCompleto() {
  const cont = document.getElementById('escudo-completo');
  cont.innerHTML = '';
  const e = estado.escudo;

  function tituloFila(texto) {
    const t = document.createElement('div');
    t.className = 'escudo-fila-titulo';
    t.textContent = texto;
    cont.appendChild(t);
  }
  function filaDe(figuras, etiquetas) {
    const fila = document.createElement('div');
    fila.className = 'escudo-fila';
    figuras.forEach(function (f, i) {
      fila.appendChild(crearElementoFigura(f, { etiqueta: etiquetas[i] }));
    });
    cont.appendChild(fila);
  }

  tituloFila('Madres e Hijas (derecha → izquierda)');
  const madresHijas = [e.hijas[3], e.hijas[2], e.hijas[1], e.hijas[0], e.madres[3], e.madres[2], e.madres[1], e.madres[0]];
  const etiquetasMH = ['Hija 4', 'Hija 3', 'Hija 2', 'Hija 1', 'Madre 4', 'Madre 3', 'Madre 2', 'Madre 1'];
  filaDe(madresHijas, etiquetasMH);

  tituloFila('Sobrinas');
  filaDe(e.sobrinas, ['Sobrina 1', 'Sobrina 2', 'Sobrina 3', 'Sobrina 4']);

  tituloFila('Testigos');
  filaDe([e.testigoIzquierdo, e.testigoDerecho], ['Testigo Izquierdo', 'Testigo Derecho']);

  tituloFila('Juez y Reconciliador');
  filaDe([e.juez, e.reconciliador], ['Juez', 'Reconciliador']);
}

function renderizarCartaCasas() {
  const cont = document.getElementById('carta-casas');
  cont.innerHTML = '';
  const casaRelevante = estado.tema.casa;

  CASAS.forEach(function (casaInfo, idx) {
    const puntos = estado.escudo.casas[idx];
    const figura = figuraPorPuntos(puntos);
    const div = document.createElement('div');
    div.className = 'casa' + (casaInfo.numero === casaRelevante ? ' relevante' : '');

    const num = document.createElement('div');
    num.className = 'casa-numero';
    num.textContent = 'Casa ' + casaInfo.numero;
    div.appendChild(num);

    const nombre = document.createElement('div');
    nombre.className = 'casa-nombre';
    nombre.textContent = casaInfo.significado;
    div.appendChild(nombre);

    const fig = document.createElement('div');
    fig.className = 'casa-figura';
    fig.textContent = figura.nombre;
    div.appendChild(fig);

    cont.appendChild(div);
  });
}

/* ==========================================================================
   INTERPRETACIÓN: PROMPT Y LLAMADA A GEMINI
   ========================================================================== */

const INSTRUCCIONES_SISTEMA =
  'Eres un geomante hermético clásico, riguroso y honesto. Reglas estrictas:\n' +
  '1. La geomancia es un oráculo de VEREDICTO sobre asuntos externos y concretos. Tu trabajo es juzgar, no consolar. Si el Juez es desfavorable (Amissio en pregunta de ganancia, Carcer, Rubeus, Cauda Draconis, Tristitia según contexto), dilo sin rodeos y explica qué indica.\n' +
  '2. Jerarquía de lectura: (a) el JUEZ como sentencia general del asunto, (b) los dos Testigos como el camino hacia esa sentencia (Testigo Derecho = el consultante/el pasado del asunto, Testigo Izquierdo = el otro/el desenlace), (c) la figura en la CASA RELEVANTE al tema preguntado, (d) la figura en casa 1 como estado del consultante, (e) casa 4 como final del asunto si aporta.\n' +
  '3. Considera la naturaleza de cada figura EN CONTEXTO: Amissio es mala para retener pero buena para soltar deudas o enfermedades; Fortuna Minor favorece lo rápido, Fortuna Major lo lento; Puer y Rubeus advierten impulsividad; Populus refleja, no decide.\n' +
  '4. Responde la pregunta concreta que se hizo. La geomancia contesta \'¿resultará X?\' con sí matizado, no matizado, o sí/no condicionado — comprométete con un veredicto y su condición.\n' +
  '5. Si la pregunta es sobre un tercero o busca certeza absoluta sobre el futuro, da el veredicto simbólico pero reencuadra el consejo hacia lo que el consultante puede hacer u observar.\n' +
  '6. Español claro y legible, denso pero no enredado. Usa **negritas** en lo clave. Sin relleno místico decorativo. Estructura: Veredicto del Juez → camino (Testigos) → detalle de la casa del tema → condición o consejo accionable → síntesis en una frase.\n' +
  '7. Si la pregunta involucra daño a terceros, salud grave o decisiones legales/financieras mayores, da el veredicto simbólico pero recuerda que esto no sustituye consejo profesional.\n' +
  '8. Responde EXCLUSIVAMENTE en español.';

function describirFigura(puntos) {
  const f = figuraPorPuntos(puntos);
  return f.nombre + ' (' + f.traduccion + ', ' + f.naturaleza + ', elemento ' + f.elemento + ', planeta ' + f.planeta + ')';
}

function construirPrompt() {
  const e = estado.escudo;
  const casaRelevante = estado.tema.casa;
  const figuraCasaRelevante = casaRelevante ? describirFigura(e.casas[casaRelevante - 1]) : 'No aplica (consulta general, solo se juzga con el Juez).';
  const figuraCasa1 = describirFigura(e.casas[0]);
  const fechaTexto = estado.fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const bloqueEscudo = [
    'Madre 1: ' + describirFigura(e.madres[0]),
    'Madre 2: ' + describirFigura(e.madres[1]),
    'Madre 3: ' + describirFigura(e.madres[2]),
    'Madre 4: ' + describirFigura(e.madres[3]),
    'Hija 1: ' + describirFigura(e.hijas[0]),
    'Hija 2: ' + describirFigura(e.hijas[1]),
    'Hija 3: ' + describirFigura(e.hijas[2]),
    'Hija 4: ' + describirFigura(e.hijas[3]),
    'Sobrina 1: ' + describirFigura(e.sobrinas[0]),
    'Sobrina 2: ' + describirFigura(e.sobrinas[1]),
    'Sobrina 3: ' + describirFigura(e.sobrinas[2]),
    'Sobrina 4: ' + describirFigura(e.sobrinas[3]),
    'Testigo Derecho: ' + describirFigura(e.testigoDerecho),
    'Testigo Izquierdo: ' + describirFigura(e.testigoIzquierdo),
    'Juez: ' + describirFigura(e.juez),
    'Reconciliador: ' + describirFigura(e.reconciliador),
  ].join('\n');

  return INSTRUCCIONES_SISTEMA + '\n\n' +
    '--- CONSULTA ---\n' +
    'Fecha: ' + fechaTexto + '\n' +
    'Pregunta: ' + estado.pregunta + '\n' +
    'Tema seleccionado: ' + estado.tema.etiqueta + (casaRelevante ? ' (casa ' + casaRelevante + ')' : '') + '\n\n' +
    '--- ESCUDO COMPLETO ---\n' + bloqueEscudo + '\n\n' +
    '--- FIGURA EN LA CASA DEL TEMA ---\n' + figuraCasaRelevante + '\n\n' +
    '--- FIGURA EN CASA 1 (el consultante) ---\n' + figuraCasa1 + '\n\n' +
    'Redacta la interpretación siguiendo exactamente la jerarquía y estructura indicadas en las reglas.';
}

const TIMEOUT_GEMINI_MS = 20000;

async function llamarGemini(prompt) {
  const controlador = new AbortController();
  const timeoutId = setTimeout(function () { controlador.abort(); }, TIMEOUT_GEMINI_MS);

  let respuesta;
  try {
    respuesta = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!respuesta.ok) {
    throw new Error('Gemini respondió con estado ' + respuesta.status);
  }

  const data = await respuesta.json();
  const partes = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  if (!partes || !partes.length) {
    throw new Error('Respuesta de Gemini sin contenido utilizable.');
  }
  return partes.map(function (p) { return p.text || ''; }).join('');
}

function generarRespaldoLocal() {
  const e = estado.escudo;
  const juez = figuraPorPuntos(e.juez);
  const testigoD = figuraPorPuntos(e.testigoDerecho);
  const testigoI = figuraPorPuntos(e.testigoIzquierdo);
  const casaRelevante = estado.tema.casa;

  let texto = '**Veredicto del Juez: ' + juez.nombre + ' (' + juez.traduccion + ')**\n\n';
  texto += 'Naturaleza ' + juez.naturaleza.replace('-', ' ') + '. ' + juez.significado + '\n\n';
  texto += '**Camino de los Testigos**\n\n';
  texto += 'Testigo Derecho: ' + testigoD.nombre + ' (' + testigoD.naturaleza.replace('-', ' ') + '). ' + testigoD.significado + '\n\n';
  texto += 'Testigo Izquierdo: ' + testigoI.nombre + ' (' + testigoI.naturaleza.replace('-', ' ') + '). ' + testigoI.significado + '\n\n';

  if (casaRelevante) {
    const figuraCasa = figuraPorPuntos(e.casas[casaRelevante - 1]);
    texto += '**Casa ' + casaRelevante + ' (' + estado.tema.etiqueta + ')**\n\n';
    texto += figuraCasa.nombre + ' (' + figuraCasa.naturaleza.replace('-', ' ') + '). ' + figuraCasa.significado + '\n\n';
  }

  texto += '**Síntesis**\n\n';
  texto += 'Esta es una interpretación estructural de respaldo, generada localmente porque el oráculo no pudo consultarse. ' +
    'Se ofrece a partir del Juez, los Testigos y la casa del tema; para el veredicto completo, reintenta la consulta.';

  return texto;
}

async function solicitarInterpretacion() {
  const estadoEl = document.getElementById('interpretacion-estado');
  const textoEl = document.getElementById('interpretacion-texto');
  const reintentarBtn = document.getElementById('btn-reintentar');

  estadoEl.hidden = false;
  estadoEl.textContent = 'Consultando al oráculo…';
  textoEl.innerHTML = '';
  reintentarBtn.hidden = true;

  try {
    const prompt = construirPrompt();
    const texto = await llamarGemini(prompt);
    estado.interpretacion = texto;
    estadoEl.hidden = true;
    textoEl.innerHTML = renderizarMarkdownBasico(texto);
  } catch (err) {
    console.error('Fallo al consultar Gemini, usando respaldo local:', err);
    const texto = generarRespaldoLocal();
    estado.interpretacion = texto;
    estadoEl.hidden = false;
    estadoEl.textContent = 'No se pudo contactar al oráculo. Mostrando lectura estructural de respaldo.';
    textoEl.innerHTML = renderizarMarkdownBasico(texto);
    reintentarBtn.hidden = false;
  }
}

function renderizarMarkdownBasico(texto) {
  const escapado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const parrafos = escapado.split(/\n\s*\n/).map(function (p) {
    return p.trim().replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }).filter(Boolean);
  return parrafos.map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
}

/* ==========================================================================
   EXPORTAR A MARKDOWN
   ========================================================================== */

function construirMarkdownExport() {
  const e = estado.escudo;
  const fechaTexto = estado.fecha.toLocaleString('es-ES');
  const nombreDe = function (puntos) {
    const f = figuraPorPuntos(puntos);
    return f.nombre + ' (' + f.naturaleza.replace('-', ' ') + ')';
  };

  const lineas = [];
  lineas.push('# Consulta de geomancia');
  lineas.push('');
  lineas.push('**Fecha:** ' + fechaTexto);
  lineas.push('**Pregunta:** ' + estado.pregunta);
  lineas.push('**Tema:** ' + estado.tema.etiqueta + (estado.tema.casa ? ' (casa ' + estado.tema.casa + ')' : ''));
  lineas.push('');
  lineas.push('## Semilla (las 4 Madres)');
  e.madres.forEach(function (m, i) {
    lineas.push('- Madre ' + (i + 1) + ': ' + m.join(',') + ' → ' + nombreDe(m));
  });
  lineas.push('');
  lineas.push('## Escudo resumido');
  e.sobrinas.forEach(function (s, i) {
    lineas.push('- Sobrina ' + (i + 1) + ': ' + nombreDe(s));
  });
  lineas.push('- Testigo Derecho: ' + nombreDe(e.testigoDerecho));
  lineas.push('- Testigo Izquierdo: ' + nombreDe(e.testigoIzquierdo));
  lineas.push('- **Juez: ' + nombreDe(e.juez) + '**');
  lineas.push('- Reconciliador: ' + nombreDe(e.reconciliador));
  lineas.push('');
  lineas.push('## Interpretación');
  lineas.push('');
  lineas.push(estado.interpretacion || '(sin interpretación)');
  lineas.push('');
  lineas.push('## Verificación posterior');
  lineas.push('');
  lineas.push('(Completar en la bitácora: qué ocurrió realmente, qué acertó el veredicto y qué no)');

  return lineas.join('\n');
}

async function copiarMarkdown() {
  const md = construirMarkdownExport();
  const aviso = document.getElementById('aviso-copiado');
  try {
    await navigator.clipboard.writeText(md);
  } catch (err) {
    const area = document.createElement('textarea');
    area.value = md;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
  aviso.hidden = false;
  setTimeout(function () { aviso.hidden = true; }, 2500);
}

/* ==========================================================================
   REINICIO DE CONSULTA
   ========================================================================== */

function reiniciarConsulta(mantenerPregunta) {
  if (!mantenerPregunta) {
    estado.pregunta = '';
    document.getElementById('input-pregunta').value = '';
  }
  estado.lineas = [];
  estado.escudo = null;
  estado.interpretacion = '';
  estado.fecha = null;
  document.getElementById('barra-calculo-relleno').style.width = '0%';
  mostrarPantalla('pantalla-inicio');
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */

function inicializar() {
  poblarSelectTemas();

  document.getElementById('btn-comenzar').addEventListener('click', function () {
    mostrarPantalla('pantalla-pregunta');
  });

  document.getElementById('btn-atras-pregunta').addEventListener('click', function () {
    mostrarPantalla('pantalla-inicio');
  });

  document.getElementById('btn-a-generacion').addEventListener('click', function () {
    const texto = document.getElementById('input-pregunta').value.trim();
    const errorEl = document.getElementById('error-pregunta');
    if (!texto) {
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    estado.pregunta = texto;
    const temaId = document.getElementById('select-tema').value;
    estado.tema = TEMAS.find(function (t) { return t.id === temaId; }) || TEMAS[TEMAS.length - 1];
    mostrarPantalla('pantalla-generacion');
    document.getElementById('bloque-toque').hidden = estado.modoGeneracion !== 'toque';
    iniciarGeneracion();
  });

  document.querySelectorAll('.btn-modo').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.btn-modo').forEach(function (b) { b.classList.remove('activo'); });
      btn.classList.add('activo');
      estado.modoGeneracion = btn.dataset.modo;
      clearInterval(toqueIntervalo);
      document.getElementById('bloque-toque').hidden = estado.modoGeneracion !== 'toque';
      iniciarGeneracion();
    });
  });

  document.getElementById('btn-reintentar').addEventListener('click', solicitarInterpretacion);
  document.getElementById('btn-nueva-interpretacion').addEventListener('click', solicitarInterpretacion);
  document.getElementById('btn-copiar-md').addEventListener('click', copiarMarkdown);
  document.getElementById('btn-nueva-consulta').addEventListener('click', function () { reiniciarConsulta(false); });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializar);
}

/* ==========================================================================
   EXPORTS PARA VERIFICACIÓN (Node) — no afecta la ejecución en el navegador
   ========================================================================== */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIGURAS: FIGURAS,
    CASAS: CASAS,
    TEMAS: TEMAS,
    figuraPorPuntos: figuraPorPuntos,
    sumaFila: sumaFila,
    sumaFiguras: sumaFiguras,
    transponerHijas: transponerHijas,
    calcularEscudo: calcularEscudo,
  };
}
