import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/webhooks': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/principles': 'http://localhost:3000',
      '/trpc': 'http://localhost:3000',
    },
  },
  test: {
    root: path.resolve(__dirname),
    environment: 'jsdom',
    globals: true,
    setupFiles: path.resolve(__dirname, 'test-setup.ts'),
    css: true,
  },
})
