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

El estado de cada consulta (pregunta, escudo, interpretación) vive en memoria. La única
excepción es la clave de la API de Gemini, que se guarda en `localStorage` del navegador
del propio usuario (ver más abajo).

## Verificar la matemática del escudo

Antes de desplegar, podés correr la verificación programática de las 16 figuras y del
cálculo del escudo (transposición de Hijas, sumas binarias, Testigos, Juez y Reconciliador)
con un caso de prueba fijo:

```bash
node scripts/verify-figures.js
```

Debe terminar con "Todas las verificaciones pasaron".

## Configuración

### 1. Activar GitHub Pages

**Settings → Pages → Build and deployment → Source: GitHub Actions**.

Cada push a `main` dispara el workflow (`.github/workflows/deploy.yml`), que publica el
sitio tal cual está en el repositorio — es un deploy estático simple, sin pasos de build
que toquen claves ni secrets.

### 2. La clave de la API de Gemini

Este sitio no trae ninguna clave propia. La primera vez que alguien lo usa, el sitio le
pide que pegue su propia clave de la API de Gemini (gratis en
[Google AI Studio](https://aistudio.google.com/apikey)). Esa clave:

- se guarda únicamente en el `localStorage` del navegador de esa persona;
- nunca se commitea, ni se publica, ni pasa por ningún servidor propio;
- solo se envía a la API de Gemini al generar cada interpretación.

Desde la pantalla de inicio hay un enlace ("Configurar / cambiar la clave de la API") para
reemplazarla o borrarla en cualquier momento.

## Estructura del repositorio

```
index.html                       Estructura de las pantallas del flujo
style.css                        Estética mobile-first (paleta tierra/arena/cobre)
app.js                           Datos, matemática del escudo, UI, integración con Gemini
scripts/verify-figures.js        Verificación programática (correr localmente, no se publica)
.github/workflows/deploy.yml     Deploy estático a GitHub Pages
```
