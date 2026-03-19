import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      fs: {
        // Permitir acceso a archivos fuera del directorio del proyecto
        allow: [
          // Directorio del proyecto
          path.resolve(__dirname),
          // Directorio node_modules
          path.resolve(__dirname, '../node_modules'),
          // Directorio raíz
          path.resolve(__dirname, '..')
        ]
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            markdown: ['@uiw/react-md-editor', '@uiw/react-markdown-preview', 'react-markdown', 'remark-gfm']
          }
        }
      }
    },
  }
})
