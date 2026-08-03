'use strict';

/* ==========================================================================
   SERVICE WORKER

   Objetivo: que la app abra sin conexión y arranque rápido, SIN que se quede
   pegada a una versión vieja tras un despliegue.

   Estrategia deliberada:
   - Solo se toca lo propio (mismo origen) y solo peticiones GET. Las llamadas
     a Gemini y a Supabase pasan de largo: nunca se cachean ni se interceptan,
     porque son datos vivos y privados.
   - Red primero para TODO lo propio, con la caché como respaldo sin conexión.

   Antes el HTML iba por red y el JS/CSS por caché con revalidación. Eso servía
   una versión mezclada en cada despliegue: HTML nuevo con JavaScript viejo, con
   botones que existían en la página pero cuyo manejador todavía no estaba
   cargado. La consistencia entre archivos importa más que ahorrar unos
   milisegundos en un sitio de este tamaño.
   ========================================================================== */

const VERSION = 'geomancia-v3';

// Rutas relativas al alcance del service worker, para que funcione tanto en la
// raíz del dominio como en un subdirectorio de GitHub Pages.
const ARCHIVOS_BASE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './manifest.json',
  './icono-192.png',
  './icono-512.png',
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSION)
      // addAll falla entero si un archivo falla; se agregan de a uno para que
      // un recurso ausente no impida instalar el service worker.
      .then(function (cache) {
        return Promise.all(ARCHIVOS_BASE.map(function (ruta) {
          return cache.add(ruta).catch(function (err) {
            console.warn('No se pudo precachear', ruta, err);
          });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nombres) {
        return Promise.all(nombres.map(function (nombre) {
          if (nombre !== VERSION) return caches.delete(nombre);
          return null;
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (evento) {
  if (evento.data === 'omitir-espera') self.skipWaiting();
});

self.addEventListener('fetch', function (evento) {
  const peticion = evento.request;

  if (peticion.method !== 'GET') return;

  let url;
  try {
    url = new URL(peticion.url);
  } catch (err) {
    return;
  }

  // Todo lo externo (Gemini, Supabase, el CDN) va directo a la red.
  if (url.origin !== self.location.origin) return;

  const esNavegacion = peticion.mode === 'navigate' ||
    (peticion.headers.get('accept') || '').indexOf('text/html') !== -1;

  // Red primero para todo lo propio: la página y su JavaScript tienen que venir
  // siempre de la misma versión. La caché queda solo como respaldo sin conexión.
  evento.respondWith(
    fetch(peticion)
      .then(function (respuesta) {
        if (respuesta && respuesta.status === 200 && respuesta.type === 'basic') {
          const copia = respuesta.clone();
          caches.open(VERSION).then(function (cache) { cache.put(peticion, copia); });
        }
        return respuesta;
      })
      .catch(function () {
        return caches.match(peticion).then(function (guardada) {
          if (guardada) return guardada;
          // Una navegación sin copia exacta cae al index cacheado.
          return esNavegacion ? caches.match('./index.html') : undefined;
        });
      })
  );
});
