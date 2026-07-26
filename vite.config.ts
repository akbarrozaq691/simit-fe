// defineConfig comes from vitest/config, not vite — the `test` key below is
// a Vitest option and vite's own type does not know about it.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    // Same-origin with the API in dev, so the browser never makes a
    // cross-origin request and the backend needs no CORS middleware.
    proxy: {
      '/v1/api': { target: 'http://localhost:8888', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
  },
})
