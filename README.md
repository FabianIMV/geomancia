# Geomancia — El Oráculo del Veredicto

Sitio estático (HTML + CSS + JavaScript vanilla, sin frameworks ni build) que implementa
un oráculo de **geomancia occidental clásica** en español, mobile-first, con interpretación
generada por la API de Gemini.

Este es el oráculo "externo": responde preguntas concretas sobre el mundo mediante el
escudo geomántico completo (4 Madres, 4 Hijas, 4 Sobrinas, 2 Testigos, Juez y Reconciliador)
y la carta de las 12 casas astrológicas.

## Cómo funciona

1. El consultante formula una pregunta concreta y elige el tema/casa relevante.
2. Genera las 16 líneas del escudo tocando la pantalla (modo tradicional) o al azar (modo automático).
3. El sitio calcula algorítmicamente Hijas, Sobrinas, Testigos, Juez y Reconciliador, y arma
   la carta de casas.
4. Se envía el escudo completo a Gemini con instrucciones estrictas de geomante hermético
   para obtener un veredicto. Si la llamada falla, se muestra una interpretación estructural
   de respaldo generada localmente.
5. El resultado se puede copiar como Markdown para una bitácora personal, con una sección de
   verificación posterior para contrastar el veredicto con lo que realmente ocurrió.

Todo el estado vive en memoria: no se usa `localStorage` ni `sessionStorage`.

## Verificar la matemática del escudo

Antes de desplegar, podés correr la verificación programática de las 16 figuras y del
cálculo del escudo (transposición de Hijas, sumas binarias, Testigos, Juez y Reconciliador)
con un caso de prueba fijo:

```bash
node scripts/verify-figures.js
```

Debe terminar con "Todas las verificaciones pasaron".

## Configuración

### 1. Secret `GEMINI_API_KEY`

En el repositorio de GitHub: **Settings → Secrets and variables → Actions → New repository secret**,
con nombre `GEMINI_API_KEY` y el valor de tu clave de la API de Gemini (Google AI Studio).

El workflow de despliegue (`.github/workflows/deploy.yml`) reemplaza el placeholder
`__GEMINI_API_KEY__` de `app.js` por el valor del secret durante el build, antes de publicar.
La clave **nunca** se commitea al repositorio.

### 2. Activar GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions**.

Cada push a `main` dispara el workflow, que publica el sitio automáticamente.

## ⚠️ Advertencia importante sobre la clave de API

Este sitio es **100% estático**. La clave de Gemini se inyecta en el `app.js` publicado,
lo que significa que **queda visible en el código fuente que cualquiera puede ver** al
inspeccionar el sitio desplegado (no hay backend que la oculte).

Por eso es indispensable restringir la clave en **Google AI Studio / Google Cloud Console**
para que solo funcione desde tu dominio de GitHub Pages:

1. Andá a la configuración de la clave de API (Google AI Studio → API Keys, o Google Cloud
   Console → Credenciales).
2. Restringí la clave por **referrer HTTP** (application restriction: "Websites").
3. Agregá como referrer permitido: `https://TU-USUARIO.github.io/*` (reemplazá `TU-USUARIO`
   por tu usuario u organización de GitHub).
4. Guardá los cambios.

Sin esta restricción, cualquiera que copie la clave del código fuente podría usarla fuera
de este sitio y consumir tu cuota. **No lo dejes sin hacer.**

## Estructura del repositorio

```
index.html                       Estructura de las 6 pantallas del flujo
style.css                        Estética mobile-first (paleta tierra/arena/cobre)
app.js                           Datos, matemática del escudo, UI, integración con Gemini
scripts/verify-figures.js        Verificación programática (correr localmente, no se publica)
.github/workflows/deploy.yml     Build + inyección de la clave + publicación a GitHub Pages
```
