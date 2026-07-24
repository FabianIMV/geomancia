'use strict';

/* ==========================================================================
   CONFIGURACIÓN
   ========================================================================== */

// Se prueban en orden: si un modelo falla (red, 404, respuesta vacía) se pasa al siguiente.
const GEMINI_MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];

function construirUrlGemini(modelo) {
  return 'https://generativelanguage.googleapis.com/v1beta/models/' + modelo + ':generateContent';
}

// La clave de Gemini la aporta cada usuario y vive solo en su navegador.
const CLAVE_LOCALSTORAGE_API_KEY = 'geomancia_gemini_api_key';

function getApiKey() {
  try {
    return localStorage.getItem(CLAVE_LOCALSTORAGE_API_KEY) || '';
  } catch (err) {
    return '';
  }
}

function setApiKey(clave) {
  try {
    localStorage.setItem(CLAVE_LOCALSTORAGE_API_KEY, clave);
  } catch (err) {
    console.error('No se pudo guardar la clave en localStorage:', err);
  }
}

function borrarApiKey() {
  try {
    localStorage.removeItem(CLAVE_LOCALSTORAGE_API_KEY);
  } catch (err) {
    console.error('No se pudo borrar la clave de localStorage:', err);
  }
}

/* ==========================================================================
   SUPABASE: SESIÓN Y BITÁCORA PRIVADA

   Todo este módulo es opcional. Si config.js no tiene URL y clave, la app
   funciona exactamente igual que antes: sin cuenta y sin bitácora.
   ========================================================================== */

let supabaseCliente = null;
let usuarioActual = null;

function configSupabase() {
  const cfg = (typeof window !== 'undefined' && window.GEOMANCIA_CONFIG) || {};
  return { url: cfg.SUPABASE_URL || '', anonKey: cfg.SUPABASE_ANON_KEY || '' };
}

function bitacoraDisponible() {
  const { url, anonKey } = configSupabase();
  return !!(url && anonKey && typeof window !== 'undefined' && window.supabase);
}

/* Almacenamiento a prueba de fallos para la sesión.

   Supabase comprueba si localStorage sirve escribiendo una clave diminuta; si
   pasa, usa localStorage crudo. Pero si el espacio está casi lleno esa prueba
   pasa y la escritura real de la sesión (varios KB) lanza QuotaExceededError,
   que nadie atrapa y termina abortando el login ("The quota has been exceeded").

   Este adaptador intenta localStorage y, si falla por lo que sea, sigue en
   memoria: entrar siempre funciona, aunque la sesión no sobreviva al recargar. */
let almacenamientoEnMemoria = false;

function crearAlmacenamientoSeguro() {
  const memoria = Object.create(null);
  return {
    getItem: function (clave) {
      try {
        const valor = window.localStorage.getItem(clave);
        if (valor !== null) return valor;
      } catch (err) { /* sin acceso: se cae a memoria */ }
      return clave in memoria ? memoria[clave] : null;
    },
    setItem: function (clave, valor) {
      try {
        window.localStorage.setItem(clave, valor);
        delete memoria[clave];
        return;
      } catch (err) {
        // Puede ser espacio agotado: se libera lo que ya no sirve y se reintenta.
        try {
          window.localStorage.removeItem(clave);
          window.localStorage.setItem(clave, valor);
          delete memoria[clave];
          return;
        } catch (err2) {
          console.warn('No se pudo guardar la sesión en localStorage; se usa memoria.', err2);
          memoria[clave] = valor;
          almacenamientoEnMemoria = true;
          actualizarUiSesion();
        }
      }
    },
    removeItem: function (clave) {
      try { window.localStorage.removeItem(clave); } catch (err) { /* nada que hacer */ }
      delete memoria[clave];
    },
  };
}

