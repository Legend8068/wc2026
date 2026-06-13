import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // respect the port assigned by the preview harness (falls back to vite default)
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    strictPort: !!process.env.PORT,
  },
})
