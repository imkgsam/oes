import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/runtime/background.ts'),
        'browser-activity-page-observer': resolve(__dirname, 'src/runtime/browser-activity-page-observer.ts'),
        index: resolve(__dirname, 'index.html'),
        'side-panel': resolve(__dirname, 'side-panel.html')
      },
      output: {
        entryFileNames: (chunk) => ['background', 'browser-activity-page-observer'].includes(chunk.name)
          ? `${chunk.name}.js`
          : 'assets/[name]-[hash].js'
      }
    }
  },
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        target: 'http://localhost:9101/api/v1',
        ws: false
      }
    }
  }
})
