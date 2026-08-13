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
   SENTRY: MONITOREO DE ERRORES

   Opcional: sin SENTRY_DSN en config.js no se activa nada.

   El punto delicado es la privacidad. Las preguntas de una consulta son datos
   íntimos, y por defecto Sentry captura mucho contexto: registros de consola,
   URLs de las peticiones (¡la de Gemini lleva la clave en la query!) y los
   textos de los errores, que en esta app pueden incluir la interpretación.
   Por eso todo pasa por un saneado antes de salir del navegador.
   ========================================================================== */

// Patrones que nunca deben salir del dispositivo.
const PATRONES_SENSIBLES = [
  { re: /([?&]key=)[^&\s"']+/gi, por: '$1[CLAVE]' },          // clave en la URL de Gemini
  { re: /AIza[0-9A-Za-z_\-]{10,}/g, por: '[CLAVE-GOOGLE]' },   // claves de Google
  { re: /eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, por: '[TOKEN]' }, // JWT
  { re: /[\w.+-]+@[\w-]+\.[\w.]+/g, por: '[EMAIL]' },
];

/* Quita de un texto las claves, los tokens, los emails y —lo más importante—
   la pregunta y la interpretación de la consulta en curso. */
function limpiarDatosSensibles(texto, contexto) {
  if (typeof texto !== 'string' || !texto) return texto;
  let salida = texto;

  const propios = contexto || {};
  // La pregunta y la interpretación se reemplazan primero, tal cual están.
  [
    { valor: propios.pregunta, etiqueta: '[PREGUNTA]' },
    { valor: propios.interpretacion, etiqueta: '[INTERPRETACION]' },
  ].forEach(function (dato) {
    if (dato.valor && dato.valor.length > 8) {
      salida = salida.split(dato.valor).join(dato.etiqueta);
    }
  });

  PATRONES_SENSIBLES.forEach(function (p) {
    salida = salida.replace(p.re, p.por);
  });
  return salida;
}

// Sanea el evento entero recorriéndolo serializado: es contundente y no deja
// campos sin revisar por haberlos pasado por alto.
function limpiarEventoSentry(evento, contexto) {
  try {
    const crudo = JSON.stringify(evento);
    const limpio = limpiarDatosSensibles(crudo, contexto);
    return JSON.parse(limpio);
  } catch (err) {
    // Ante la duda, no se manda nada.
    return null;
  }
}

/* Reporta a Sentry un fallo que la app ya atrapó.

   Hace falta explícitamente: Sentry solo captura por su cuenta los errores NO
   atrapados, y esta app atrapa casi todo para poder mostrar mensajes claros.
   Sin esto, justamente los fallos que interesan (que el oráculo no responda,
   que no se guarde una consulta) no llegarían nunca.

   El `contexto` es para diagnosticar —modelo, estado HTTP, intentos—, nunca
   para datos de la consulta; y de todos modos el saneado de beforeSend vuelve
   a pasar sobre el evento entero. */
function reportarError(err, dondeOcurrio, contexto) {
  if (typeof window === 'undefined' || !window.Sentry || !window.Sentry.captureException) return;
  try {
    window.Sentry.captureException(err, {
      tags: { donde: dondeOcurrio },
      extra: contexto || {},
    });
  } catch (fallo) {
    console.warn('No se pudo reportar el error a Sentry:', fallo);
  }
}

/* Igual que reportarError, pero para algo que NO es un fallo: un aviso de
   avisosDeInterpretacion (asignación cruzada, figura del hilo sin aclarar).
   No bloquea nada — esto es solo para medir con qué frecuencia dispara antes
   de decidir si hace falta UI para mostrarlo o si es puro ruido. Pasa por el
   mismo beforeSend que reportarError, así que el saneado de datos sensibles
   se aplica igual. */
function reportarAviso(mensaje, contexto) {
  if (typeof window === 'undefined' || !window.Sentry || !window.Sentry.captureMessage) return;
  try {
    window.Sentry.captureMessage(mensaje, {
      level: 'info',
      tags: { donde: 'interpretacion.aviso' },
      extra: contexto || {},
    });
  } catch (fallo) {
    console.warn('No se pudo reportar el aviso a Sentry:', fallo);
  }
}

function iniciarSentry() {
  const cfg = (typeof window !== 'undefined' && window.GEOMANCIA_CONFIG) || {};
  const dsn = cfg.SENTRY_DSN || '';
  if (!dsn || typeof window === 'undefined' || !window.Sentry) return;

  try {
    window.Sentry.init({
      dsn: dsn,
      environment: cfg.SENTRY_ENTORNO || 'produccion',
      // Nada de datos personales automáticos, ni grabación de sesión.
      sendDefaultPii: false,
      // Solo errores: no se instrumenta rendimiento ni se graba la pantalla.
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,

      beforeBreadcrumb: function (rastro) {
        // Los console.error de esta app llegan a incluir la respuesta completa
        // del modelo, o sea la interpretación: se descartan por completo.
        if (rastro.category === 'console') return null;
        if (rastro.data && rastro.data.url) {
          rastro.data.url = limpiarDatosSensibles(rastro.data.url, {});
        }
        return rastro;
      },

      beforeSend: function (evento) {
        return limpiarEventoSentry(evento, {
          pregunta: (typeof estado !== 'undefined' && estado.pregunta) || '',
          interpretacion: (typeof estado !== 'undefined' && estado.interpretacion) || '',
        });
      },
    });
  } catch (err) {
    console.warn('No se pudo iniciar Sentry:', err);
  }
}

function sentryConfigurado() {
  const cfg = (typeof window !== 'undefined' && window.GEOMANCIA_CONFIG) || {};
  return !!(cfg.SENTRY_DSN || '');
}

/* Muestra u oculta el botón de diagnóstico según haya DSN configurado. Se
   revisa la presencia del DSN, no si window.Sentry ya cargó: el botón debe
   estar visible incluso si el script todavía no llegó (o falló), porque esa
   es justamente una de las cosas que el diagnóstico tiene que poder decir. */
function actualizarUiSentry() {
  const boton = document.getElementById('btn-probar-sentry');
  if (!boton) return;
  boton.hidden = !sentryConfigurado();
}

/* Prueba el circuito completo con la red en su estado normal (a diferencia de
   forzar un fallo en modo avión, que hace que el propio reporte de error
   intente salir sin conexión y se pierda: Sentry no reintenta indefinidamente
   si la app se cierra antes de que vuelva la red).

   Reporta en pantalla, paso a paso, dónde se cortó: si el script no cargó, si
   Sentry.init no corrió, o si el evento no se pudo entregar al servidor. */
async function probarSentry() {
  const estadoEl = document.getElementById('estado-sentry');
  const mostrar = function (texto) {
    estadoEl.hidden = false;
    estadoEl.textContent = texto;
  };

  mostrar('Probando…');

  if (typeof window === 'undefined' || !window.Sentry) {
    mostrar('⚠ El script de Sentry no cargó. Revisá la conexión, o si algo (un bloqueador de anuncios, modo privado) frena browser.sentry-cdn.com.');
    return;
  }
  if (typeof window.Sentry.captureException !== 'function') {
    mostrar('⚠ El script cargó pero no expone captureException: la versión del bundle no es la esperada.');
    return;
  }

  try {
    const idEvento = window.Sentry.captureException(
      new Error('Prueba manual desde Geomancia — ' + new Date().toISOString())
    );

    const cliente = typeof window.Sentry.getClient === 'function' ? window.Sentry.getClient() : null;
    if (cliente && typeof cliente.flush === 'function') {
      const entregado = await cliente.flush(6000);
      mostrar(entregado
        ? '✓ Enviado (id ' + idEvento + '). Debería aparecer en Issues en unos segundos.'
        : '⚠ Sentry no confirmó la entrega en 6s. Puede ser la red, o que el DSN no sea válido.');
      return;
    }

    mostrar('Se generó el evento (id ' + idEvento + ') pero no se pudo confirmar el envío en este SDK.');
  } catch (err) {
    mostrar('⚠ Falló al intentar enviarlo: ' + err.message);
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
    // Si se está siguiendo un asunto, la consulta cuelga de la raíz del hilo.
    origen_id: estado.hilo ? estado.hilo.raizId : null,
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
    reportarError(new Error(error.message || 'Fallo al guardar en la bitácora'),
      'bitacora.guardar', { codigo: error.code, detalle: error.details });
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
    // 200 y no 100: ahora una misma tirada puede ocupar varias filas, y si el
    // corte cae en medio de un hilo la bitácora muestra seguimientos huérfanos.
    .limit(200);
  if (error) {
    console.error('No se pudo leer la bitácora:', error);
    reportarError(new Error(error.message || 'Fallo al leer la bitácora'),
      'bitacora.leer', { codigo: error.code });
    throw new Error(error.message);
  }
  return data || [];
}

async function borrarConsulta(id) {
  const cliente = iniciarSupabase();
  if (!cliente || !usuarioActual) throw new Error('No hay sesión abierta.');
  const { error } = await cliente.from('consultas').delete().eq('id', id);
  if (error) throw new Error(error.message);
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

   `puntos` — CORREGIDO. La tabla original (primer commit del proyecto,
   nunca revisada) asignaba binarios equivocados: solo Via y Populus
   coincidían con la correspondencia real. Se reescribió entera y se
   verificó con dos propiedades estructurales independientes, ambas
   comprobadas en scripts/verify-figures.js:
     (a) las únicas figuras verticalmente simétricas son Populus, Via,
         Coniunctio y Carcer;
     (b) Laetitia, Rubeus, Albus y Tristitia son las únicas con una sola
         línea activa, en Fuego, Aire, Agua y Tierra respectivamente.
   Los binarios guardados en Supabase nunca estuvieron mal: la matemática
   del escudo (calcularEscudo) es correcta y no se toca. Lo que estaba mal
   es esta tabla de nombres, y por lo tanto el texto que la IA generaba a
   partir de ella. Las consultas ya guardadas pueden mostrar ahora un
   escudo con nombres distintos de los que menciona su propia
   interpretación — es exactamente lo esperado, no un dato corrupto (ver
   interpretacionDesactualizada más abajo).

   `elemento` — PARCIALMENTE CORREGIDO. Se corrigieron los cuatro casos que
   la propiedad (b) determina sin ambigüedad (Laetitia=Fuego, Rubeus=Aire,
   Albus=Agua, Tristitia=Tierra: la posición de su única línea activa lo
   fija). Las otras doce quedan con el valor de la tabla original, SIN
   VERIFICAR: la atribución elemental (y la planetaria, en las 16) varía
   entre tradiciones (Agrippa, Golden Dawn, la escuela árabe) y no se
   deriva matemáticamente del binario. Decidir una fuente para esas doce es
   una tarea aparte. `planeta`, `signo`, `naturaleza`, `significado` y
   `traduccion` tampoco están verificados contra ninguna fuente.
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
    puntos: [2, 2, 1, 1],
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
    puntos: [1, 1, 2, 2],
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
    puntos: [2, 1, 2, 1],
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
    puntos: [1, 2, 1, 2],
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
    puntos: [2, 2, 1, 2],
    elemento: 'Agua',
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
    puntos: [2, 1, 2, 2],
    elemento: 'Aire',
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
    puntos: [1, 2, 1, 1],
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
    puntos: [1, 1, 2, 1],
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
    puntos: [2, 1, 1, 2],
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
    puntos: [1, 2, 2, 1],
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
    puntos: [2, 2, 2, 1],
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
    puntos: [1, 2, 2, 2],
    elemento: 'Fuego',
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
    puntos: [2, 1, 1, 1],
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
    puntos: [1, 1, 1, 2],
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

/* Todas las posiciones del escudo con su etiqueta: ['Madre 1', puntos], etc.
   Base para la lista blanca/negra del prompt, las repeticiones y la revisión
   de asignaciones por casa. */
function posicionesDeEscudo(escudo, casas) {
  const pares = [];
  escudo.madres.forEach(function (f, i) { pares.push(['Madre ' + (i + 1), f]); });
  escudo.hijas.forEach(function (f, i) { pares.push(['Hija ' + (i + 1), f]); });
  escudo.sobrinas.forEach(function (f, i) { pares.push(['Sobrina ' + (i + 1), f]); });
  pares.push(['Testigo Derecho', escudo.testigoDerecho]);
  pares.push(['Testigo Izquierdo', escudo.testigoIzquierdo]);
  pares.push(['Juez', escudo.juez]);
  pares.push(['Reconciliador', escudo.reconciliador]);
  (casas || []).forEach(function (f, i) { pares.push(['Casa ' + (i + 1), f]); });
  return pares;
}

/* Qué figura se repite y en qué posiciones. Se calcula en JavaScript, no se
   le pide al modelo que la descubra por su cuenta (antes, regla 9 dejaba
   la detección librada al modelo). */
function detectarRepeticiones(escudo, casas) {
  const mapa = {};
  posicionesDeEscudo(escudo, casas).forEach(function (par) {
    const nombre = figuraPorPuntos(par[1]).nombre;
    (mapa[nombre] = mapa[nombre] || []).push(par[0]);
  });

  return Object.keys(mapa)
    .filter(function (n) { return mapa[n].length > 1; })
    .sort(function (a, b) { return mapa[b].length - mapa[a].length; })
    .map(function (n) { return n + ' aparece ' + mapa[n].length + ' veces: ' + mapa[n].join(', ') + '.'; });
}

/* Recalcula el escudo desde las madres y compara con lo que trae el objeto.
   Devuelve un array de discrepancias (vacío si todo cuadra).

   NO se usa en la consulta en vivo: ahí `estado.escudo` es tautológicamente
   el resultado de calcularEscudo() recién llamado, no hay nada que pueda
   haberse desalineado todavía. Sí importa para datos que vienen de
   Supabase —un paso previo de un hilo, o una fila auditada— porque esos
   sí pueden estar corruptos o mal migrados. Ver pasosDelHilo() e
   interpretacionDesactualizada(). */
function verificarEscudo(escudo) {
  const problemas = [];
  let esperado;
  try {
    esperado = calcularEscudo(escudo.madres);
  } catch (err) {
    return ['No se pudo recalcular el escudo: ' + err.message];
  }

  const comparar = function (etiqueta, real, calculada) {
    if (!real) { problemas.push(etiqueta + ': falta en los datos.'); return; }
    const a = real.join('');
    const b = calculada.join('');
    if (a !== b) {
      let nombreReal = '?';
      let nombreCalculado = '?';
      try { nombreReal = figuraPorPuntos(real).nombre; } catch (err) { /* patrón inválido */ }
      try { nombreCalculado = figuraPorPuntos(calculada).nombre; } catch (err) { /* patrón inválido */ }
      problemas.push(etiqueta + ': guardado ' + a + ' (' + nombreReal + ') ' +
        'pero corresponde ' + b + ' (' + nombreCalculado + ').');
    }
  };

  esperado.hijas.forEach(function (f, i) { comparar('Hija ' + (i + 1), (escudo.hijas || [])[i], f); });
  esperado.sobrinas.forEach(function (f, i) { comparar('Sobrina ' + (i + 1), (escudo.sobrinas || [])[i], f); });
  comparar('Testigo Derecho', escudo.testigoDerecho, esperado.testigoDerecho);
  comparar('Testigo Izquierdo', escudo.testigoIzquierdo, esperado.testigoIzquierdo);
  comparar('Juez', escudo.juez, esperado.juez);
  comparar('Reconciliador', escudo.reconciliador, esperado.reconciliador);

  if (escudo.casas) {
    esperado.casas.forEach(function (f, i) { comparar('Casa ' + (i + 1), escudo.casas[i], f); });
  }

  return problemas;
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
  idConsultaGuardada: null, // id en la bitácora, si el consultante decidió guardarla
  fecha: null,
  // true cuando la pregunta ya se usó en una tirada: al volver a la pantalla de
  // pregunta se limpia el textarea en vez de arrastrar la consulta anterior.
  preguntaConsumida: false,
  // El asunto que se está siguiendo, o null si la consulta es suelta.
  // `consultas` son las del hilo, de la más vieja a la más nueva.
  hilo: null, // { raizId, consultas: [fila, …] }
};

/* ==========================================================================
   NAVEGACIÓN ENTRE PANTALLAS
   ========================================================================== */

/* Oculta un elemento sin romperse si falta (ver alTocar). */
function ocultar(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

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
  actualizarCartelHilo();
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

/* Dibuja el escudo dentro de un contenedor. Sirve tanto para el resultado
   recién calculado como para una consulta guardada en la bitácora. */
function pintarEscudoEn(cont, escudo) {
  cont.innerHTML = '';

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
  const madresHijas = [
    escudo.hijas[3], escudo.hijas[2], escudo.hijas[1], escudo.hijas[0],
    escudo.madres[3], escudo.madres[2], escudo.madres[1], escudo.madres[0],
  ];
  filaDe(madresHijas, ['Hija 4', 'Hija 3', 'Hija 2', 'Hija 1', 'Madre 4', 'Madre 3', 'Madre 2', 'Madre 1']);

  tituloFila('Sobrinas');
  filaDe(escudo.sobrinas, ['Sobrina 1', 'Sobrina 2', 'Sobrina 3', 'Sobrina 4']);

  tituloFila('Testigos');
  filaDe([escudo.testigoIzquierdo, escudo.testigoDerecho], ['Testigo Izquierdo', 'Testigo Derecho']);

  tituloFila('Juez y Reconciliador');
  filaDe([escudo.juez, escudo.reconciliador], ['Juez', 'Reconciliador']);
}

/* Dibuja la carta de 12 casas, marcando la casa del tema consultado. */
function pintarCartaCasasEn(cont, casas, casaRelevante) {
  cont.innerHTML = '';
  CASAS.forEach(function (casaInfo, idx) {
    const figura = figuraPorPuntos(casas[idx]);
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
    fig.textContent = figura.nombre + ' · ' + figura.naturaleza.replace('-', ' ');
    div.appendChild(fig);

    cont.appendChild(div);
  });
}

function renderizarEscudoCompleto() {
  pintarEscudoEn(document.getElementById('escudo-completo'), estado.escudo);
}

function renderizarCartaCasas() {
  pintarCartaCasasEn(document.getElementById('carta-casas'), estado.escudo.casas, estado.tema.casa);
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
  '6. ESTRUCTURA OBLIGATORIA. La respuesta ARRANCA SIEMPRE con esta sección, antes que cualquier otra cosa:\n' +
  '   "## Respuesta directa", y debajo:\n' +
  '   (a) Una línea en negrita que abra con el veredicto en palabras corrientes: **Sí**, **Sí, pero…**, **No**, **No, salvo que…** o **Depende de…**\n' +
  '   (b) Dos o tres frases que expliquen ese veredicto SIN UN SOLO nombre de figura geomántica y SIN los términos Juez, Testigo, Sobrina, Madre, Hija, Reconciliador, escudo ni número de casa. Escríbelas como se lo explicarías a alguien que no sabe nada de geomancia y solo quiere saber a qué atenerse.\n' +
  '   (c) Si el veredicto lleva condición, una línea "**Lo que lo define:** …" también en lenguaje llano y accionable.\n' +
  '   Recién DESPUÉS de esa sección viene la lectura técnica, bajo el título "## La lectura", con este orden: Juez → camino (Testigos) → casa del tema → estado del consultante (casa 1) → Reconciliador → consejo accionable → síntesis en una frase.\n' +
  '   La sección "## Respuesta directa" y la sección "## La lectura" no pueden contradecirse.\n' +
  '6bis. LENGUAJE EN LA PARTE TÉCNICA. La primera vez que aparezca un término del arte o el nombre de una figura, agrega una glosa brevísima entre paréntesis: por ejemplo "el Juez (la sentencia general del asunto)" o "Tristitia (peso y restricción)". No repitas la glosa las veces siguientes. Español claro y legible, denso pero no enredado. Usa **negritas** en lo clave. Sin relleno místico decorativo.\n' +
  '7. Si la pregunta involucra daño a terceros, salud grave o decisiones legales/financieras mayores, da el veredicto simbólico pero recuerda que esto no sustituye consejo profesional.\n' +
  '8. COBERTURA OBLIGATORIA: antes de la síntesis final cubre explícitamente el Juez, AMBOS Testigos, la figura de la casa del tema, la figura de casa 1 y el Reconciliador. Menciona las Sobrinas o las Madres cuando aporten información relevante, sobre todo si repiten una figura o contradicen al Juez.\n' +
  '9. Cuando dos posiciones muestran la MISMA figura (por ejemplo ambos Testigos iguales, o una figura que se repite entre Madres, Hijas o Sobrinas), eso es significativo en geomancia: señálalo y explica qué refuerza o insiste, en lugar de describir la figura dos veces con el mismo texto.\n' +
  '10. ANCLAJE A LOS DATOS: usa EXCLUSIVAMENTE las figuras provistas en los datos de esta tirada. NUNCA menciones el nombre de una figura geomántica que no aparezca literalmente en los datos entregados — ni siquiera para compararla, contrastarla o ponerla de ejemplo. NUNCA inventes posiciones, casas o figuras fuera del schema provisto. Si hablas de una casa, usa exactamente la figura que la carta de 12 casas lista para esa casa.\n' +
  '11. No infieras ni asumas el estado emocional del consultante a partir de la pregunta. Interpreta la tirada, no a la persona.\n' +
  '12. Si la pregunta pide CUÁNDO ocurrirá algo (un timing, una fecha o un plazo), señala explícitamente que la geomancia clásica de este sistema no calcula fechas ni plazos: juzga la tendencia y la condición del asunto. Da el veredicto sobre hacia dónde se inclina el asunto, pero NO inventes tiempos, meses ni cantidades de días.\n' +
  '13. AGENCIA. Distingue con claridad qué parte del desenlace depende de la otra parte y qué parte depende del consultante, y apóyalo en qué Testigo lo sostiene. No atribuyas la iniciativa a la otra parte si el Testigo Izquierdo no lo respalda.\n' +
  '14. Si al leer los datos encuentras una contradicción interna, dilo abiertamente en lugar de resolverla inventando. Nunca rellenes un vacío con una figura plausible.\n' +
  '15. Responde EXCLUSIVAMENTE en español.';

// Las únicas 4 figuras con `elemento` verificado (ver el comentario en
// FIGURAS): las únicas para las que el prompt puede usar ese campo.
const ELEMENTO_VERIFICADO = new Set(['Laetitia', 'Rubeus', 'Albus', 'Tristitia']);

/* El binario va pegado al nombre, entre corchetes: el modelo ve el dato duro
   junto al nombre y no puede sustituir uno sin contradecir al otro.

   `elemento` y `planeta` NO van al prompt salvo la excepción de abajo:
   salieron de la misma generación sin revisar que produjo la tabla de
   binarios mala (ver el comentario en FIGURAS), y el modelo no debe razonar
   sobre un dato que sabemos dudoso. Única excepción: `elemento` para las 4
   figuras verificadas. `planeta` no se manda para ninguna — no está
   verificado para ninguna de las 16. */
function describirFigura(puntos) {
  const f = figuraPorPuntos(puntos);
  const elemento = ELEMENTO_VERIFICADO.has(f.nombre) ? ', elemento ' + f.elemento : '';
  return '[' + puntos.join('·') + '] ' + f.nombre + ' (' + f.traduccion + ', ' + f.naturaleza + elemento + ')';
}

/* Los bloques de datos que van a cualquier prompt: las 16 posiciones del
   escudo, la carta de casas, la lista blanca/negra de figuras (con el
   binario ya delator de cualquier sustitución) y las repeticiones, ya
   calculadas — no a discreción del modelo. Se arman aparte porque el
   seguimiento los necesita idénticos, pero leyendo de una fila guardada en
   vez de `estado`. */
function bloquesDeTirada(escudo, casas, casaRelevante) {
  const bloqueEscudo = [
    'Madre 1: ' + describirFigura(escudo.madres[0]),
    'Madre 2: ' + describirFigura(escudo.madres[1]),
    'Madre 3: ' + describirFigura(escudo.madres[2]),
    'Madre 4: ' + describirFigura(escudo.madres[3]),
    'Hija 1: ' + describirFigura(escudo.hijas[0]),
    'Hija 2: ' + describirFigura(escudo.hijas[1]),
    'Hija 3: ' + describirFigura(escudo.hijas[2]),
    'Hija 4: ' + describirFigura(escudo.hijas[3]),
    'Sobrina 1: ' + describirFigura(escudo.sobrinas[0]),
    'Sobrina 2: ' + describirFigura(escudo.sobrinas[1]),
    'Sobrina 3: ' + describirFigura(escudo.sobrinas[2]),
    'Sobrina 4: ' + describirFigura(escudo.sobrinas[3]),
    'Testigo Derecho: ' + describirFigura(escudo.testigoDerecho),
    'Testigo Izquierdo: ' + describirFigura(escudo.testigoIzquierdo),
    'Juez: ' + describirFigura(escudo.juez),
    'Reconciliador: ' + describirFigura(escudo.reconciliador),
  ].join('\n');

  const bloqueCasas = CASAS.map(function (casaInfo, idx) {
    const marca = casaInfo.numero === casaRelevante ? '  ← CASA DEL TEMA' : '';
    return 'Casa ' + casaInfo.numero + ' (' + casaInfo.significado + '): ' + describirFigura(casas[idx]) + marca;
  }).join('\n');

  const presentes = [];
  posicionesDeEscudo(escudo, casas).forEach(function (par) {
    const nombre = figuraPorPuntos(par[1]).nombre;
    if (presentes.indexOf(nombre) === -1) presentes.push(nombre);
  });
  const ausentes = FIGURAS.map(function (f) { return f.nombre; })
    .filter(function (n) { return presentes.indexOf(n) === -1; });

  const bloqueListaNegra =
    '--- FIGURAS AUSENTES EN ESTA TIRADA (prohibido nombrarlas, ni para comparar) ---\n' +
    (ausentes.length ? ausentes.join(', ') : '(ninguna: esta tirada usa las 16)');

  const repeticiones = detectarRepeticiones(escudo, casas);
  const bloqueRepeticiones =
    '--- REPETICIONES YA CALCULADAS (no las recuentes, úsalas tal cual) ---\n' +
    (repeticiones.length ? repeticiones.join('\n') : 'Ninguna figura se repite en esta tirada.');

  return {
    bloqueEscudo: bloqueEscudo,
    bloqueCasas: bloqueCasas,
    bloqueListaNegra: bloqueListaNegra,
    bloqueRepeticiones: bloqueRepeticiones,
    presentes: presentes,
    ausentes: ausentes,
  };
}

function construirPrompt() {
  const e = estado.escudo;
  const casaRelevante = estado.tema.casa;
  const figuraCasaRelevante = casaRelevante ? describirFigura(e.casas[casaRelevante - 1]) : 'No aplica (consulta general, solo se juzga con el Juez).';
  const figuraCasa1 = describirFigura(e.casas[0]);
  const fechaTexto = estado.fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const bloques = bloquesDeTirada(e, e.casas, casaRelevante);
  const bloqueEscudo = bloques.bloqueEscudo;
  const bloqueCasas = bloques.bloqueCasas;

  // Con hilo activo, la prohibición de la lista negra es sobre el escudo de
  // HOY únicamente: la regla H2 pide, aparte, nombrar una figura de una
  // tirada anterior si se aclara que es de aquella tirada. Sin hilo, la
  // prohibición es absoluta.
  const notaListaNegra = estado.hilo
    ? '\n(Esto es sobre el escudo de HOY. Si necesitas nombrar una figura de una ' +
      'tirada anterior de este mismo asunto, podés hacerlo — aclarando que es de ' +
      'aquella tirada, como pide la regla H2 — aunque esté en esta lista.)'
    : '';

  const armar = function (bloqueHilo) {
    return INSTRUCCIONES_SISTEMA + (bloqueHilo ? INSTRUCCIONES_HILO : '') + '\n\n' +
      '--- CONSULTA ---\n' +
      'Fecha: ' + fechaTexto + '\n' +
      'Pregunta: ' + estado.pregunta + '\n' +
      'Tema seleccionado: ' + estado.tema.etiqueta + (casaRelevante ? ' (casa ' + casaRelevante + ')' : '') + '\n\n' +
      '--- ESCUDO COMPLETO ---\n' + bloqueEscudo + '\n\n' +
      '--- CARTA DE 12 CASAS (figura asignada a cada casa) ---\n' + bloqueCasas + '\n\n' +
      '--- FIGURA EN LA CASA DEL TEMA ---\n' + figuraCasaRelevante + '\n\n' +
      '--- FIGURA EN CASA 1 (el consultante) ---\n' + figuraCasa1 + '\n\n' +
      bloques.bloqueListaNegra + notaListaNegra + '\n\n' +
      bloques.bloqueRepeticiones + '\n\n' +
      (bloqueHilo || '') +
      'Redacta la interpretación siguiendo exactamente la jerarquía y estructura indicadas en las reglas. ' +
      'Recuerda: solo puedes nombrar figuras que aparezcan literalmente en los datos de arriba.';
  };

  const pasos = estado.hilo ? estado.hilo.consultas : [];
  if (!pasos.length) return armar('');

  // El historial se afloja soltando el veredicto del paso más viejo hasta entrar
  // en el presupuesto. El escudo de hoy y la pregunta de hoy no se recortan nunca.
  let conVeredicto = MAX_PASOS_CON_VEREDICTO;
  let prompt = armar(bloqueDeHilo(pasos, conVeredicto));
  while (prompt.length > TOPE_PROMPT && conVeredicto > 0) {
    conVeredicto--;
    prompt = armar(bloqueDeHilo(pasos, conVeredicto));
  }
  return prompt;
}

/* ==========================================================================
   HILOS: SEGUIR UN ASUNTO A LO LARGO DEL TIEMPO

   Un asunto no se agota en una consulta. Meses después se vuelve sobre lo
   mismo con otra pregunta, y ahí se levanta un escudo NUEVO — el de entonces
   ya cumplió. Lo que se hereda no es la tirada: es el conocimiento. El prompt
   de cada paso lleva las consultas anteriores del asunto (pregunta, Juez,
   veredicto y qué ocurrió realmente) para que el modelo juzgue el escudo de
   hoy sabiendo de dónde viene el asunto.
   ========================================================================== */

/* La fila guardada usa snake_case; el resto del código (y el validador
   anti-alucinación) espera el escudo en camelCase. Incluye `casas` para que
   verificarEscudo() e interpretacionDesactualizada() puedan comparar también
   la carta de 12 casas, no solo las 7 posiciones nombradas. */
function escudoDeConsulta(c) {
  return {
    madres: c.madres,
    hijas: c.hijas,
    sobrinas: c.sobrinas,
    testigoDerecho: c.testigo_derecho,
    testigoIzquierdo: c.testigo_izquierdo,
    juez: c.juez,
    reconciliador: c.reconciliador,
    casas: c.casas,
  };
}

/* Compara el texto de una consulta guardada contra lo que la tabla ACTUAL de
   figuras dice hoy. Es de solo lectura: no toca la base ni migra nada. Sirve
   para marcar lecturas cuya interpretación quedó desalineada por la
   corrección de la tabla FIGURAS (ver el comentario en su declaración) —
   el escudo guardado es correcto, lo que cambió es qué nombre le
   corresponde a cada binario.

   No está conectada a ninguna pantalla todavía: la estrategia de UI y de
   qué hacer con estas lecturas se define en otra tarea. */
function interpretacionDesactualizada(consulta) {
  const escudo = escudoDeConsulta(consulta);

  const problemasEscudo = verificarEscudo(escudo);
  if (problemasEscudo.length) {
    return { desactualizada: true, motivo: 'escudo', detalle: problemasEscudo };
  }

  const posiciones = posicionesDeEscudo(escudo, escudo.casas || []);
  const presentes = new Set(posiciones.map(function (p) { return figuraPorPuntos(p[1]).nombre; }));
  const texto = consulta.interpretacion || '';

  const mencionadasAusentes = FIGURAS
    .filter(function (f) { return !presentes.has(f.nombre); })
    .filter(function (f) { return new RegExp('\\b' + f.nombre + '\\b').test(texto); })
    .map(function (f) { return f.nombre; });

  if (mencionadasAusentes.length) {
    return { desactualizada: true, motivo: 'figuras', detalle: mencionadasAusentes };
  }

  return { desactualizada: false };
}

const INSTRUCCIONES_HILO =
  '\n\nESTA CONSULTA CONTINÚA UN ASUNTO YA CONSULTADO. Reglas adicionales, por encima de cualquier otra:\n' +
  'H1. El escudo de esta consulta se levantó HOY y es el ÚNICO que juzga la pregunta de hoy. Las tiradas anteriores son contexto: ya cumplieron, no las vuelvas a interpretar.\n' +
  'H2. Cuando nombres una figura de una tirada anterior, di explícitamente que era de aquella tirada. NUNCA la mezcles con las figuras de hoy ni la trates como si estuviera en el escudo actual.\n' +
  'H3. Lo que el consultante registró como ocurrido es un hecho consumado, no un pronóstico: no vuelvas a predecirlo, tómalo como punto de partida.\n' +
  'H4. Si el Juez de hoy apunta distinto que el de una tirada anterior, señálalo: en un asunto que se sigue en el tiempo eso es información, no un error. Explica qué cambió.\n' +
  'H5. Si la pregunta de hoy es la misma que ya se hizo y nada cambió en las circunstancias, dilo: repetir la pregunta al oráculo no mejora la respuesta.\n' +
  'H6. Si la pregunta de hoy ya no tiene relación con el asunto del hilo, dilo y juzga solo lo de hoy.\n';

// El proxy rechaza prompts de más de 20000 caracteres; se deja margen.
const TOPE_PROMPT = 18000;
const TOPE_VEREDICTO_PREVIO = 700;
const MAX_PASOS_CON_VEREDICTO = 6;

/* Corta un texto largo por el salto de línea más cercano, para no partir una
   frase al medio. Deja constancia del recorte: el modelo no debe creer que ese
   es el veredicto completo. */
function recortar(texto, tope) {
  if (typeof texto !== 'string') return '';
  const limpio = texto.trim();
  if (limpio.length <= tope) return limpio;
  const corte = limpio.lastIndexOf('\n', tope);
  const fin = corte > tope * 0.6 ? corte : tope;
  return limpio.slice(0, fin).trim() + '\n… (recortado por extensión)';
}

function fechaCortaDeIso(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (err) {
    return String(iso);
  }
}

/* La sección "## Respuesta directa" de una lectura guardada: el veredicto en
   palabras corrientes. Es el resumen ideal de un paso anterior porque la regla 6
   obliga a que esa sección NO nombre ninguna figura — así el historial no mete
   nombres que puedan confundirse con el escudo de hoy.

   Las lecturas viejas, anteriores a esa regla, no la tienen: ahí se recorta el
   principio como aproximación. */
function respuestaDirectaDe(interpretacion) {
  const texto = (interpretacion || '').trim();
  const marca = '## Respuesta directa';
  const inicio = texto.indexOf(marca);
  if (inicio === -1) return recortar(texto, TOPE_VEREDICTO_PREVIO);

  const resto = texto.slice(inicio + marca.length);
  const fin = resto.indexOf('\n## ');
  return recortar((fin === -1 ? resto : resto.slice(0, fin)).trim(), TOPE_VEREDICTO_PREVIO);
}

/* Las consultas anteriores del asunto, de la más vieja a la más nueva.
   `conVeredicto` dice cuántas de las más recientes llevan el veredicto; las
   anteriores quedan con fecha, pregunta y Juez, que es lo que sostiene el hilo
   sin gastar el presupuesto de caracteres. */
function bloqueDeHilo(pasos, conVeredicto) {
  const desde = Math.max(0, pasos.length - conVeredicto);

  const entradas = pasos.map(function (paso, i) {
    const lineas = [
      '[' + (i + 1) + '] ' + fechaCortaDeIso(paso.creada_en) + ' — Pregunta: «' + paso.pregunta + '»',
      '    Juez de aquella tirada: ' + figuraPorPuntos(paso.juez).nombre,
    ];
    if (i >= desde) {
      lineas.push('    Veredicto que se dio: ' + respuestaDirectaDe(paso.interpretacion).replace(/\n/g, '\n    '));
      const ocurrio = (paso.resultado_real || '').trim();
      lineas.push('    Qué ocurrió realmente (' + ETIQUETAS_ACIERTO[paso.acierto || 'sin_verificar'] + '): ' +
        (ocurrio || 'todavía sin registrar'));
    } else {
      lineas.push('    (veredicto omitido por extensión)');
    }
    return lineas.join('\n');
  });

  return '--- ANTES EN ESTE MISMO ASUNTO ---\n' +
    'El escudo de arriba se levantó HOY, para la pregunta de hoy. Lo que sigue son consultas ' +
    'ANTERIORES sobre el mismo asunto, cada una con su propia tirada, que ya cumplieron.\n\n' +
    entradas.join('\n\n') + '\n\n';
}

/* ==========================================================================
   PRE-CONSULTA: REVISIÓN DE LA PREGUNTA

   La geomancia responde bien a ciertas preguntas y mal a otras. Antes de
   levantar el escudo se le puede pedir al modelo que juzgue si la pregunta
   está bien planteada, la reformule si conviene, y sugiera a qué casa
   corresponde el asunto.
   ========================================================================== */

function construirPromptRevision(pregunta) {
  const temas = TEMAS.map(function (t) {
    return '- ' + t.id + ': ' + t.etiqueta + (t.casa ? ' (casa ' + t.casa + ')' : ' (sin casa: solo el Juez)');
  }).join('\n');

  return 'Eres un geomante hermético clásico ayudando a formular bien una consulta ANTES de levantar el escudo.\n\n' +
    'La geomancia occidental responde BIEN a preguntas concretas sobre asuntos externos y verificables: ' +
    'si algo resultará, si conviene hacer algo, hacia dónde se inclina un asunto, cómo se presenta una gestión, dónde está algo perdido.\n\n' +
    'Responde MAL a: preguntas abiertas sin objeto ("qué me depara la vida"), pedidos de fecha o plazo exacto ' +
    '(este sistema no calcula tiempos), preguntas sobre lo que otro piensa o siente por dentro, dilemas puramente morales, ' +
    'preguntas de sí/no sin un asunto concreto detrás, y varias preguntas mezcladas en una sola.\n\n' +
    'Temas disponibles, con su casa:\n' + temas + '\n\n' +
    'Pregunta del consultante:\n"""\n' + pregunta + '\n"""\n\n' +
    'Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto alrededor y sin bloques de código, con esta forma:\n' +
    '{\n' +
    '  "apta": true o false,\n' +
    '  "motivo": "una o dos frases explicando por qué sirve tal cual, o qué la vuelve difícil de juzgar",\n' +
    '  "reformulada": "la pregunta reescrita para que la geomancia pueda juzgarla, conservando la intención real del consultante; null si ya está bien",\n' +
    '  "tema_id": "el id del tema que mejor corresponde, de la lista de arriba",\n' +
    '  "motivo_tema": "una frase de por qué esa casa"\n' +
    '}\n\n' +
    'Si la pregunta pide una fecha o un plazo, marca apta como false y reformúlala hacia la tendencia o la condición del asunto.\n' +
    'La reformulación mantiene lo que la persona realmente quiere saber: no la conviertas en otra consulta.\n' +
    'Escribe en español.';
}

/* Los modelos suelen envolver el JSON en ```json … ``` o agregar texto antes.
   Se extrae el primer objeto equilibrado en vez de confiar en el formato. */
function extraerJson(texto) {
  if (typeof texto !== 'string') return null;
  const sinCercas = texto.replace(/```(?:json)?/gi, '');
  const inicio = sinCercas.indexOf('{');
  if (inicio === -1) return null;

  let profundidad = 0;
  let enCadena = false;
  let escapado = false;

  for (let i = inicio; i < sinCercas.length; i++) {
    const c = sinCercas[i];
    if (enCadena) {
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') enCadena = false;
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === '{') profundidad++;
    else if (c === '}') {
      profundidad--;
      if (profundidad === 0) {
        try {
          return JSON.parse(sinCercas.slice(inicio, i + 1));
        } catch (err) {
          return null;
        }
      }
    }
  }
  return null;
}

/* Normaliza lo que devuelve el modelo: nunca se confía en que respete el
   schema. Un tema inventado o una reformulación vacía no deben romper la UI. */
function normalizarRevision(crudo) {
  if (!crudo || typeof crudo !== 'object') return null;

  const tema = TEMAS.find(function (t) { return t.id === crudo.tema_id; }) || null;
  const reformulada = typeof crudo.reformulada === 'string' ? crudo.reformulada.trim() : '';

  return {
    apta: crudo.apta === true,
    motivo: typeof crudo.motivo === 'string' ? crudo.motivo.trim() : '',
    reformulada: reformulada || null,
    tema: tema,
    motivoTema: typeof crudo.motivo_tema === 'string' ? crudo.motivo_tema.trim() : '',
  };
}

async function revisarPregunta(pregunta) {
  const texto = await llamarGemini(construirPromptRevision(pregunta));
  const revision = normalizarRevision(extraerJson(texto));
  if (!revision) throw new Error('El oráculo no devolvió una revisión legible.');
  return revision;
}

const TIMEOUT_GEMINI_MS = 20000;

/* Pide la interpretación al proxy del servidor, donde vive la clave de Gemini.
   Devuelve null si el proxy no está desplegado, para poder seguir con la clave
   propia del navegador. */
async function llamarProxyInterpretacion(prompt) {
  const cliente = iniciarSupabase();
  if (!cliente || !usuarioActual) return null;

  const { url } = configSupabase();
  let sesion;
  try {
    const res = await cliente.auth.getSession();
    sesion = res && res.data && res.data.session;
  } catch (err) {
    return null;
  }
  if (!sesion || !sesion.access_token) return null;

  let respuesta;
  try {
    respuesta = await fetch(url.replace(/\/$/, '') + '/functions/v1/interpretar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sesion.access_token,
      },
      body: JSON.stringify({ prompt: prompt }),
    });
  } catch (err) {
    // Sin red o función inalcanzable: que decida el camino con clave propia.
    console.warn('No se pudo contactar el proxy de interpretación:', err);
    return null;
  }

  // La función no existe todavía: se sigue con la clave del navegador.
  if (respuesta.status === 404) return null;

  const datos = await respuesta.json().catch(function () { return {}; });

  if (!respuesta.ok) {
    // El límite diario y la sesión vencida son respuestas legítimas del proxy:
    // no se enmascaran cayendo a la clave propia.
    if (respuesta.status === 429 || respuesta.status === 401) {
      throw new Error(datos.error || 'El proxy rechazó la consulta.');
    }
    throw new Error(datos.error || ('El proxy respondió con estado ' + respuesta.status + '.'));
  }

  if (!datos.texto || !datos.texto.trim()) {
    throw new Error('El proxy devolvió una interpretación vacía.');
  }
  return datos.texto;
}

async function llamarGemini(prompt) {
  // Primero el proxy: así la clave no viaja al navegador.
  const porProxy = await llamarProxyInterpretacion(prompt);
  if (porProxy) return porProxy;

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
   que NO están en la tirada (lista vacía = texto válido).

   `escudosPrevios` son los de las consultas anteriores del hilo, y es una
   relajación deliberada: al seguir un asunto se le PIDE al modelo (regla H2)
   que nombre el Juez de una tirada anterior para compararlo con el de hoy. Sin
   esto el validador lo tomaría por alucinación, gastaría los tres intentos y la
   consulta terminaría sin lectura. Lo que sigue siendo estricto es lo que
   importa: una figura que no está ni en la tirada de hoy ni en ninguna del hilo
   se rechaza igual que siempre. */
function figurasAlucinadas(texto, escudo, escudosPrevios) {
  const presentes = new Set();

  const agregar = function (e) {
    e.madres.concat(
      e.hijas,
      e.sobrinas,
      [e.testigoDerecho, e.testigoIzquierdo, e.juez, e.reconciliador]
    ).forEach(function (p) { presentes.add(figuraPorPuntos(p).nombre); });
  };

  agregar(escudo);
  (escudosPrevios || []).forEach(agregar);

  return FIGURAS
    .filter(function (f) {
      if (presentes.has(f.nombre)) return false;
      return new RegExp('\\b' + f.nombre + '\\b').test(texto);
    })
    .map(function (f) { return f.nombre; });
}

/* Heurística: para cada mención de una posición ("Casa 7", "Juez", "Testigo
   Derecho"…) en la sección "## La lectura", mira las ~180 letras siguientes
   y comprueba que la primera figura que se nombra ahí sea la que le
   corresponde a esa posición según el escudo de HOY. Se restringe a esa
   sección — y solo al escudo de hoy — a propósito: la sección "Respuesta
   directa" no nombra figuras por regla, y mezclar el hilo daría falsos
   positivos con las menciones a tiradas anteriores. Es aviso, no bloqueo. */
function revisarAsignaciones(texto, posiciones) {
  const avisos = [];
  const mapa = {};
  posiciones.forEach(function (p) { mapa[p[0]] = figuraPorPuntos(p[1]).nombre; });

  const marca = '## La lectura';
  const inicio = texto.indexOf(marca);
  const textoLectura = inicio === -1 ? texto : texto.slice(inicio);

  Object.keys(mapa).forEach(function (etiqueta) {
    const re = new RegExp(etiqueta + '([\\s\\S]{0,180})', 'g');
    let m;
    while ((m = re.exec(textoLectura)) !== null) {
      const ventana = m[1];
      let primera = null;
      let posMin = Infinity;
      FIGURAS.forEach(function (f) {
        const idx = ventana.indexOf(f.nombre);
        if (idx !== -1 && idx < posMin) { posMin = idx; primera = f.nombre; }
      });
      if (primera && primera !== mapa[etiqueta]) {
        avisos.push(etiqueta + ' es ' + mapa[etiqueta] + ', pero el texto lo asocia a ' + primera + '.');
      }
    }
  });

  return Array.from(new Set(avisos));
}

/* Avisos que NO bloquean ni disparan reintento (a diferencia de
   figurasAlucinadas, que sí lo hace): asignaciones cruzadas por posición, y
   figuras del hilo mencionadas sin aclarar que son de una tirada anterior
   (la regla H2 pide nombrarlas SOLO si se aclara). */
function avisosDeInterpretacion(texto, escudo, escudosPrevios, posiciones) {
  const avisos = [];

  const presentesHoy = new Set();
  posiciones.forEach(function (p) { presentesHoy.add(figuraPorPuntos(p[1]).nombre); });

  const presentesEnHilo = new Set();
  (escudosPrevios || []).forEach(function (e) {
    e.madres.concat(e.hijas, e.sobrinas,
      [e.testigoDerecho, e.testigoIzquierdo, e.juez, e.reconciliador])
      .forEach(function (p) {
        const nombre = figuraPorPuntos(p).nombre;
        if (!presentesHoy.has(nombre)) presentesEnHilo.add(nombre);
      });
  });

  const marcaDeHilo = /aquella tirada|tirada anterior|consulta anterior|en esa consulta|en aquel momento/i;
  presentesEnHilo.forEach(function (nombre) {
    const re = new RegExp('\\b' + nombre + '\\b', 'g');
    let m;
    let avisado = false;
    while (!avisado && (m = re.exec(texto)) !== null) {
      const ventana = texto.slice(Math.max(0, m.index - 80), m.index + 80);
      if (!marcaDeHilo.test(ventana)) {
        avisos.push(nombre + ' se menciona sin aclarar que es de una tirada anterior.');
        avisado = true;
      }
    }
  });

  return avisos.concat(revisarAsignaciones(texto, posiciones));
}

const MAX_INTENTOS_INTERPRETACION = 3; // 1 intento + 2 reintentos

/* Animación de espera: en vez de un texto fijo, se dibuja una figura geomántica
   que va mutando entre las 16, como si el oráculo estuviera tanteando. */
let animacionOraculo = null;

function arrancarAnimacionOraculo() {
  const cont = document.getElementById('figura-cargando');
  if (!cont) return;
  detenerAnimacionOraculo();

  const filas = [];
  cont.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const fila = document.createElement('div');
    fila.className = 'figura-linea';
    cont.appendChild(fila);
    filas.push(fila);
  }

  const pintar = function (puntos) {
    puntos.forEach(function (n, i) {
      const fila = filas[i];
      fila.innerHTML = '';
      for (let p = 0; p < n; p++) {
        const punto = document.createElement('span');
        punto.className = 'punto';
        fila.appendChild(punto);
      }
    });
  };

  let indice = Math.floor(Math.random() * FIGURAS.length);
  pintar(FIGURAS[indice].puntos);
  animacionOraculo = setInterval(function () {
    indice = (indice + 1 + Math.floor(Math.random() * 5)) % FIGURAS.length;
    pintar(FIGURAS[indice].puntos);
  }, 420);
}

function detenerAnimacionOraculo() {
  if (animacionOraculo) {
    clearInterval(animacionOraculo);
    animacionOraculo = null;
  }
}

function mostrarCargando(mostrar, mensaje) {
  const bloque = document.getElementById('interpretacion-cargando');
  const texto = document.getElementById('texto-cargando');
  if (!bloque) return;
  bloque.hidden = !mostrar;
  if (mostrar) {
    if (texto && mensaje) texto.textContent = mensaje;
    arrancarAnimacionOraculo();
  } else {
    detenerAnimacionOraculo();
  }
}

/* Ofrece guardar la lectura si hay sesión e interpretación válida. */
function actualizarOfertaDeGuardado() {
  const bloque = document.getElementById('bloque-guardado');
  const boton = document.getElementById('btn-guardar-bitacora');
  const aviso = document.getElementById('aviso-guardado');
  if (!bloque || !boton) return;

  const puede = !!(usuarioActual && estado.interpretacion);
  bloque.hidden = !puede;
  if (!puede) return;

  if (estado.idConsultaGuardada) {
    boton.textContent = 'Quitar de mi bitácora';
    boton.classList.add('btn-quitar');
    if (aviso) { aviso.textContent = 'Guardado en tu bitácora.'; aviso.hidden = false; }
  } else {
    boton.textContent = 'Guardar en mi bitácora';
    boton.classList.remove('btn-quitar');
    if (aviso) aviso.hidden = true;
  }
  boton.disabled = false;
}

async function alternarGuardadoDeConsulta() {
  const boton = document.getElementById('btn-guardar-bitacora');
  const aviso = document.getElementById('aviso-guardado');
  boton.disabled = true;

  try {
    if (estado.idConsultaGuardada) {
      await borrarConsulta(estado.idConsultaGuardada);
      estado.idConsultaGuardada = null;
    } else {
      const id = await guardarConsultaEnBitacora();
      if (!id) throw new Error('No se pudo guardar.');
      estado.idConsultaGuardada = id;
    }
    actualizarOfertaDeGuardado();
  } catch (err) {
    console.error('Fallo al guardar o quitar la consulta:', err);
    if (aviso) {
      aviso.textContent = 'No se pudo completar: ' + err.message;
      aviso.hidden = false;
    }
    boton.disabled = false;
  }
}

async function solicitarInterpretacion() {
  const estadoEl = document.getElementById('interpretacion-estado');
  const textoEl = document.getElementById('interpretacion-texto');
  const reintentarBtn = document.getElementById('btn-reintentar');

  estadoEl.hidden = true;
  textoEl.innerHTML = '';
  reintentarBtn.hidden = true;
  estado.interpretacion = '';
  estado.idConsultaGuardada = null;
  actualizarOfertaDeGuardado();

  const promptBase = construirPrompt();
  // Al seguir un asunto, el modelo puede nombrar el Juez de una tirada anterior:
  // se le pide en la regla H2. Esos escudos también cuentan como válidos.
  const escudosPrevios = estado.hilo
    ? estado.hilo.consultas.map(escudoDeConsulta)
    : [];
  let notaCorrectiva = '';
  let ultimoError = null;

  for (let intento = 1; intento <= MAX_INTENTOS_INTERPRETACION; intento++) {
    mostrarCargando(true, intento === 1
      ? 'Consultando al oráculo…'
      : 'Reintentando (intento ' + intento + ' de ' + MAX_INTENTOS_INTERPRETACION + ')…');
    try {
      const texto = (await llamarGemini(promptBase + notaCorrectiva)).trim();
      if (!texto) {
        throw new Error('El modelo devolvió una interpretación vacía.');
      }
      const alucinadas = figurasAlucinadas(texto, estado.escudo, escudosPrevios);
      if (alucinadas.length) {
        notaCorrectiva = '\n\nATENCIÓN: en un intento anterior mencionaste figuras que NO están en esta tirada: ' +
          alucinadas.join(', ') + '. No las nombres. Usa solo las figuras listadas en los datos de arriba.';
        throw new Error('La interpretación menciona figuras que no están en el escudo: ' + alucinadas.join(', '));
      }
      // Avisos: no bloquean ni reintentan. Van a Sentry como evento informativo
      // (no una excepción) para medir con qué frecuencia dispara
      // revisarAsignaciones antes de decidir si hace falta UI para esto.
      const avisos = avisosDeInterpretacion(texto, estado.escudo, escudosPrevios,
        posicionesDeEscudo(estado.escudo, estado.escudo.casas));
      if (avisos.length) {
        console.warn('Avisos de la interpretación (no bloquean):', avisos);
        reportarAviso('Avisos en la interpretación (' + avisos.length + ')', {
          // Todavía sin guardar en este punto del flujo: el id llega null salvo
          // que sea un reintento sobre una consulta ya guardada.
          id_consulta: estado.idConsultaGuardada,
          hubo_hilo: !!estado.hilo,
          cantidad: avisos.length,
          avisos: avisos,
        });
      }

      estado.interpretacion = texto;
      mostrarCargando(false);
      estadoEl.hidden = true;
      textoEl.innerHTML = renderizarMarkdownBasico(texto);
      // El guardado es decisión del consultante: se ofrece, no se hace solo.
      actualizarOfertaDeGuardado();
      return;
    } catch (err) {
      console.error('Intento ' + intento + ' de interpretación fallido:', err);
      ultimoError = err;
    }
  }

  // Todos los intentos fallaron: NO se genera lectura de respaldo. Se muestra el
  // error y se deja reintentar. La interpretación queda vacía y no se exporta como válida.
  reportarError(ultimoError || new Error('Sin interpretación tras todos los intentos'),
    'interpretacion', {
      intentos: MAX_INTENTOS_INTERPRETACION,
      hubo_sesion: !!usuarioActual,
      hubo_clave_propia: !!getApiKey(),
    });

  estado.interpretacion = '';
  mostrarCargando(false);
  actualizarOfertaDeGuardado();
  estadoEl.hidden = false;
  estadoEl.textContent = 'No se pudo obtener la interpretación del oráculo tras ' +
    MAX_INTENTOS_INTERPRETACION + ' intentos. Revisá tu conexión o tu clave y reintentá.' +
    (ultimoError ? ' Último error: ' + ultimoError.message : '');
  textoEl.innerHTML = '';
  reintentarBtn.hidden = false;
}

/* Marcas dentro de una línea: negritas, cursivas y código. Las negritas se
   resuelven antes que las cursivas para que ** no se confunda con *. */
function renderizarInline(texto) {
  return texto
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/* Renderiza el Markdown que devuelve el modelo. Antes solo entendía negritas,
   así que los títulos (###) y las reglas (---) salían literales en pantalla. */
function renderizarMarkdownBasico(texto) {
  const escapado = String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const salida = [];
  let listaAbierta = null;   // 'ul' | 'ol' | null
  let parrafo = [];

  function cerrarParrafo() {
    if (!parrafo.length) return;
    salida.push('<p>' + renderizarInline(parrafo.join('<br>')) + '</p>');
    parrafo = [];
  }
  function cerrarLista() {
    if (!listaAbierta) return;
    salida.push('</' + listaAbierta + '>');
    listaAbierta = null;
  }
  function abrirLista(tipo) {
    if (listaAbierta === tipo) return;
    cerrarLista();
    salida.push('<' + tipo + '>');
    listaAbierta = tipo;
  }

  escapado.split('\n').forEach(function (crudo) {
    const linea = crudo.trim();

    if (!linea) {
      cerrarParrafo();
      cerrarLista();
      return;
    }

    // Regla horizontal: --- *** ___
    if (/^([-*_])\1{2,}$/.test(linea)) {
      cerrarParrafo();
      cerrarLista();
      salida.push('<hr>');
      return;
    }

    // Títulos: # a ######. Se mapean a h4/h5 para no competir con los de la app.
    const titulo = linea.match(/^(#{1,6})\s+(.*)$/);
    if (titulo) {
      cerrarParrafo();
      cerrarLista();
      const nivel = titulo[1].length <= 3 ? 4 : 5;
      salida.push('<h' + nivel + '>' + renderizarInline(titulo[2]) + '</h' + nivel + '>');
      return;
    }

    // Cita
    const cita = linea.match(/^&gt;\s?(.*)$/);
    if (cita) {
      cerrarParrafo();
      cerrarLista();
      salida.push('<blockquote>' + renderizarInline(cita[1]) + '</blockquote>');
      return;
    }

    // Lista con viñetas: "- algo" o "* algo" (no confundir con *cursiva*)
    const vineta = linea.match(/^[-*+]\s+(.*)$/);
    if (vineta) {
      cerrarParrafo();
      abrirLista('ul');
      salida.push('<li>' + renderizarInline(vineta[1]) + '</li>');
      return;
    }

    // Lista numerada: "1. algo"
    const numerada = linea.match(/^\d+[.)]\s+(.*)$/);
    if (numerada) {
      cerrarParrafo();
      abrirLista('ol');
      salida.push('<li>' + renderizarInline(numerada[1]) + '</li>');
      return;
    }

    cerrarLista();
    parrafo.push(linea);
  });

  cerrarParrafo();
  cerrarLista();
  return salida.join('');
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
  // Se reutiliza el mismo renderizador que la pantalla, para que lo copiado
  // salga con el formato que se ve (títulos incluidos).
  return renderizarMarkdownBasico(md);
}

function markdownATextoPlano(md) {
  return md
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, '')      // reglas horizontales
    .replace(/^#{1,6}\s*/gm, '')                   // títulos
    .replace(/^>\s*/gm, '')                        // citas
    .replace(/^[-*+] /gm, '• ')                    // viñetas
    .replace(/\*\*(.+?)\*\*/g, '$1')              // negritas
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1$2')  // cursivas
    .replace(/`([^`]+)`/g, '$1');                  // código
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

/* Filtro y orden elegidos. Viven en memoria a propósito: la app no guarda
   estado de lectura en localStorage. */
let filtroTemaBitacora = '';
let ordenBitacora = 'recientes';

const ORDEN_ACIERTO = ['acerto', 'parcial', 'fallo', 'sin_verificar'];

/* Arma los hilos a partir de la lista plana: cada tirada original con sus
   seguimientos colgando. Una sola pasada, y si la tirada madre quedó fuera de
   las 200 filas leídas, el seguimiento se muestra igual como si fuera raíz —
   antes que desaparecer de la bitácora. */
function agruparEnHilos(consultas) {
  const nodos = {};
  consultas.forEach(function (c) {
    nodos[c.id] = { raiz: c, seguimientos: [], ultimaActividad: c.creada_en };
  });

  const hilos = [];
  consultas.forEach(function (c) {
    const padre = c.origen_id ? nodos[c.origen_id] : null;
    if (padre) padre.seguimientos.push(c);
    else hilos.push(nodos[c.id]);
  });

  hilos.forEach(function (h) {
    // Dentro del hilo se lee como una conversación: del más viejo al más nuevo.
    h.seguimientos.sort(function (a, b) {
      return new Date(a.creada_en) - new Date(b.creada_en);
    });
    h.ultimaActividad = h.seguimientos.length
      ? h.seguimientos[h.seguimientos.length - 1].creada_en
      : h.raiz.creada_en;
  });

  return hilos;
}

/* Ordena por la última actividad del hilo, no por la fecha de la tirada: una
   consulta vieja que acabás de repreguntar vuelve arriba, que es donde la
   estás buscando. */
function ordenarHilos(hilos, orden) {
  const copia = hilos.slice();
  if (orden === 'antiguas') {
    return copia.sort(function (a, b) {
      return new Date(a.ultimaActividad) - new Date(b.ultimaActividad);
    });
  }
  if (orden === 'acierto') {
    return copia.sort(function (a, b) {
      const ra = ORDEN_ACIERTO.indexOf(a.raiz.acierto || 'sin_verificar');
      const rb = ORDEN_ACIERTO.indexOf(b.raiz.acierto || 'sin_verificar');
      if (ra !== rb) return ra - rb;
      return new Date(b.ultimaActividad) - new Date(a.ultimaActividad);
    });
  }
  return copia.sort(function (a, b) {
    return new Date(b.ultimaActividad) - new Date(a.ultimaActividad);
  });
}

async function abrirBitacora() {
  mostrarPantalla('pantalla-bitacora');
  const estadoEl = document.getElementById('estado-bitacora');
  const listaEl = document.getElementById('lista-bitacora');
  estadoEl.hidden = false;
  estadoEl.textContent = 'Cargando…';
  listaEl.innerHTML = '';

  ocultar('bloque-exportar');
  ocultar('controles-bitacora');

  let consultas;
  try {
    consultas = await listarConsultas();
  } catch (err) {
    estadoEl.textContent = 'No se pudo cargar la bitácora: ' + err.message;
    return;
  }

  consultasCargadas = consultas;
  renderizarBitacora();
}

/* Repinta la lista con el filtro y el orden vigentes, sin volver a pedir nada:
   con 200 filas como techo, filtrar y ordenar en el navegador alcanza. */
function renderizarBitacora() {
  const estadoEl = document.getElementById('estado-bitacora');
  const listaEl = document.getElementById('lista-bitacora');
  const controles = document.getElementById('controles-bitacora');
  const bloqueExportar = document.getElementById('bloque-exportar');

  const verSi = function (el, visible) { if (el) el.hidden = !visible; };

  listaEl.innerHTML = '';
  estadoEl.hidden = false;

  if (!consultasCargadas.length) {
    estadoEl.textContent = 'Todavía no hay consultas guardadas.';
    verSi(controles, false);
    verSi(bloqueExportar, false);
    return;
  }

  verSi(controles, true);
  verSi(bloqueExportar, true);

  const hilos = agruparEnHilos(consultasCargadas);
  // El filtro mira siempre la tirada original: filtrar fila por fila dejaría
  // seguimientos sueltos sin su madre.
  const visibles = filtroTemaBitacora
    ? hilos.filter(function (h) { return h.raiz.tema_id === filtroTemaBitacora; })
    : hilos;

  if (!visibles.length) {
    estadoEl.textContent = 'Ninguna consulta de ese tema.';
    return;
  }

  estadoEl.textContent = resumenDeBitacora(hilos, visibles);

  const ordenados = ordenarHilos(visibles, ordenBitacora);
  let grupoActual = null;

  ordenados.forEach(function (h) {
    if (ordenBitacora === 'acierto') {
      const acierto = h.raiz.acierto || 'sin_verificar';
      if (acierto !== grupoActual) {
        grupoActual = acierto;
        const titulo = document.createElement('h3');
        titulo.className = 'grupo-bitacora';
        titulo.textContent = ETIQUETAS_ACIERTO[acierto];
        listaEl.appendChild(titulo);
      }
    }
    listaEl.appendChild(crearTarjetaBitacora(h.raiz, h.seguimientos));
  });
}

/* Una línea con el estado de la bitácora: cuántas tiradas hay, cuántas
   repreguntas, y cómo viene el acierto. */
function resumenDeBitacora(hilos, visibles) {
  const mostrados = visibles || hilos;
  const seguimientos = mostrados.reduce(function (n, h) { return n + h.seguimientos.length; }, 0);

  let base = mostrados.length + (mostrados.length === 1 ? ' tirada' : ' tiradas');
  if (mostrados.length !== hilos.length) base += ' de ' + hilos.length;
  if (seguimientos) {
    base += ' · ' + seguimientos + (seguimientos === 1 ? ' seguimiento' : ' seguimientos');
  }

  const raices = mostrados.map(function (h) { return h.raiz; });
  const verificadas = raices.filter(function (c) { return c.acierto && c.acierto !== 'sin_verificar'; });
  if (!verificadas.length) {
    return base + ' · ninguna verificada todavía';
  }
  const aciertos = verificadas.filter(function (c) { return c.acierto === 'acerto'; }).length;
  const parciales = verificadas.filter(function (c) { return c.acierto === 'parcial'; }).length;
  return base + ' · ' + verificadas.length + ' verificadas · ' +
    aciertos + ' acertó, ' + parciales + ' parcial, ' +
    (verificadas.length - aciertos - parciales) + ' falló';
}

function poblarFiltroTemas() {
  const select = document.getElementById('filtro-tema');
  if (!select) return;
  select.innerHTML = '';

  const todos = document.createElement('option');
  todos.value = '';
  todos.textContent = 'Todos los temas';
  select.appendChild(todos);

  TEMAS.forEach(function (t) {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.etiqueta;
    select.appendChild(opt);
  });
}

/* `cuantos` son las consultas que siguieron; el hilo las cuenta con la raíz. */
function textoDeSeguimientos(cuantos) {
  if (!cuantos) return '';
  return ' · hilo de ' + (cuantos + 1) + ' consultas';
}

function crearTarjetaBitacora(consulta, seguimientos) {
  const hilo = seguimientos || [];
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
    fechaLegible(consulta.creada_en) + ' · Juez: ' + juez.nombre + textoDeSeguimientos(hilo.length);
  resumen.querySelector('.marca-acierto').textContent = ETIQUETAS_ACIERTO[acierto];
  item.appendChild(resumen);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'entrada-cuerpo';

  const meta = document.createElement('p');
  meta.className = 'entrada-tema';
  meta.textContent = 'Tema: ' + consulta.tema_etiqueta +
    (consulta.casa_tema ? ' (casa ' + consulta.casa_tema + ')' : '');
  cuerpo.appendChild(meta);

  cuerpo.appendChild(crearBotonSeguirAsunto(consulta));

  const interp = document.createElement('div');
  interp.className = 'interpretacion-texto';
  interp.innerHTML = renderizarMarkdownBasico(consulta.interpretacion);
  cuerpo.appendChild(interp);

  cuerpo.appendChild(crearEscudoDeConsulta(consulta));
  cuerpo.appendChild(crearFormularioVerificacion(consulta));

  // Las consultas siguientes del asunto, de la más vieja a la más nueva.
  if (hilo.length) {
    const contenedorHilo = document.createElement('div');
    contenedorHilo.className = 'hilo';

    const titulo = document.createElement('h4');
    titulo.className = 'titulo-hilo';
    titulo.textContent = 'Después, en este mismo asunto';
    contenedorHilo.appendChild(titulo);

    hilo.forEach(function (s) {
      crearTarjetaSeguimiento(s, contenedorHilo);
    });
    cuerpo.appendChild(contenedorHilo);
  }

  cuerpo.appendChild(crearBorradoDeEntrada(consulta, item));
  item.appendChild(cuerpo);
  return item;
}

/* Tarjeta de un paso del hilo. Clase distinta de la tarjeta raíz a propósito:
   anidar `.entrada-bitacora` dentro de sí misma rompería los selectores de la
   lista. Lleva su propio escudo, porque cada paso es una tirada de verdad. */
function crearTarjetaSeguimiento(consulta, contenedorHilo) {
  const juez = figuraPorPuntos(consulta.juez);
  const item = document.createElement('details');
  item.className = 'entrada-hilo';

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

  cuerpo.appendChild(crearBotonSeguirAsunto(consulta));

  const interp = document.createElement('div');
  interp.className = 'interpretacion-texto';
  interp.innerHTML = renderizarMarkdownBasico(consulta.interpretacion);
  cuerpo.appendChild(interp);

  cuerpo.appendChild(crearEscudoDeConsulta(consulta));
  cuerpo.appendChild(crearFormularioVerificacion(consulta));
  cuerpo.appendChild(crearBorradoDeEntrada(consulta, item));
  item.appendChild(cuerpo);

  if (contenedorHilo) contenedorHilo.appendChild(item);
  return item;
}

/* Las consultas del asunto al que pertenece una fila, de la más vieja a la más
   nueva, empezando por la raíz. */
function pasosDelHilo(consulta) {
  const raizId = consulta.origen_id || consulta.id;
  const pasos = consultasCargadas
    .filter(function (c) { return c.id === raizId || c.origen_id === raizId; })
    .sort(function (a, b) { return new Date(a.creada_en) - new Date(b.creada_en); });

  // Estos escudos vienen de Supabase, no de un calcularEscudo() recién
  // corrido: a diferencia de la consulta en vivo, sí pueden estar
  // desalineados (fila corrupta, migración vieja). No bloquea el hilo —
  // solo lo deja anotado, igual que el resto de los fallos de datos de la app.
  pasos.forEach(function (paso) {
    const problemas = verificarEscudo(escudoDeConsulta(paso));
    if (problemas.length) {
      console.warn('El escudo de la consulta ' + paso.id + ' no cuadra matemáticamente:', problemas);
      reportarError(new Error('Escudo inconsistente en un paso del hilo'), 'hilo.verificarEscudo',
        { id: paso.id, problemas: problemas });
    }
  });

  return pasos;
}

/* Seguir un asunto abre el flujo normal de consulta con el hilo cargado: se
   traza un escudo nuevo, pero la interpretación se pide sabiendo lo anterior.
   Va arriba del cuerpo de la tarjeta y no al final: enterrado bajo el escudo y
   la verificación, nadie lo encontraba. */
function crearBotonSeguirAsunto(consulta) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-secundario btn-seguir-asunto';
  boton.textContent = 'Seguir este asunto';

  boton.addEventListener('click', function () {
    const pasos = pasosDelHilo(consulta);
    estado.hilo = {
      raizId: consulta.origen_id || consulta.id,
      consultas: pasos,
    };
    estado.tema = TEMAS.find(function (t) { return t.id === consulta.tema_id; }) || estado.tema;

    const select = document.getElementById('select-tema');
    if (select) select.value = estado.tema.id;

    // La pregunta anterior no se arrastra: la nueva es otra.
    // irAPantallaPregunta la limpia y ya refresca el cartel del hilo.
    estado.preguntaConsumida = true;
    irAPantallaPregunta();
  });

  return boton;
}

/* ==========================================================================
   RESPALDO: EXPORTAR LA BITÁCORA ENTERA
   ========================================================================== */

// Consultas de la última carga, para exportar sin volver a pedirlas.
let consultasCargadas = [];

function bitacoraAMarkdown(consultas) {
  const nombreDe = function (puntos) {
    const f = figuraPorPuntos(puntos);
    return f.nombre + ' (' + f.naturaleza.replace('-', ' ') + ')';
  };
  const hilos = agruparEnHilos(consultas);
  const cuantosSeguimientos = hilos.reduce(function (n, h) { return n + h.seguimientos.length; }, 0);

  const lineas = [];
  lineas.push('# Bitácora de geomancia');
  lineas.push('');
  lineas.push('**Exportada:** ' + new Date().toLocaleString('es-ES'));
  lineas.push('**Consultas:** ' + hilos.length + ' tiradas' +
    (cuantosSeguimientos ? ' · ' + cuantosSeguimientos + ' seguimientos' : ''));

  const verificadas = consultas.filter(function (c) { return c.acierto && c.acierto !== 'sin_verificar'; });
  if (verificadas.length) {
    const aciertos = verificadas.filter(function (c) { return c.acierto === 'acerto'; }).length;
    const parciales = verificadas.filter(function (c) { return c.acierto === 'parcial'; }).length;
    const fallos = verificadas.filter(function (c) { return c.acierto === 'fallo'; }).length;
    lineas.push('**Verificadas:** ' + verificadas.length +
      ' — acertó ' + aciertos + ', parcial ' + parciales + ', falló ' + fallos);
  }
  lineas.push('');

  /* Cada paso de un hilo es una tirada propia, así que se escribe con el mismo
     detalle que una consulta suelta. `titulo` distingue la raíz del seguimiento. */
  const escribirConsulta = function (c, titulo) {
    lineas.push(titulo);
    lineas.push('');
    lineas.push('**Fecha:** ' + fechaLegible(c.creada_en));
    lineas.push('**Tema:** ' + c.tema_etiqueta + (c.casa_tema ? ' (casa ' + c.casa_tema + ')' : ''));
    lineas.push('**Resultado registrado:** ' + (ETIQUETAS_ACIERTO[c.acierto || 'sin_verificar']));
    lineas.push('');

    lineas.push('### Madres');
    c.madres.forEach(function (m, n) { lineas.push('- Madre ' + (n + 1) + ': ' + nombreDe(m)); });
    lineas.push('');
    lineas.push('### Hijas');
    c.hijas.forEach(function (h, n) { lineas.push('- Hija ' + (n + 1) + ': ' + nombreDe(h)); });
    lineas.push('');
    lineas.push('### Escudo');
    c.sobrinas.forEach(function (s, n) { lineas.push('- Sobrina ' + (n + 1) + ': ' + nombreDe(s)); });
    lineas.push('- Testigo Derecho: ' + nombreDe(c.testigo_derecho));
    lineas.push('- Testigo Izquierdo: ' + nombreDe(c.testigo_izquierdo));
    lineas.push('- **Juez: ' + nombreDe(c.juez) + '**');
    lineas.push('- Reconciliador: ' + nombreDe(c.reconciliador));
    lineas.push('');
    lineas.push('### Carta de 12 casas');
    CASAS.forEach(function (casaInfo, idx) {
      const marca = casaInfo.numero === c.casa_tema ? ' ← **casa del tema**' : '';
      lineas.push('- Casa ' + casaInfo.numero + ' (' + casaInfo.significado + '): ' + nombreDe(c.casas[idx]) + marca);
    });
    lineas.push('');
    lineas.push('### Interpretación');
    lineas.push('');
    lineas.push(c.interpretacion || '(sin interpretación)');
    lineas.push('');
    lineas.push('### Qué ocurrió realmente');
    lineas.push('');
    lineas.push(c.resultado_real || '(sin verificar)');
    lineas.push('');
  };

  hilos.forEach(function (h, i) {
    lineas.push('---');
    lineas.push('');
    escribirConsulta(h.raiz, '## ' + (i + 1) + '. ' + h.raiz.pregunta);

    h.seguimientos.forEach(function (s, j) {
      escribirConsulta(s, '## ' + (i + 1) + '.' + (j + 1) +
        ' — Seguimiento de «' + h.raiz.pregunta + '»: ' + s.pregunta);
    });
  });

  return lineas.join('\n');
}

function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function sufijoDeFecha() {
  const d = new Date();
  const dos = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
}

function avisarExportacion(mensaje) {
  const aviso = document.getElementById('aviso-exportado');
  if (!aviso) return;
  aviso.textContent = mensaje;
  aviso.hidden = false;
  setTimeout(function () { aviso.hidden = true; }, 4000);
}

function exportarBitacoraMarkdown() {
  if (!consultasCargadas.length) return;
  descargarArchivo('bitacora-geomancia-' + sufijoDeFecha() + '.md',
    bitacoraAMarkdown(consultasCargadas), 'text/markdown;charset=utf-8');
  avisarExportacion('Markdown generado (' + consultasCargadas.length + ' consultas).');
}

function exportarBitacoraJson() {
  if (!consultasCargadas.length) return;
  const datos = {
    exportado_en: new Date().toISOString(),
    total: consultasCargadas.length,
    consultas: consultasCargadas,
  };
  descargarArchivo('bitacora-geomancia-' + sufijoDeFecha() + '.json',
    JSON.stringify(datos, null, 2), 'application/json;charset=utf-8');
  avisarExportacion('JSON generado (' + consultasCargadas.length + ' consultas).');
}

/* Redibuja el escudo y las 12 casas de una consulta guardada, para poder
   auditar contra qué figuras se escribió la interpretación. */
function crearEscudoDeConsulta(consulta) {
  const escudo = {
    madres: consulta.madres,
    hijas: consulta.hijas,
    sobrinas: consulta.sobrinas,
    testigoDerecho: consulta.testigo_derecho,
    testigoIzquierdo: consulta.testigo_izquierdo,
    juez: consulta.juez,
    reconciliador: consulta.reconciliador,
  };

  const envoltorio = document.createElement('div');

  const detEscudo = document.createElement('details');
  detEscudo.className = 'bloque-escudo';
  const resEscudo = document.createElement('summary');
  resEscudo.textContent = 'Escudo completo';
  detEscudo.appendChild(resEscudo);
  const contEscudo = document.createElement('div');
  detEscudo.appendChild(contEscudo);
  envoltorio.appendChild(detEscudo);

  const detCasas = document.createElement('details');
  detCasas.className = 'bloque-casas';
  const resCasas = document.createElement('summary');
  resCasas.textContent = 'Carta de casas';
  detCasas.appendChild(resCasas);
  const contCasas = document.createElement('div');
  contCasas.className = 'carta-casas';
  detCasas.appendChild(contCasas);
  envoltorio.appendChild(detCasas);

  // Se dibuja recién al abrir: con muchas entradas, pintarlas todas de entrada
  // haría lenta la bitácora.
  let escudoPintado = false;
  detEscudo.addEventListener('toggle', function () {
    if (detEscudo.open && !escudoPintado) {
      try {
        pintarEscudoEn(contEscudo, escudo);
        escudoPintado = true;
      } catch (err) {
        contEscudo.textContent = 'No se pudo dibujar el escudo guardado.';
        console.error('Escudo inválido en la consulta', consulta.id, err);
      }
    }
  });

  let casasPintadas = false;
  detCasas.addEventListener('toggle', function () {
    if (detCasas.open && !casasPintadas) {
      try {
        pintarCartaCasasEn(contCasas, consulta.casas, consulta.casa_tema);
        casasPintadas = true;
      } catch (err) {
        contCasas.textContent = 'No se pudo dibujar la carta de casas guardada.';
        console.error('Casas inválidas en la consulta', consulta.id, err);
      }
    }
  });

  return envoltorio;
}

/* Borrado de una entrada, con confirmación en dos pasos para no perder una
   lectura por un toque accidental en el celular. */
function crearBorradoDeEntrada(consulta, item) {
  const zona = document.createElement('div');
  zona.className = 'zona-borrado';

  // Se cuenta al momento de confirmar y no al crear la tarjeta: el hilo puede
  // haber crecido en esta misma visita, y el aviso tiene que decir la verdad.
  const seguimientosDeAhora = function () {
    return consultasCargadas.filter(function (c) { return c.origen_id === consulta.id; });
  };

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-enlace btn-enlace-peligro';
  boton.textContent = consulta.origen_id ? 'Eliminar este seguimiento' : 'Eliminar esta consulta';

  const confirmar = document.createElement('div');
  confirmar.className = 'confirmar-borrado';
  confirmar.hidden = true;

  const pregunta = document.createElement('p');
  pregunta.className = 'entrada-tema';
  confirmar.appendChild(pregunta);

  const fila = document.createElement('div');
  fila.className = 'fila-botones';

  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.className = 'btn btn-secundario';
  cancelar.textContent = 'Cancelar';
  cancelar.addEventListener('click', function () {
    confirmar.hidden = true;
    boton.hidden = false;
  });

  const eliminar = document.createElement('button');
  eliminar.type = 'button';
  eliminar.className = 'btn btn-secundario btn-quitar';
  eliminar.textContent = 'Sí, eliminar';
  eliminar.addEventListener('click', async function () {
    eliminar.disabled = true;
    eliminar.textContent = 'Eliminando…';
    try {
      await borrarConsulta(consulta.id);
      if (estado.idConsultaGuardada === consulta.id) {
        estado.idConsultaGuardada = null;
        actualizarOfertaDeGuardado();
      }
      // La base borra el hilo en cascada; acá hay que sacarlo de la copia local.
      consultasCargadas = consultasCargadas.filter(function (c) {
        return c.id !== consulta.id && c.origen_id !== consulta.id;
      });
      item.remove();
      if (!consultasCargadas.length) {
        const estadoEl = document.getElementById('estado-bitacora');
        estadoEl.textContent = 'Todavía no hay consultas guardadas.';
        estadoEl.hidden = false;
        ocultar('controles-bitacora');
        ocultar('bloque-exportar');
      }
    } catch (err) {
      console.error('No se pudo eliminar la consulta:', err);
      pregunta.textContent = 'No se pudo eliminar: ' + err.message;
      eliminar.disabled = false;
      eliminar.textContent = 'Sí, eliminar';
    }
  });

  fila.appendChild(cancelar);
  fila.appendChild(eliminar);
  confirmar.appendChild(fila);

  boton.addEventListener('click', function () {
    // Se avisa del arrastre: en la base el borrado de la madre es en cascada.
    const cuantos = seguimientosDeAhora().length;
    pregunta.textContent = cuantos
      ? '¿Eliminar esta consulta de tu bitácora? Se eliminarán también sus ' +
        cuantos + (cuantos === 1 ? ' seguimiento' : ' seguimientos') + '. No se puede deshacer.'
      : '¿Eliminar esta consulta de tu bitácora? No se puede deshacer.';
    boton.hidden = true;
    confirmar.hidden = false;
  });

  zona.appendChild(boton);
  zona.appendChild(confirmar);
  return zona;
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
      // La copia en memoria también, para que el orden por resultado y el
      // export reflejen esto sin recargar la bitácora.
      consulta.resultado_real = area.value.trim();
      consulta.acierto = seleccion.valor;
      aviso.textContent = 'Verificación guardada.';
      aviso.hidden = false;
      const marca = form.closest('.entrada-bitacora, .entrada-hilo').querySelector('.marca-acierto');
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

// Se llama cada vez que cambia el texto (al escribir o al limpiarlo a mano).
/* ==========================================================================
   UI DE LA REVISIÓN DE LA PREGUNTA
   ========================================================================== */

function ocultarPanelRevision() {
  const panel = document.getElementById('panel-revision');
  if (panel) {
    panel.hidden = true;
    panel.innerHTML = '';
  }
}

function crearBotonAplicar(texto, alAplicar) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-secundario';
  btn.textContent = texto;
  btn.addEventListener('click', function () {
    alAplicar();
    btn.disabled = true;
    btn.textContent = 'Aplicado ✓';
  });
  return btn;
}

function mostrarPanelRevision(revision) {
  const panel = document.getElementById('panel-revision');
  panel.innerHTML = '';
  panel.hidden = false;

  const titulo = document.createElement('p');
  titulo.className = 'revision-titulo ' + (revision.apta ? 'apta' : 'reformular');
  titulo.textContent = revision.apta
    ? '✓ La pregunta sirve tal como está'
    : '⚠ Conviene reformularla';
  panel.appendChild(titulo);

  if (revision.motivo) {
    const motivo = document.createElement('p');
    motivo.className = 'revision-motivo';
    motivo.textContent = revision.motivo;
    panel.appendChild(motivo);
  }

  // Reformulación sugerida: se ofrece, nunca se aplica sola.
  if (revision.reformulada && revision.reformulada !== document.getElementById('input-pregunta').value.trim()) {
    const etiqueta = document.createElement('p');
    etiqueta.className = 'revision-etiqueta';
    etiqueta.textContent = 'Pregunta sugerida';
    panel.appendChild(etiqueta);

    const sugerida = document.createElement('blockquote');
    sugerida.className = 'revision-sugerida';
    sugerida.textContent = revision.reformulada;
    panel.appendChild(sugerida);

    panel.appendChild(crearBotonAplicar('Usar esta pregunta', function () {
      const input = document.getElementById('input-pregunta');
      input.value = revision.reformulada;
      actualizarContadorPregunta();
    }));
  }

  // Tema sugerido, solo si difiere del elegido.
  const select = document.getElementById('select-tema');
  if (revision.tema && revision.tema.id !== select.value) {
    const etiquetaTema = document.createElement('p');
    etiquetaTema.className = 'revision-etiqueta';
    etiquetaTema.textContent = 'Tema sugerido';
    panel.appendChild(etiquetaTema);

    const tema = document.createElement('p');
    tema.className = 'revision-motivo';
    tema.textContent = revision.tema.etiqueta +
      (revision.tema.casa ? ' (casa ' + revision.tema.casa + ')' : '') +
      (revision.motivoTema ? ' — ' + revision.motivoTema : '');
    panel.appendChild(tema);

    panel.appendChild(crearBotonAplicar('Usar este tema', function () {
      select.value = revision.tema.id;
    }));
  }
}

async function revisarPreguntaDesdeFormulario() {
  const input = document.getElementById('input-pregunta');
  const errorEl = document.getElementById('error-pregunta');
  const boton = document.getElementById('btn-revisar-pregunta');
  const texto = input.value.trim();

  if (!texto) {
    errorEl.textContent = 'Escribe una pregunta antes de revisarla.';
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  ocultarPanelRevision();

  boton.disabled = true;
  boton.textContent = 'Consultando…';
  try {
    const revision = await revisarPregunta(texto);
    mostrarPanelRevision(revision);
  } catch (err) {
    console.error('No se pudo revisar la pregunta:', err);
    reportarError(err, 'revision-pregunta', {});
    const panel = document.getElementById('panel-revision');
    panel.hidden = false;
    panel.innerHTML = '';
    const aviso = document.createElement('p');
    aviso.className = 'revision-motivo';
    // La revisión es opcional: si falla, la consulta puede seguir igual.
    aviso.textContent = 'No se pudo revisar la pregunta (' + err.message +
      '). Podés tirar igual con la pregunta tal como está.';
    panel.appendChild(aviso);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Revisar mi pregunta antes de tirar';
  }
}

function actualizarContadorPregunta() {
  const input = document.getElementById('input-pregunta');
  const contador = document.getElementById('contador-pregunta');
  if (!input || !contador) return;
  contador.textContent = input.value.length + ' / ' + input.maxLength;
}

/* Entra a la pantalla de pregunta limpiando el textarea si la pregunta anterior
   ya se usó en una tirada. Si el usuario solo fue y volvió sin consultar, se
   conserva lo que estaba escribiendo. */
function irAPantallaPregunta() {
  if (estado.preguntaConsumida) {
    estado.pregunta = '';
    estado.preguntaConsumida = false;
    document.getElementById('input-pregunta').value = '';
    actualizarContadorPregunta();
    // La revisión anterior ya no aplica a una pregunta nueva.
    ocultarPanelRevision();
  }
  document.getElementById('error-pregunta').hidden = true;
  actualizarCartelHilo();
  mostrarPantalla('pantalla-pregunta');
}

function reiniciarConsulta(mantenerPregunta) {
  if (!mantenerPregunta) {
    estado.pregunta = '';
    estado.preguntaConsumida = false;
    document.getElementById('input-pregunta').value = '';
    actualizarContadorPregunta();
    ocultarPanelRevision();
    // Una consulta nueva de cero sale del hilo. Reintentar la interpretación
    // (mantenerPregunta) no: eso sigue siendo el mismo paso del asunto.
    salirDelHilo();
  }
  estado.lineas = [];
  estado.escudo = null;
  estado.interpretacion = '';
  estado.idConsultaGuardada = null;
  estado.fecha = null;
  detenerAnimacionOraculo();
  document.getElementById('barra-calculo-relleno').style.width = '0%';
  mostrarPantalla('pantalla-inicio');
}

/* ==========================================================================
   EL CARTEL DEL HILO

   Cuando se sigue un asunto, la pantalla de pregunta y la de resultado dicen
   cuál es. Sin esto no habría forma de saber que la consulta en curso arrastra
   el contexto de las anteriores.
   ========================================================================== */

function salirDelHilo() {
  estado.hilo = null;
  actualizarCartelHilo();
}

function actualizarCartelHilo() {
  ['cartel-hilo-pregunta', 'cartel-hilo-resultado'].forEach(function (id) {
    const cartel = document.getElementById(id);
    if (!cartel) return;

    if (!estado.hilo || !estado.hilo.consultas.length) {
      cartel.hidden = true;
      cartel.innerHTML = '';
      return;
    }

    const pasos = estado.hilo.consultas;
    const raiz = pasos[0];
    const ultima = pasos[pasos.length - 1];

    cartel.innerHTML =
      '<p class="cartel-hilo-titulo">Seguís este asunto</p>' +
      '<p class="cartel-hilo-pregunta"></p>' +
      '<p class="cartel-hilo-meta"></p>';
    cartel.querySelector('.cartel-hilo-pregunta').textContent = '«' + raiz.pregunta + '»';
    cartel.querySelector('.cartel-hilo-meta').textContent =
      pasos.length + (pasos.length === 1 ? ' consulta previa · ' : ' consultas previas · ') +
      'la última el ' + fechaCortaDeIso(ultima.creada_en);

    const salir = document.createElement('button');
    salir.type = 'button';
    salir.className = 'btn-enlace';
    salir.textContent = 'Salir del hilo';
    salir.addEventListener('click', salirDelHilo);
    cartel.appendChild(salir);

    cartel.hidden = false;
  });
}

/* ==========================================================================
   PANTALLA PREVIA

   Un laberinto fijo hay que cruzar antes de entrar. Sin texto ni indicación
   alguna: se toca la celda vecina libre para moverse hasta llegar al final.
   ========================================================================== */

const LAB_COLS = 5;
const LAB_FILAS = 6;
const LAB_SEMILLA = 20260813;
const LAB_CELDA_PX = 48;

function generadorPseudoAleatorio(semilla) {
  let s = semilla >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generarLaberinto(cols, filas, aleatorio) {
  const paredes = [];
  for (let r = 0; r < filas; r++) {
    const fila = [];
    for (let c = 0; c < cols; c++) fila.push({ n: true, s: true, e: true, o: true });
    paredes.push(fila);
  }
  const visitado = paredes.map(function (fila) { return fila.map(function () { return false; }); });

  function vecinos(r, c) {
    const lista = [];
    if (r > 0) lista.push([r - 1, c, 'n', 's']);
    if (r < filas - 1) lista.push([r + 1, c, 's', 'n']);
    if (c > 0) lista.push([r, c - 1, 'o', 'e']);
    if (c < cols - 1) lista.push([r, c + 1, 'e', 'o']);
    return lista;
  }

  const pila = [[0, 0]];
  visitado[0][0] = true;
  while (pila.length) {
    const [r, c] = pila[pila.length - 1];
    const opciones = vecinos(r, c).filter(function (v) { return !visitado[v[0]][v[1]]; });
    if (!opciones.length) { pila.pop(); continue; }
    const [nr, nc, ladoActual, ladoVecino] = opciones[Math.floor(aleatorio() * opciones.length)];
    paredes[r][c][ladoActual] = false;
    paredes[nr][nc][ladoVecino] = false;
    visitado[nr][nc] = true;
    pila.push([nr, nc]);
  }
  return paredes;
}

let laberintoParedes = null;
let laberintoPosicion = { r: 0, c: 0 };
const LABERINTO_META = { r: LAB_FILAS - 1, c: LAB_COLS - 1 };

function renderLaberinto() {
  const cont = document.getElementById('laberinto');
  if (!cont) return;
  cont.innerHTML = '';
  cont.style.gridTemplateColumns = 'repeat(' + LAB_COLS + ', ' + LAB_CELDA_PX + 'px)';

  for (let r = 0; r < LAB_FILAS; r++) {
    for (let c = 0; c < LAB_COLS; c++) {
      const celda = document.createElement('div');
      const paredesCelda = laberintoParedes[r][c];
      let clase = 'celda-laberinto';
      if (paredesCelda.n) clase += ' pared-n';
      if (paredesCelda.s) clase += ' pared-s';
      if (paredesCelda.e) clase += ' pared-e';
      if (paredesCelda.o) clase += ' pared-o';
      if (r === LABERINTO_META.r && c === LABERINTO_META.c) clase += ' meta-laberinto';
      celda.className = clase;
      celda.dataset.r = r;
      celda.dataset.c = c;
      if (r === laberintoPosicion.r && c === laberintoPosicion.c) {
        const token = document.createElement('span');
        token.className = 'token-laberinto';
        celda.appendChild(token);
      }
      cont.appendChild(celda);
    }
  }
}

function moverLaberinto(dr, dc) {
  const r = laberintoPosicion.r;
  const c = laberintoPosicion.c;
  const nr = r + dr;
  const nc = c + dc;
  if (nr < 0 || nr >= LAB_FILAS || nc < 0 || nc >= LAB_COLS) return;

  const paredesCelda = laberintoParedes[r][c];
  if (dr === -1 && paredesCelda.n) return;
  if (dr === 1 && paredesCelda.s) return;
  if (dc === -1 && paredesCelda.o) return;
  if (dc === 1 && paredesCelda.e) return;

  laberintoPosicion = { r: nr, c: nc };
  renderLaberinto();

  if (nr === LABERINTO_META.r && nc === LABERINTO_META.c) {
    mostrarPantalla('pantalla-inicio');
  }
}

function inicializarPortal() {
  laberintoParedes = generarLaberinto(LAB_COLS, LAB_FILAS, generadorPseudoAleatorio(LAB_SEMILLA));
  laberintoPosicion = { r: 0, c: 0 };
  renderLaberinto();

  const cont = document.getElementById('laberinto');
  if (cont) {
    cont.addEventListener('click', function (ev) {
      const celda = ev.target.closest('.celda-laberinto');
      if (!celda) return;
      const dr = Number(celda.dataset.r) - laberintoPosicion.r;
      const dc = Number(celda.dataset.c) - laberintoPosicion.c;
      if (Math.abs(dr) + Math.abs(dc) !== 1) return;
      moverLaberinto(dr, dc);
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (!document.getElementById('pantalla-portal').classList.contains('activa')) return;
    if (ev.key === 'ArrowUp') moverLaberinto(-1, 0);
    else if (ev.key === 'ArrowDown') moverLaberinto(1, 0);
    else if (ev.key === 'ArrowLeft') moverLaberinto(0, -1);
    else if (ev.key === 'ArrowRight') moverLaberinto(0, 1);
  });

  alTocar('lab-arriba', function () { moverLaberinto(-1, 0); });
  alTocar('lab-abajo', function () { moverLaberinto(1, 0); });
  alTocar('lab-izquierda', function () { moverLaberinto(0, -1); });
  alTocar('lab-derecha', function () { moverLaberinto(0, 1); });
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */

/* Engancha un manejador sin que un elemento ausente tumbe el resto del arranque.

   `inicializar()` encadena decenas de addEventListener. Si el service worker
   sirve un index.html viejo junto a un app.js nuevo, un solo getElementById que
   devuelva null tira TypeError y TODOS los listeners siguientes quedan sin
   registrar: botones que están en la pantalla y no responden a nada. */
function alTocar(id, manejador, evento) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn('Falta el elemento', id, '— no se pudo enganchar su manejador.');
    return;
  }
  el.addEventListener(evento || 'click', manejador);
}

function inicializar() {
  inicializarPortal();
  iniciarSentry();
  actualizarUiSentry();
  alTocar('btn-probar-sentry', probarSentry);
  poblarSelectTemas();
  inicializarSesion();

  alTocar('input-pregunta', actualizarContadorPregunta, 'input');
  alTocar('btn-revisar-pregunta', revisarPreguntaDesdeFormulario);
  actualizarContadorPregunta();

  alTocar('btn-sesion', function () {
    document.getElementById('error-email').hidden = true;
    mostrarErrorSesion('');
    mostrarPantalla('pantalla-sesion');
  });

  alTocar('btn-volver-sesion', function () {
    mostrarPantalla('pantalla-inicio');
  });

  alTocar('btn-entrar', entrarDesdeFormulario);
  alTocar('btn-crear-cuenta', crearCuentaDesdeFormulario);

  // Para ver si el celular autocompletó una contraseña distinta a la esperada
  // (Safari y Chrome guardan credenciales por separado).
  alTocar('btn-ver-password', function () {
    const input = document.getElementById('input-password');
    const verlo = input.type === 'password';
    input.type = verlo ? 'text' : 'password';
    this.textContent = verlo ? 'Ocultar' : 'Ver';
    this.setAttribute('aria-label', verlo ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  // Enter en cualquiera de los dos campos entra directo.
  ['input-email', 'input-password'].forEach(function (id) {
    alTocar(id, function (ev) {
      if (ev.key === 'Enter') entrarDesdeFormulario();
    }, 'keydown');
  });

  alTocar('btn-bitacora', abrirBitacora);

  poblarFiltroTemas();
  alTocar('filtro-tema', function () {
    filtroTemaBitacora = this.value;
    renderizarBitacora();
  }, 'change');
  alTocar('orden-bitacora', function () {
    ordenBitacora = this.value;
    renderizarBitacora();
  }, 'change');

  alTocar('btn-volver-bitacora', function () {
    mostrarPantalla('pantalla-inicio');
  });

  alTocar('btn-exportar-md', exportarBitacoraMarkdown);
  alTocar('btn-exportar-json', exportarBitacoraJson);

  alTocar('btn-cerrar-sesion', async function () {
    await cerrarSesion();
    mostrarPantalla('pantalla-inicio');
  });

  alTocar('btn-comenzar', function () {
    // Empezar de cero desde el inicio nunca continúa un asunto.
    salirDelHilo();
    if (!getApiKey()) {
      abrirPantallaClave('pantalla-pregunta');
      return;
    }
    irAPantallaPregunta();
  });

  alTocar('btn-config-api-key', function () {
    abrirPantallaClave('pantalla-inicio');
  });

  alTocar('btn-guardar-api-key', guardarApiKeyDesdeFormulario);

  alTocar('btn-cancelar-api-key', salirDePantallaClave);

  alTocar('btn-borrar-api-key', function () {
    borrarApiKey();
    mostrarPantalla('pantalla-inicio');
  });

  alTocar('btn-atras-pregunta', function () {
    mostrarPantalla('pantalla-inicio');
  });

  alTocar('btn-a-generacion', function () {
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

  alTocar('btn-reintentar', solicitarInterpretacion);
  alTocar('btn-nueva-interpretacion', solicitarInterpretacion);
  alTocar('btn-copiar-md', copiarLectura);
  alTocar('btn-guardar-bitacora', alternarGuardadoDeConsulta);
  alTocar('btn-nueva-consulta', function () { reiniciarConsulta(false); });
}

/* Service worker: hace que la app abra sin conexión y se pueda instalar en la
   pantalla de inicio. Si falla, la app funciona igual. */
function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('sw.js').catch(function (err) {
    console.warn('No se pudo registrar el service worker:', err);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializar);
  window.addEventListener('load', registrarServiceWorker);

  // Los navegadores móviles restauran el valor del textarea al volver desde el
  // bfcache o al restaurar la sesión, aunque el estado JS se haya reiniciado.
  // Si no hay una consulta en curso, se limpia para no arrastrar la pregunta anterior.
  window.addEventListener('pageshow', function () {
    const input = document.getElementById('input-pregunta');
    if (input && !estado.pregunta) {
      input.value = '';
      actualizarContadorPregunta();
    }
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
    limpiarDatosSensibles: limpiarDatosSensibles,
    limpiarEventoSentry: limpiarEventoSentry,
    extraerJson: extraerJson,
    normalizarRevision: normalizarRevision,
    describirFigura: describirFigura,
    posicionesDeEscudo: posicionesDeEscudo,
    detectarRepeticiones: detectarRepeticiones,
    verificarEscudo: verificarEscudo,
    revisarAsignaciones: revisarAsignaciones,
    avisosDeInterpretacion: avisosDeInterpretacion,
    escudoDeConsulta: escudoDeConsulta,
    interpretacionDesactualizada: interpretacionDesactualizada,
  };
}
