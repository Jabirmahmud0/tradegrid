import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',
    plugins: () => [
      // workers don't need react plugin but might need other vite plugins
    ],
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
})
