import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces so the dev server is reachable from outside a Docker container.
    host: true,
    port: Number(process.env.FRONTEND_PORT ?? 5180),
    strictPort: true,
    // File-system events do not always cross Docker bind mounts; polling is opt-in.
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
  },
  preview: {
    port: 4180,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
