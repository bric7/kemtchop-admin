import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
})