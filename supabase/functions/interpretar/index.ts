/* ==========================================================================
   Edge Function: interpretar

   Recibe el prompt de una tirada, le agrega la clave de Gemini del lado del
   servidor y devuelve la interpretación. Existe para que la clave deje de
   viajar al navegador, donde cualquiera podía leerla.

   Exige sesión válida de Supabase y lleva un límite diario por usuario, para
   que nadie agote la cuota.
   ========================================================================== */

const MODELOS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
const LIMITE_DIARIO = Number(Deno.env.get('LIMITE_CONSULTAS_DIARIAS') ?? '40');
const TIMEOUT_MS = 25000;
const LARGO_MAXIMO_PROMPT = 20000;

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ORIGEN_PERMITIDO') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/* Llama a un modelo concreto. `conThinking` permite reintentar sin
   thinkingConfig: algunos modelos lo rechazan con un 400 genérico que no
   menciona el campo. */
async function llamarModelo(
  modelo: string,
  apiKey: string,
  prompt: string,
  conThinking: boolean,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.6,
    topP: 0.9,
    maxOutputTokens: conThinking ? 4096 : 8192,
  };
  if (conThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new Error(`Gemini (${modelo}) estado ${respuesta.status} — ${cuerpo.slice(0, 300)}`);
  }

  const datos = await respuesta.json();
  const candidato = datos?.candidates?.[0];
  const motivo = candidato?.finishReason;
  const partes = candidato?.content?.parts;

  if (!partes?.length) {
    throw new Error(`Gemini (${modelo}) sin contenido utilizable (finishReason=${motivo}).`);
  }
  if (motivo === 'MAX_TOKENS') {
    throw new Error(`Gemini (${modelo}) truncó la respuesta por límite de tokens.`);
  }

  const texto = partes
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '')
    .join('');

  if (!texto.trim()) throw new Error(`Gemini (${modelo}) devolvió texto vacío.`);
  return texto;
}

// Recorre la cadena de modelos; ante un 400 reintenta el mismo sin thinkingConfig.
async function pedirInterpretacion(apiKey: string, prompt: string): Promise<string> {
  let ultimoError: Error | null = null;

  for (const modelo of MODELOS) {
    try {
      return await llamarModelo(modelo, apiKey, prompt, true);
    } catch (err) {
      const error = err as Error;
      console.error(`Falló ${modelo}:`, error.message);
      ultimoError = error;

      if (/thinking|invalid.?argument|estado 400/i.test(error.message)) {
        try {
          return await llamarModelo(modelo, apiKey, prompt, false);
        } catch (err2) {
          const error2 = err2 as Error;
          console.error(`Falló ${modelo} también sin thinkingConfig:`, error2.message);
          ultimoError = error2;
        }
      }
    }
  }
  throw ultimoError ?? new Error('Ningún modelo de Gemini respondió.');
}

Deno.serve(async (peticion: Request) => {
  if (peticion.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (peticion.method !== 'POST') return responder({ error: 'Método no permitido.' }, 405);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const urlSupabase = Deno.env.get('SUPABASE_URL');
  const claveServicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!apiKey || !urlSupabase || !claveServicio) {
    console.error('Faltan variables de entorno en la función.');
    return responder({ error: 'La función no está configurada.' }, 500);
  }

  // --- Sesión: sin usuario válido no se gasta cuota ---
  const autorizacion = peticion.headers.get('Authorization') ?? '';
  if (!autorizacion.startsWith('Bearer ')) {
    return responder({ error: 'Falta la sesión.' }, 401);
  }

  const respUsuario = await fetch(`${urlSupabase}/auth/v1/user`, {
    headers: { Authorization: autorizacion, apikey: claveServicio },
  });
  if (!respUsuario.ok) return responder({ error: 'Sesión inválida o vencida.' }, 401);

  const usuario = await respUsuario.json();
  const userId = usuario?.id;
  if (!userId) return responder({ error: 'Sesión inválida.' }, 401);

  // --- Prompt ---
  let cuerpo: { prompt?: string };
  try {
    cuerpo = await peticion.json();
  } catch {
    return responder({ error: 'Cuerpo inválido.' }, 400);
  }

  const prompt = (cuerpo.prompt ?? '').trim();
  if (!prompt) return responder({ error: 'Falta el prompt.' }, 400);
  if (prompt.length > LARGO_MAXIMO_PROMPT) {
    return responder({ error: 'El prompt es demasiado largo.' }, 413);
  }

  // --- Límite diario (se cuenta antes de llamar a Gemini) ---
  const respUso = await fetch(`${urlSupabase}/rest/v1/rpc/registrar_consulta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: claveServicio,
      Authorization: `Bearer ${claveServicio}`,
    },
    body: JSON.stringify({ p_user_id: userId, p_limite: LIMITE_DIARIO }),
  });

  if (respUso.ok) {
    const filas = await respUso.json();
    const uso = Array.isArray(filas) ? filas[0] : filas;
    if (uso && uso.permitido === false) {
      return responder({
        error: `Llegaste al límite de ${uso.limite} consultas por día. Vuelve mañana.`,
        limite_alcanzado: true,
      }, 429);
    }
  } else {
    // Si el control de uso falla, se sigue: es preferible responder la consulta
    // a bloquear la app por un problema de contabilidad.
    console.error('No se pudo registrar el uso:', await respUso.text().catch(() => ''));
  }

  // --- Gemini ---
  try {
    const texto = await pedirInterpretacion(apiKey, prompt);
    return responder({ texto });
  } catch (err) {
    const error = err as Error;
    console.error('Sin interpretación:', error.message);
    // Se devuelve el motivo real: perder el diagnóstico costó varias sesiones.
    return responder({ error: error.message }, 502);
  }
});