function iniciarSupabase() {
  if (!bitacoraDisponible()) return null;
  if (supabaseCliente) return supabaseCliente;
  const { url, anonKey } = configSupabase();
  supabaseCliente = window.supabase.createClient(url, anonKey, {
    auth: {
      storage: crearAlmacenamientoSeguro(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseCliente;
}

/* Acceso con email y contraseña. No se manda ningún correo: el servicio de
   correo incluido de Supabase no permite editar las plantillas sin SMTP propio
   y tiene un límite de envío muy bajo, así que el enlace mágico resultaba poco
   fiable. Requiere tener desactivado "Confirm email" en Supabase. */

async function entrarConContrasena(email, contrasena) {
  const cliente = iniciarSupabase();
  if (!cliente) throw new Error('La bitácora no está configurada.');
  const { error } = await cliente.auth.signInWithPassword({
    email: email,
    password: contrasena,
  });
  if (error) throw error;
}

async function crearCuenta(email, contrasena) {
  const cliente = iniciarSupabase();
  if (!cliente) throw new Error('La bitácora no está configurada.');
  const { data, error } = await cliente.auth.signUp({
    email: email,
    password: contrasena,
  });
  if (error) throw error;
  // Con "Confirm email" activado no llega sesión: hay que avisarlo, porque el
  // correo de confirmación depende de la plantilla que no se puede editar.
  if (!data.session) {
    throw new Error(
      'La cuenta se creó pero quedó pendiente de confirmación por correo. ' +
      'Desactivá "Confirm email" en Supabase (Authentication → Sign In / Providers → Email) para entrar directo.'
    );
  }
}

async function cerrarSesion() {
  const cliente = iniciarSupabase();
  if (!cliente) return;
  await cliente.auth.signOut();
  usuarioActual = null;
  actualizarUiSesion();
}

async function guardarConsultaEnBitacora() {
  const cliente = iniciarSupabase();
  if (!cliente || !usuarioActual || !estado.escudo || !estado.interpretacion) return null;

  const e = estado.escudo;
  const fila = {
    user_id: usuarioActual.id,
    pregunta: estado.pregunta,
    tema_id: estado.tema.id,
    tema_etiqueta: estado.tema.etiqueta,
    casa_tema: estado.tema.casa,
    madres: e.madres,
    hijas: e.hijas,
    sobrinas: e.sobrinas,
    testigo_derecho: e.testigoDerecho,
    testigo_izquierdo: e.testigoIzquierdo,
    juez: e.juez,
    reconciliador: e.reconciliador,
    casas: e.casas,
    interpretacion: estado.interpretacion,
    acierto: 'sin_verificar',
  };

  const { data, error } = await cliente.from('consultas').insert(fila).select('id').single();
  if (error) {
    console.error('No se pudo guardar la consulta en la bitácora:', error);
    return null;
  }
  return data && data.id;
}

async function listarConsultas() {
  const cliente = iniciarSupabase();
  if (!cliente || !usuarioActual) return [];
  const { data, error } = await cliente
    .from('consultas')
    .select('*')
    .order('creada_en', { ascending: false })
    .limit(100);
  if (error) {
    console.error('No se pudo leer la bitácora:', error);
    throw new Error(error.message);
  }
  return data || [];
}

async function guardarVerificacion(id, resultadoReal, acierto) {
  const cliente = iniciarSupabase();
  if (!cliente || !usuarioActual) throw new Error('No hay sesión abierta.');
  const { error } = await cliente
    .from('consultas')
    .update({
      resultado_real: resultadoReal,
      acierto: acierto,
      verificada_en: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

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
    // hay un error en la aritmética del escudo y no se debe continuar la tirada.
    throw new Error('Verificación de escudo fallida: el Juez tiene un total de puntos impar (' + totalPuntosJuez + '). La aritmética del escudo es inconsistente.');
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
  lineas: [],       // 16 valores (1|2), en orden de generación
  puntosPorLinea: [], // cuántos puntos se trazaron en cada línea (su paridad da el valor)
  escudo: null,
  interpretacion: '',
  fecha: null,
  // true cuando la pregunta ya se usó en una tirada: al volver a la pantalla de
  // pregunta se limpia el textarea en vez de arrastrar la consulta anterior.
  preguntaConsumida: false,
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

/* Bytes de un generador criptográficamente seguro (CSPRNG). A diferencia de
   Math.random(), que en varios motores es un PRNG rápido pero de baja calidad
   y con semilla predecible, crypto.getRandomValues toma entropía del sistema
   operativo. */
function bytesAleatorios(cantidad) {
  const cripto = typeof crypto !== 'undefined' ? crypto : null;
  if (cripto && typeof cripto.getRandomValues === 'function') {
    return cripto.getRandomValues(new Uint8Array(cantidad));
  }
  // Solo para navegadores sin Web Crypto. No debería alcanzarse en la práctica.
  console.warn('crypto.getRandomValues no está disponible; se recurre a Math.random().');
  const salida = new Uint8Array(cantidad);
  for (let i = 0; i < cantidad; i++) salida[i] = Math.floor(Math.random() * 256);
  return salida;
}

/* Traza las 16 líneas como se hacían en la arena: cada línea es una hilera de
   puntos y lo que decide su valor es la PARIDAD de cuántos hay. Se sortea un
   número de puntos por línea y se toma su paridad.

   Sobre el sesgo: se sortean puntos en el rango 8..23 (16 valores posibles,
   mitad pares y mitad impares) usando el byte completo módulo 16. Como 256 es
   múltiplo exacto de 16, no hay sesgo de módulo: cada cantidad —y por lo tanto
   cada paridad— sale con probabilidad idéntica. */
const PUNTOS_MINIMOS_POR_LINEA = 8;
const RANGO_PUNTOS_POR_LINEA = 16; // divide exacto a 256 ⇒ sin sesgo de módulo

function trazarLineas() {
  const bytes = bytesAleatorios(16);
  const lineas = [];
  const puntosPorLinea = [];
  for (let i = 0; i < 16; i++) {
    const puntos = PUNTOS_MINIMOS_POR_LINEA + (bytes[i] % RANGO_PUNTOS_POR_LINEA);
    puntosPorLinea.push(puntos);
    lineas.push(puntos % 2 === 1 ? 1 : 2); // impar ⇒ punto simple, par ⇒ doble
  }
  return { lineas: lineas, puntosPorLinea: puntosPorLinea };
}

const DEMORA_REVELADO_MADRE_MS = 420;
let reveladoIntervalo = null;

function iniciarGeneracion() {
  clearTimeout(reveladoIntervalo);
  const trazado = trazarLineas();
  estado.lineas = trazado.lineas;
  estado.puntosPorLinea = trazado.puntosPorLinea;

  const cont = document.getElementById('madres-formandose');
  cont.innerHTML = '';

  // Las Madres se revelan de a una, para que la tirada se lea formándose.
  let reveladas = 0;
  const revelar = function () {
    reveladas++;
    mostrarMadresFormadas(reveladas);
    if (reveladas >= 4) {
      reveladoIntervalo = setTimeout(irAPantallaCalculo, DEMORA_REVELADO_MADRE_MS);
      return;
    }
    reveladoIntervalo = setTimeout(revelar, DEMORA_REVELADO_MADRE_MS);
  };
  reveladoIntervalo = setTimeout(revelar, 250);
}

function mostrarMadresFormadas(cuantas) {
  const cont = document.getElementById('madres-formandose');
  cont.innerHTML = '';
  const disponibles = Math.floor(estado.lineas.length / 4);
  const numMadres = typeof cuantas === 'number' ? Math.min(cuantas, disponibles) : disponibles;
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
  '2. Jerarquía de lectura: (a) el JUEZ como sentencia general del asunto, (b) los dos Testigos como el camino hacia esa sentencia (Testigo Derecho = el consultante/el pasado del asunto, Testigo Izquierdo = el otro/el desenlace), (c) la figura en la CASA RELEVANTE al tema preguntado, (d) la figura en casa 1 como estado del consultante, (e) el RECONCILIADOR como matiz de cómo el desenlace afecta al consultante, (f) casa 4 como final del asunto si aporta.\n' +
  '3. Considera la naturaleza de cada figura EN CONTEXTO (esto es guía para TU razonamiento interno, no para citar figuras ajenas a la tirada): Amissio es mala para retener pero buena para soltar deudas o enfermedades; Fortuna Minor favorece lo rápido y Fortuna Major lo lento; Puer y Rubeus advierten impulsividad; Populus refleja, no decide. Si en el texto necesitas contrastar, describe la CUALIDAD (p. ej. "favorece lo rápido más que lo sostenido") sin nombrar una figura que no esté en esta tirada.\n' +
  '4. Responde la pregunta concreta que se hizo. La geomancia contesta \'¿resultará X?\' con sí matizado, no matizado, o sí/no condicionado. Comprométete con un veredicto (sí matizado / no matizado / condicionado) y su condición, pero NO uses lenguaje de garantía ni certeza sobre eventos futuros: evita \'garantiza\', \'asegura\', \'está garantizado\', \'altamente probable\'. La geomancia juzga la tendencia y la condición del asunto, no certifica resultados.\n' +
  '5. Si la pregunta es sobre un tercero o busca certeza absoluta sobre el futuro, da el veredicto simbólico pero reencuadra el consejo hacia lo que el consultante puede hacer u observar.\n' +
  '6. Español claro y legible, denso pero no enredado. Usa **negritas** en lo clave. Sin relleno místico decorativo. Estructura: Veredicto del Juez → camino (Testigos) → detalle de la casa del tema → estado del consultante (casa 1) → Reconciliador → condición o consejo accionable → síntesis en una frase.\n' +
  '7. Si la pregunta involucra daño a terceros, salud grave o decisiones legales/financieras mayores, da el veredicto simbólico pero recuerda que esto no sustituye consejo profesional.\n' +
  '8. COBERTURA OBLIGATORIA: antes de la síntesis final cubre explícitamente el Juez, AMBOS Testigos, la figura de la casa del tema, la figura de casa 1 y el Reconciliador. Menciona las Sobrinas o las Madres cuando aporten información relevante, sobre todo si repiten una figura o contradicen al Juez.\n' +
  '9. Cuando dos posiciones muestran la MISMA figura (por ejemplo ambos Testigos iguales, o una figura que se repite entre Madres, Hijas o Sobrinas), eso es significativo en geomancia: señálalo y explica qué refuerza o insiste, en lugar de describir la figura dos veces con el mismo texto.\n' +
  '10. ANCLAJE A LOS DATOS: usa EXCLUSIVAMENTE las figuras provistas en los datos de esta tirada. NUNCA menciones el nombre de una figura geomántica que no aparezca literalmente en los datos entregados — ni siquiera para compararla, contrastarla o ponerla de ejemplo. NUNCA inventes posiciones, casas o figuras fuera del schema provisto. Si hablas de una casa, usa exactamente la figura que la carta de 12 casas lista para esa casa.\n' +
  '11. No infieras ni asumas el estado emocional del consultante a partir de la pregunta. Interpreta la tirada, no a la persona.\n' +
  '12. Si la pregunta pide CUÁNDO ocurrirá algo (un timing, una fecha o un plazo), señala explícitamente que la geomancia clásica de este sistema no calcula fechas ni plazos: juzga la tendencia y la condición del asunto. Da el veredicto sobre hacia dónde se inclina el asunto, pero NO inventes tiempos, meses ni cantidades de días.\n' +
  '13. Responde EXCLUSIVAMENTE en español.';

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

  const bloqueCasas = CASAS.map(function (casaInfo, idx) {
    const marca = casaInfo.numero === casaRelevante ? '  ← CASA DEL TEMA' : '';
    return 'Casa ' + casaInfo.numero + ' (' + casaInfo.significado + '): ' + describirFigura(e.casas[idx]) + marca;
  }).join('\n');

  return INSTRUCCIONES_SISTEMA + '\n\n' +
    '--- CONSULTA ---\n' +
    'Fecha: ' + fechaTexto + '\n' +
    'Pregunta: ' + estado.pregunta + '\n' +
    'Tema seleccionado: ' + estado.tema.etiqueta + (casaRelevante ? ' (casa ' + casaRelevante + ')' : '') + '\n\n' +
    '--- ESCUDO COMPLETO ---\n' + bloqueEscudo + '\n\n' +
    '--- CARTA DE 12 CASAS (figura asignada a cada casa) ---\n' + bloqueCasas + '\n\n' +
    '--- FIGURA EN LA CASA DEL TEMA ---\n' + figuraCasaRelevante + '\n\n' +
    '--- FIGURA EN CASA 1 (el consultante) ---\n' + figuraCasa1 + '\n\n' +
    'Redacta la interpretación siguiendo exactamente la jerarquía y estructura indicadas en las reglas. ' +
    'Recuerda: solo puedes nombrar figuras que aparezcan literalmente en los datos de arriba.';
}

const TIMEOUT_GEMINI_MS = 20000;

async function llamarGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No hay clave de la API de Gemini configurada.');
  }

  let ultimoError = null;
  for (const modelo of GEMINI_MODEL_CANDIDATES) {
    try {
      return await llamarGeminiConModelo(modelo, apiKey, prompt, true);
    } catch (err) {
      console.error('Fallo el modelo ' + modelo + ':', err);
      ultimoError = err;
      // Algunos modelos (p. ej. gemini-flash-lite-latest) rechazan thinkingConfig
      // con un 400 INVALID_ARGUMENT genérico que no menciona el campo. Ante cualquier
      // 400 / argumento inválido se reintenta el MISMO modelo sin thinkingConfig
      // antes de pasar al siguiente candidato.
      const msg = (err && err.message) || '';
      if (/thinking|invalid.?argument|INVALID_ARGUMENT|estado 400/i.test(msg)) {
        try {
          return await llamarGeminiConModelo(modelo, apiKey, prompt, false);
        } catch (err2) {
          console.error('Fallo el modelo ' + modelo + ' también sin thinkingConfig:', err2);
          ultimoError = err2;
        }
      }
    }
  }
  throw ultimoError || new Error('Ningún modelo de Gemini respondió.');
}

async function llamarGeminiConModelo(modelo, apiKey, prompt, conThinkingConfig) {
  const url = construirUrlGemini(modelo) + '?key=' + encodeURIComponent(apiKey);
  const controlador = new AbortController();
  const timeoutId = setTimeout(function () { controlador.abort(); }, TIMEOUT_GEMINI_MS);

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: Object.assign(
          {
            temperature: 0.6,
            topP: 0.9,
            // 2048 se quedaba corto: en los modelos 2.5 el "thinking" consume parte
            // del presupuesto de salida y la interpretación llegaba cortada o vacía.
            // Sin thinkingConfig el modelo puede razonar, así que se da más margen.
            maxOutputTokens: conThinkingConfig ? 4096 : 8192,
          },
          conThinkingConfig ? { thinkingConfig: { thinkingBudget: 0 } } : {}
        ),
      }),
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!respuesta.ok) {
    let cuerpo = '';
    try { cuerpo = await respuesta.text(); } catch (e) { /* cuerpo ilegible */ }
    console.error('Gemini (' + modelo + ') estado ' + respuesta.status + '. Cuerpo de la respuesta:', cuerpo);

    // Mensajes accionables para las dos causas más comunes.
    let motivo = '';
    if (respuesta.status === 400 && /API_KEY_INVALID|API key not valid/i.test(cuerpo)) {
      motivo = ' — Tu clave de la API de Gemini no es válida. Revísala o pega una nueva desde el botón de configuración.';
    } else if (respuesta.status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(cuerpo)) {
      motivo = ' — Se agotó la cuota gratuita de tu clave de Gemini. Esperá unos minutos (o hasta mañana) y reintentá.';
    } else if (respuesta.status === 403) {
      motivo = ' — Tu clave no tiene permiso para este modelo, o la API de Gemini no está habilitada en tu proyecto.';
    }

    throw new Error('Gemini (' + modelo + ') respondió con estado ' + respuesta.status + motivo +
      (motivo ? '' : (cuerpo ? ' — ' + cuerpo.slice(0, 300) : '')));
  }

  const data = await respuesta.json();
  const candidato = data.candidates && data.candidates[0];
  const finishReason = candidato && candidato.finishReason;
  const partes = candidato && candidato.content && candidato.content.parts;

  if (!partes || !partes.length) {
    console.error('Gemini (' + modelo + ') sin partes utilizables. finishReason=' + finishReason +
      '. Respuesta:', JSON.stringify(data).slice(0, 600));
    throw new Error('Respuesta de Gemini (' + modelo + ') sin contenido utilizable (finishReason=' + finishReason + ').');
  }
  if (finishReason === 'MAX_TOKENS') {
    console.error('Gemini (' + modelo + ') truncó la respuesta por MAX_TOKENS.');
    throw new Error('Respuesta de Gemini (' + modelo + ') truncada por límite de tokens.');
  }

  const texto = partes
    .filter(function (p) { return !p.thought; })
    .map(function (p) { return p.text || ''; })
    .join('');
  if (!texto.trim()) {
    console.error('Gemini (' + modelo + ') devolvió texto vacío. finishReason=' + finishReason);
    throw new Error('Respuesta de Gemini (' + modelo + ') con texto vacío.');
  }
  return texto;
}

/* Validación anti-alucinación: toda figura nombrada en el texto debe existir
   en alguna posición del escudo. Devuelve los nombres de figuras mencionadas
   que NO están en la tirada (lista vacía = texto válido). */
function figurasAlucinadas(texto, escudo) {
  const presentes = new Set();
  const posiciones = escudo.madres.concat(
    escudo.hijas,
    escudo.sobrinas,
    [escudo.testigoDerecho, escudo.testigoIzquierdo, escudo.juez, escudo.reconciliador]
  );
  posiciones.forEach(function (p) { presentes.add(figuraPorPuntos(p).nombre); });

  return FIGURAS
    .filter(function (f) {
      if (presentes.has(f.nombre)) return false;
      return new RegExp('\\b' + f.nombre + '\\b').test(texto);
    })
    .map(function (f) { return f.nombre; });
}

const MAX_INTENTOS_INTERPRETACION = 3; // 1 intento + 2 reintentos

async function solicitarInterpretacion() {
  const estadoEl = document.getElementById('interpretacion-estado');
  const textoEl = document.getElementById('interpretacion-texto');
  const reintentarBtn = document.getElementById('btn-reintentar');

  estadoEl.hidden = false;
  textoEl.innerHTML = '';
  reintentarBtn.hidden = true;
  estado.interpretacion = '';

  const promptBase = construirPrompt();
  let notaCorrectiva = '';
  let ultimoError = null;

  for (let intento = 1; intento <= MAX_INTENTOS_INTERPRETACION; intento++) {
    estadoEl.textContent = intento === 1
      ? 'Consultando al oráculo…'
      : 'Reintentando la consulta (intento ' + intento + ' de ' + MAX_INTENTOS_INTERPRETACION + ')…';
    try {
      const texto = (await llamarGemini(promptBase + notaCorrectiva)).trim();
      if (!texto) {
        throw new Error('El modelo devolvió una interpretación vacía.');
      }
      const alucinadas = figurasAlucinadas(texto, estado.escudo);
      if (alucinadas.length) {
        notaCorrectiva = '\n\nATENCIÓN: en un intento anterior mencionaste figuras que NO están en esta tirada: ' +
          alucinadas.join(', ') + '. No las nombres. Usa solo las figuras listadas en los datos de arriba.';
        throw new Error('La interpretación menciona figuras que no están en el escudo: ' + alucinadas.join(', '));
      }
      estado.interpretacion = texto;
      estadoEl.hidden = true;
      textoEl.innerHTML = renderizarMarkdownBasico(texto);
      // Solo se guardan tiradas con interpretación válida del modelo.
      guardarConsultaEnBitacora().then(function (id) {
        if (!id) return;
        const avisoGuardado = document.getElementById('aviso-guardado');
        if (avisoGuardado) {
          avisoGuardado.hidden = false;
          setTimeout(function () { avisoGuardado.hidden = true; }, 2500);
        }
      });
      return;
    } catch (err) {
      console.error('Intento ' + intento + ' de interpretación fallido:', err);
      ultimoError = err;
    }
  }

  // Todos los intentos fallaron: NO se genera lectura de respaldo. Se muestra el
  // error y se deja reintentar. La interpretación queda vacía y no se exporta como válida.
  estado.interpretacion = '';
  estadoEl.hidden = false;
  estadoEl.textContent = 'No se pudo obtener la interpretación del oráculo tras ' +
    MAX_INTENTOS_INTERPRETACION + ' intentos. Revisá tu conexión o tu clave y reintentá.' +
    (ultimoError ? ' Último error: ' + ultimoError.message : '');
  textoEl.innerHTML = '';
  reintentarBtn.hidden = false;
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
  lineas.push('## Hijas');
  e.hijas.forEach(function (h, i) {
    lineas.push('- Hija ' + (i + 1) + ': ' + h.join(',') + ' → ' + nombreDe(h));
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
  lineas.push('## Carta de 12 casas');
  CASAS.forEach(function (casaInfo, idx) {
    const marca = casaInfo.numero === estado.tema.casa ? ' ← **casa del tema**' : '';
    lineas.push('- Casa ' + casaInfo.numero + ' (' + casaInfo.significado + '): ' + nombreDe(e.casas[idx]) + marca);
  });
  lineas.push('');
  lineas.push('## Interpretación');
  lineas.push('');
  lineas.push(estado.interpretacion || '⚠ (sin interpretación — la consulta al modelo no terminó o falló; este registro no es válido para la bitácora)');
  lineas.push('');
  lineas.push('## Verificación posterior');
  lineas.push('');
  lineas.push('(Completar en la bitácora: qué ocurrió realmente, qué acertó el veredicto y qué no)');

  return lineas.join('\n');
}

/* El copiado entrega el contenido ya renderizado (text/html) para que las apps
   de notas del celular lo peguen con formato, más una versión en texto plano
   sin símbolos de Markdown para las apps que no aceptan texto enriquecido. */

function markdownAHtmlExport(md) {
  const escapado = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const conNegritas = function (s) { return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); };

  const out = [];
  let enLista = false;
  escapado.split('\n').forEach(function (linea) {
    const l = linea.trim();
    if (l.indexOf('- ') === 0) {
      if (!enLista) { out.push('<ul>'); enLista = true; }
      out.push('<li>' + conNegritas(l.slice(2)) + '</li>');
      return;
    }
    if (enLista) { out.push('</ul>'); enLista = false; }
    if (!l) return;
    if (l.indexOf('## ') === 0) { out.push('<h2>' + conNegritas(l.slice(3)) + '</h2>'); return; }
    if (l.indexOf('# ') === 0) { out.push('<h1>' + conNegritas(l.slice(2)) + '</h1>'); return; }
    if (l.indexOf('&gt; ') === 0) { out.push('<blockquote>' + conNegritas(l.slice(5)) + '</blockquote>'); return; }
    out.push('<p>' + conNegritas(l) + '</p>');
  });
  if (enLista) out.push('</ul>');
  return out.join('\n');
}

function markdownATextoPlano(md) {
  return md
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^- /gm, '• ')
    .replace(/\*\*(.+?)\*\*/g, '$1');
}

async function copiarLectura() {
  const md = construirMarkdownExport();
  const html = markdownAHtmlExport(md);
  const plano = markdownATextoPlano(md);
  const aviso = document.getElementById('aviso-copiado');
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plano], { type: 'text/plain' }),
        }),
      ]);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(plano);
    } else {
      throw new Error('API de portapapeles no disponible.');
    }
  } catch (err) {
    const area = document.createElement('textarea');
    area.value = plano;
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
   PANTALLA: CLAVE DE LA API DE GEMINI
   ========================================================================== */

let pantallaSiguienteTrasClave = 'pantalla-pregunta';

function abrirPantallaClave(siguientePantalla) {
  pantallaSiguienteTrasClave = siguientePantalla;
  const claveActual = getApiKey();
  const esEdicion = !!claveActual;

  document.getElementById('input-api-key').value = '';
  document.getElementById('input-api-key').placeholder = esEdicion
    ? 'Ya hay una clave guardada — pega una nueva para reemplazarla'
    : 'Pega tu API key de Gemini';
  document.getElementById('error-api-key').hidden = true;
  document.getElementById('btn-cancelar-api-key').hidden = !esEdicion;
  document.getElementById('btn-borrar-api-key').hidden = !esEdicion;

  mostrarPantalla('pantalla-clave');
}

function guardarApiKeyDesdeFormulario() {
  const input = document.getElementById('input-api-key');
  const errorEl = document.getElementById('error-api-key');
  const valor = input.value.trim();
  if (!valor) {
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  setApiKey(valor);
  salirDePantallaClave();
}

// Sale de la pantalla de clave hacia su destino, respetando el limpiado del
// textarea cuando ese destino es la pantalla de pregunta.
function salirDePantallaClave() {
  if (pantallaSiguienteTrasClave === 'pantalla-pregunta') {
    irAPantallaPregunta();
    return;
  }
  mostrarPantalla(pantallaSiguienteTrasClave);
}

/* ==========================================================================
   UI DE SESIÓN Y BITÁCORA
   ========================================================================== */

/* Lee los parámetros que Supabase devuelve al volver del enlace de acceso.
   Pueden venir en el fragmento (#) o en la query (?). */
function parametrosDeRetornoAuth() {
  const salida = {};
  ['hash', 'search'].forEach(function (parte) {
    const crudo = window.location[parte] || '';
    if (crudo.length < 2) return;
    new URLSearchParams(crudo.slice(1)).forEach(function (valor, clave) {
      salida[clave] = valor;
    });
  });
  return salida;
}

function limpiarUrlDeAuth() {
  history.replaceState(null, '', window.location.pathname);
}

/* Muestra en pantalla lo que pasó al volver del enlace. Sin esto, un enlace
   vencido o un redirect no autorizado dejaban la app en la pantalla inicial
   sin ninguna explicación. */
function mostrarErrorSesion(mensaje) {
  const el = document.getElementById('error-sesion');
  if (!el) return;
  if (!mensaje) {
    el.hidden = true;
    return;
  }
  el.textContent = mensaje;
  el.hidden = false;
}

const MENSAJES_ERROR_AUTH = {
  otp_expired: 'Ese enlace ya venció o fue usado. Entrá con tu email y contraseña.',
  access_denied: 'El enlace no pudo validarse. Entrá con tu email y contraseña.',
};

// Recupera la sesión existente (el enlace de acceso vuelve con el token en la
// URL) y queda escuchando los cambios de sesión.
function inicializarSesion() {
  const cliente = iniciarSupabase();
  if (!cliente) {
    actualizarUiSesion();
    return;
  }

  cliente.auth.onAuthStateChange(function (evento, sesion) {
    usuarioActual = (sesion && sesion.user) || null;
    actualizarUiSesion();
  });

  const params = parametrosDeRetornoAuth();
  const veniaDeUnEnlace = !!(params.access_token || params.code || params.error || params.error_code);

  cliente.auth.getSession().then(function (res) {
    usuarioActual = (res && res.data && res.data.session && res.data.session.user) || null;
    actualizarUiSesion();

    if (usuarioActual) {
      mostrarErrorSesion('');
      if (veniaDeUnEnlace) limpiarUrlDeAuth();
      return;
    }

    if (!veniaDeUnEnlace) return;

    // Se volvió de un enlace pero no hay sesión: hay que decir por qué.
    const codigo = params.error_code || params.error || '';
    const detalle = params.error_description ? decodeURIComponent(params.error_description.replace(/\+/g, ' ')) : '';
    const conocido = MENSAJES_ERROR_AUTH[codigo];
    console.error('Retorno de enlace sin sesión. Parámetros:', params, 'getSession:', res);
    mostrarErrorSesion(
      conocido ||
      ('No se pudo iniciar sesión con el enlace' + (codigo ? ' (' + codigo + ')' : '') + '. ' +
       (detalle || 'Entrá con tu email y contraseña.'))
    );
    mostrarPantalla('pantalla-sesion');
    limpiarUrlDeAuth();
  });
}


function actualizarUiSesion() {
  const btnBitacora = document.getElementById('btn-bitacora');
  const btnSesion = document.getElementById('btn-sesion');
  const estadoEl = document.getElementById('estado-sesion');
  if (!btnBitacora || !btnSesion || !estadoEl) return;

  if (!bitacoraDisponible()) {
    btnBitacora.hidden = true;
    btnSesion.hidden = true;
    estadoEl.hidden = true;
    return;
  }

  const dentro = !!usuarioActual;
  btnBitacora.hidden = !dentro;
  btnSesion.hidden = dentro;
  estadoEl.hidden = !dentro;
  if (dentro) {
    estadoEl.textContent = 'Sesión de ' + usuarioActual.email +
      (almacenamientoEnMemoria ? ' · no se pudo guardar en este navegador: al recargar habrá que entrar de nuevo' : '');
  }
}

/* Un solo formulario para entrar o crear la cuenta. */
function credencialesDelFormulario() {
  const email = document.getElementById('input-email').value.trim();
  const contrasena = document.getElementById('input-password').value;
  const errorEl = document.getElementById('error-email');

  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    errorEl.textContent = 'Escribí un email válido.';
    errorEl.hidden = false;
    return null;
  }
  if (contrasena.length < 6) {
    errorEl.textContent = 'La contraseña necesita al menos 6 caracteres.';
    errorEl.hidden = false;
    return null;
  }
  errorEl.hidden = true;
  mostrarErrorSesion('');
  return { email: email, contrasena: contrasena };
}

// Traduce los errores de Supabase a algo accionable en castellano.
function mensajeDeErrorAuth(err) {
  const codigo = (err && err.code) || '';
  const texto = (err && err.message) || '';
  if (codigo === 'invalid_credentials' || /Invalid login credentials/i.test(texto)) {
    return 'Email o contraseña incorrectos. Si todavía no tenés cuenta, tocá "crear una".';
  }
  if (codigo === 'user_already_exists' || /already registered/i.test(texto)) {
    return 'Ya existe una cuenta con ese email. Entrá con su contraseña. ' +
      'Si la cuenta vieja se creó con enlace mágico y no tiene contraseña, borrala en Supabase (Authentication → Users) y volvé a crearla.';
  }
  if (codigo === 'weak_password' || /Password should be/i.test(texto)) {
    return 'La contraseña es demasiado débil: usá al menos 6 caracteres.';
  }
  if (codigo === 'email_address_invalid' || /invalid.*email/i.test(texto)) {
    return 'Supabase rechazó ese email. Probá con otra dirección.';
  }
  if (/signups not allowed|Signup is disabled/i.test(texto)) {
    return 'El registro está desactivado en Supabase. Activá "Allow new users to sign up" en Authentication → Sign In / Providers.';
  }
  if ((err && err.name === 'QuotaExceededError') || /quota has been exceeded|exceeded the quota/i.test(texto)) {
    return 'El almacenamiento de este navegador está lleno, así que no se pudo guardar la sesión. ' +
      'Probá de nuevo: ahora la sesión sigue en memoria. Para que quede guardada, liberá espacio del navegador.';
  }
  if (codigo === 'over_request_rate_limit' || /rate limit/i.test(texto) || (err && err.status === 429)) {
    return 'Demasiados intentos seguidos. Esperá unos minutos y volvé a probar.';
  }
  return texto || 'No se pudo completar la operación.';
}

async function conBotonOcupado(boton, textoOcupado, accion) {
  const original = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoOcupado;
  try {
    await accion();
  } finally {
    boton.disabled = false;
    boton.textContent = original;
  }
}

async function entrarDesdeFormulario() {
  const cred = credencialesDelFormulario();
  if (!cred) return;
  const boton = document.getElementById('btn-entrar');
  await conBotonOcupado(boton, 'Entrando…', async function () {
    try {
      await entrarConContrasena(cred.email, cred.contrasena);
      mostrarPantalla('pantalla-inicio');
    } catch (err) {
      console.error('No se pudo entrar:', err);
      mostrarErrorSesion(mensajeDeErrorAuth(err));
    }
  });
}

async function crearCuentaDesdeFormulario() {
  const cred = credencialesDelFormulario();
  if (!cred) return;
  const boton = document.getElementById('btn-crear-cuenta');
  await conBotonOcupado(boton, 'Creando…', async function () {
    try {
      await crearCuenta(cred.email, cred.contrasena);
      mostrarPantalla('pantalla-inicio');
    } catch (err) {
      console.error('No se pudo crear la cuenta:', err);
      mostrarErrorSesion(mensajeDeErrorAuth(err));
    }
  });
}

function fechaLegible(iso) {
  try {
    return new Date(iso).toLocaleString('es-ES');
  } catch (err) {
    return iso;
  }
}

const ETIQUETAS_ACIERTO = {
  acerto: 'Acertó',
  parcial: 'Parcial',
  fallo: 'Falló',
  sin_verificar: 'Sin verificar',
};

async function abrirBitacora() {
  mostrarPantalla('pantalla-bitacora');
  const estadoEl = document.getElementById('estado-bitacora');
  const listaEl = document.getElementById('lista-bitacora');
  estadoEl.hidden = false;
  estadoEl.textContent = 'Cargando…';
  listaEl.innerHTML = '';

  let consultas;
  try {
    consultas = await listarConsultas();
  } catch (err) {
    estadoEl.textContent = 'No se pudo cargar la bitácora: ' + err.message;
    return;
  }

  if (!consultas.length) {
    estadoEl.textContent = 'Todavía no hay consultas guardadas.';
    return;
  }

  estadoEl.hidden = true;
  consultas.forEach(function (c) {
    listaEl.appendChild(crearTarjetaBitacora(c));
  });
}

function crearTarjetaBitacora(consulta) {
  const juez = figuraPorPuntos(consulta.juez);
  const item = document.createElement('details');
  item.className = 'entrada-bitacora';

  const resumen = document.createElement('summary');
  const acierto = consulta.acierto || 'sin_verificar';
  resumen.innerHTML =
    '<span class="entrada-pregunta"></span>' +
    '<span class="entrada-meta"></span>' +
    '<span class="marca-acierto ' + acierto + '"></span>';
  resumen.querySelector('.entrada-pregunta').textContent = consulta.pregunta;
  resumen.querySelector('.entrada-meta').textContent =
    fechaLegible(consulta.creada_en) + ' · Juez: ' + juez.nombre;
  resumen.querySelector('.marca-acierto').textContent = ETIQUETAS_ACIERTO[acierto];
  item.appendChild(resumen);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'entrada-cuerpo';

  const meta = document.createElement('p');
  meta.className = 'entrada-tema';
  meta.textContent = 'Tema: ' + consulta.tema_etiqueta +
    (consulta.casa_tema ? ' (casa ' + consulta.casa_tema + ')' : '');
  cuerpo.appendChild(meta);

  const interp = document.createElement('div');
  interp.className = 'interpretacion-texto';
  interp.innerHTML = renderizarMarkdownBasico(consulta.interpretacion);
  cuerpo.appendChild(interp);

  cuerpo.appendChild(crearFormularioVerificacion(consulta));
  item.appendChild(cuerpo);
  return item;
}

function crearFormularioVerificacion(consulta) {
  const form = document.createElement('div');
  form.className = 'verificacion';

  const titulo = document.createElement('h4');
  titulo.textContent = 'Verificación posterior';
  form.appendChild(titulo);

  const area = document.createElement('textarea');
  area.rows = 3;
  area.placeholder = 'Qué ocurrió realmente…';
  area.value = consulta.resultado_real || '';
  form.appendChild(area);

  const fila = document.createElement('div');
  fila.className = 'fila-acierto';
  const seleccion = { valor: consulta.acierto || 'sin_verificar' };
  const botones = [];

  ['acerto', 'parcial', 'fallo'].forEach(function (valor) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-acierto' + (seleccion.valor === valor ? ' activo' : '');
    btn.textContent = ETIQUETAS_ACIERTO[valor];
    btn.addEventListener('click', function () {
      seleccion.valor = valor;
      botones.forEach(function (b) { b.classList.remove('activo'); });
      btn.classList.add('activo');
    });
    botones.push(btn);
    fila.appendChild(btn);
  });
  form.appendChild(fila);

  const guardar = document.createElement('button');
  guardar.type = 'button';
  guardar.className = 'btn btn-secundario';
  guardar.textContent = 'Guardar verificación';
  const aviso = document.createElement('p');
  aviso.className = 'aviso-guardado';
  aviso.hidden = true;

  guardar.addEventListener('click', async function () {
    guardar.disabled = true;
    guardar.textContent = 'Guardando…';
    try {
      await guardarVerificacion(consulta.id, area.value.trim(), seleccion.valor);
      aviso.textContent = 'Verificación guardada.';
      aviso.hidden = false;
      const marca = form.closest('.entrada-bitacora').querySelector('.marca-acierto');
      marca.className = 'marca-acierto ' + seleccion.valor;
      marca.textContent = ETIQUETAS_ACIERTO[seleccion.valor];
    } catch (err) {
      aviso.textContent = 'No se pudo guardar: ' + err.message;
      aviso.hidden = false;
    } finally {
      guardar.disabled = false;
      guardar.textContent = 'Guardar verificación';
    }
  });

  form.appendChild(guardar);
  form.appendChild(aviso);
  return form;
}

