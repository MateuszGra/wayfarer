import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./web/src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  build: {
    // Passenger on MyDevil serves files from public/ directly; Fastify only handles /api and SPA fallback.
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // Listen on all interfaces so the dev server works inside Docker and can be opened from a phone on the LAN.
    host: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
