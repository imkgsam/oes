import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: [
      'src/**/*.{unit,component,contract,integration}.spec.ts',
      'test/**/*.{unit,component,contract,integration}.spec.ts'
    ]
  }
})