/* ==========================================================================
   REINICIO DE CONSULTA
   ========================================================================== */

/* Entra a la pantalla de pregunta limpiando el textarea si la pregunta anterior
   ya se usó en una tirada. Si el usuario solo fue y volvió sin consultar, se
   conserva lo que estaba escribiendo. */
function irAPantallaPregunta() {
  if (estado.preguntaConsumida) {
    estado.pregunta = '';
    estado.preguntaConsumida = false;
    document.getElementById('input-pregunta').value = '';
  }
  document.getElementById('error-pregunta').hidden = true;
  mostrarPantalla('pantalla-pregunta');
}

function reiniciarConsulta(mantenerPregunta) {
  if (!mantenerPregunta) {
    estado.pregunta = '';
    estado.preguntaConsumida = false;
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
  inicializarSesion();

  document.getElementById('btn-sesion').addEventListener('click', function () {
    document.getElementById('error-email').hidden = true;
    mostrarErrorSesion('');
    mostrarPantalla('pantalla-sesion');
  });

  document.getElementById('btn-volver-sesion').addEventListener('click', function () {
    mostrarPantalla('pantalla-inicio');
  });

  document.getElementById('btn-entrar').addEventListener('click', entrarDesdeFormulario);
  document.getElementById('btn-crear-cuenta').addEventListener('click', crearCuentaDesdeFormulario);

  // Enter en cualquiera de los dos campos entra directo.
  ['input-email', 'input-password'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') entrarDesdeFormulario();
    });
  });

  document.getElementById('btn-bitacora').addEventListener('click', abrirBitacora);

  document.getElementById('btn-volver-bitacora').addEventListener('click', function () {
    mostrarPantalla('pantalla-inicio');
  });

  document.getElementById('btn-cerrar-sesion').addEventListener('click', async function () {
    await cerrarSesion();
    mostrarPantalla('pantalla-inicio');
  });

  document.getElementById('btn-comenzar').addEventListener('click', function () {
    if (!getApiKey()) {
      abrirPantallaClave('pantalla-pregunta');
      return;
    }
    irAPantallaPregunta();
  });

  document.getElementById('btn-config-api-key').addEventListener('click', function () {
    abrirPantallaClave('pantalla-inicio');
  });

  document.getElementById('btn-guardar-api-key').addEventListener('click', guardarApiKeyDesdeFormulario);

  document.getElementById('btn-cancelar-api-key').addEventListener('click', salirDePantallaClave);

  document.getElementById('btn-borrar-api-key').addEventListener('click', function () {
    borrarApiKey();
    mostrarPantalla('pantalla-inicio');
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
    estado.preguntaConsumida = true;
    const temaId = document.getElementById('select-tema').value;
    estado.tema = TEMAS.find(function (t) { return t.id === temaId; }) || TEMAS[TEMAS.length - 1];
    mostrarPantalla('pantalla-generacion');
    iniciarGeneracion();
  });

  document.getElementById('btn-reintentar').addEventListener('click', solicitarInterpretacion);
  document.getElementById('btn-nueva-interpretacion').addEventListener('click', solicitarInterpretacion);
  document.getElementById('btn-copiar-md').addEventListener('click', copiarLectura);
  document.getElementById('btn-nueva-consulta').addEventListener('click', function () { reiniciarConsulta(false); });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializar);

  // Los navegadores móviles restauran el valor del textarea al volver desde el
  // bfcache o al restaurar la sesión, aunque el estado JS se haya reiniciado.
  // Si no hay una consulta en curso, se limpia para no arrastrar la pregunta anterior.
  window.addEventListener('pageshow', function () {
    const input = document.getElementById('input-pregunta');
    if (input && !estado.pregunta) input.value = '';
  });
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
    figurasAlucinadas: figurasAlucinadas,
  };
}
