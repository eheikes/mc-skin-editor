import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
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
