import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: process.env.PORT != null && process.env.PORT !== '' ? Number(process.env.PORT) : 5173,
    strictPort: false
  }
})
