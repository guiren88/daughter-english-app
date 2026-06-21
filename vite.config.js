import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/tts': {
        target: 'https://dict.youdao.com/dictvoice',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '')
      }
    }
  }
})
