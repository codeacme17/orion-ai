/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OrionAI',
      fileName: 'index',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['openai', 'zod', 'https-proxy-agent'],
      output: {
        globals: {
          openai: 'OpenAI',
          zod: 'z',
          'https-proxy-agent': 'HttpsProxyAgent',
        },
      },
    },
  },
})
