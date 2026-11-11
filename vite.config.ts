import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      // The new service worker activates on its own; open tabs pick up the new
      // version on their next load, so nothing reloads out from under an edit.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons.svg'],
      manifest: {
        id: '/',
        name: 'SkinCrafter: Skin Editor for Minecraft',
        short_name: 'SkinCrafter',
        description: pkg.description,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        // Match --header-bg / --bg in src/app.css.
        theme_color: '#202225',
        background_color: '#1b1c1f',
        categories: ['entertainment', 'graphics', 'games'],
        // Placeholder icons generated from favicon.svg; replace with real artwork.
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
        // TODO: add `screenshots` (wide + narrow) for the richer install dialog.
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // og-image.png is only for link previews; no need to cache it offline.
        globIgnores: ['og-image.png'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  define: {
    APP_VERSION: JSON.stringify(pkg.version)
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Splits out three.js (only used by Viewport3D, itself loaded via
            // dynamic import) so it caches separately from app code that
            // changes far more often.
            { name: 'three', test: /[\\/]node_modules[\\/]three[\\/]/ }
          ]
        }
      }
    },
    // three.js's WebGLRenderer alone accounts for most of the size here; there's
    // no further meaningful split without breaking up the vendor module itself.
    chunkSizeWarningLimit: 600
  },
  server: {
    port: process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 5173,
    strictPort: false
  }
})
