'use strict';

const { defineConfig, devices } = require('@playwright/test');

// El sitio es estático: alcanza con servir la carpeta tal cual se publica.
const PUERTO = 4173;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  // Algunos entornos ya traen Chromium instalado y no pueden bajar el build que
  // Playwright espera. Con CHROMIUM_PATH se usa el que ya está.
  use: Object.assign(
    {
      baseURL: 'http://127.0.0.1:' + PUERTO,
      trace: 'on-first-retry',
    },
    process.env.CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } }
      : {}
  ),

  projects: [
    {
      name: 'movil',
      // La app se usa sobre todo desde el celular: se prueba en ese tamaño.
      use: Object.assign({}, devices['iPhone 13'], {
        // El Chromium preinstalado del entorno no soporta WebKit; se usa el motor
        // de Chromium con la pantalla y el táctil de un móvil.
        defaultBrowserType: 'chromium',
        browserName: 'chromium',
      }),
    },
  ],

  webServer: {
    command: 'python3 -m http.server ' + PUERTO + ' --bind 127.0.0.1',
    url: 'http://127.0.0.1:' + PUERTO + '/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
