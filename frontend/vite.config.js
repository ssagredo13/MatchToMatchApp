import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // Obligatorio para Docker
    port: 5173,
    watch: {
      usePolling: true, // Para que detecte tus cambios en Windows
    },
  },
})