/// <reference types="vitest" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OrionAIAnthropic',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['ai', '@ai-sdk/anthropic', '@orion-ai/core'],
      output: {
        globals: {
          'ai': 'AI',
          '@ai-sdk/anthropic': 'AISDKAnthropic',
          '@orion-ai/core': 'OrionAICore',
        },
      },
    },
  },
})
