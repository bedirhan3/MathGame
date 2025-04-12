import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Tüm cihazlardan erişimi açmak için
    port: 5173, // Vite'in dinleyeceği port
    strictPort: true, // Port çakışmalarını engeller
  },
})