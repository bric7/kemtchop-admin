// vite.config.ts - Configuration pour React
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'  // ← React uniquement
import path from 'path'

export default defineConfig({
  plugins: [react()],  // ← Plugin React
  
  resolve: {
    alias: {
      // ✅ Alias @/ → src/
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5173,
    open: true,
  },
  
  build: {
    outDir: 'dist',
  },
})