import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: Number(process.env.FRONTEND_PORT ?? 5180),
    strictPort: true,
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
  },
  preview: {
    port: 4180,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
