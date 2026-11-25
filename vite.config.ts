/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: https://majidramzi.github.io/mini-expense-tracker/
export default defineConfig({
  base: '/mini-expense-tracker/',
  plugins: [react(), tailwindcss()],
  server: { allowedHosts: ['.e2b.app'] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
