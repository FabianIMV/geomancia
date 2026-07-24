'use strict';

/* ==========================================================================
   SERVICE WORKER

   Objetivo: que la app abra sin conexión y arranque rápido, SIN que se quede
   pegada a una versión vieja tras un despliegue.

   Estrategia deliberada:
   - Solo se toca lo propio (mismo origen) y solo peticiones GET. Las llamadas
     a Gemini y a Supabase pasan de largo: nunca se cachean ni se interceptan,
     porque son datos vivos y privados.
   - Para el HTML: red primero, caché como respaldo. Así un despliegue nuevo se
     ve al instante mientras haya señal, y sin señal se abre la última copia.
   - Para CSS/JS/íconos: se responde con la caché y se revalida en segundo
     plano, de modo que la app abre rápido y se actualiza para la próxima vez.
   ========================================================================== */

const VERSION = 'geomancia-v1';

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

  // Navegación / HTML: red primero.
  const esNavegacion = peticion.mode === 'navigate' ||
    (peticion.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (esNavegacion) {
    evento.respondWith(
      fetch(peticion)
        .then(function (respuesta) {
          const copia = respuesta.clone();
          caches.open(VERSION).then(function (cache) { cache.put(peticion, copia); });
          return respuesta;
        })
        .catch(function () {
          return caches.match(peticion).then(function (guardada) {
            return guardada || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Recursos estáticos: caché y revalidación en segundo plano.
  evento.respondWith(
    caches.match(peticion).then(function (guardada) {
      const desdeRed = fetch(peticion)
        .then(function (respuesta) {
          if (respuesta && respuesta.status === 200 && respuesta.type === 'basic') {
            const copia = respuesta.clone();
            caches.open(VERSION).then(function (cache) { cache.put(peticion, copia); });
          }
          return respuesta;
        })
        .catch(function () { return guardada; });
      return guardada || desdeRed;
    })
  );
});
