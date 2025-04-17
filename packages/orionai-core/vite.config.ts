import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@orion-ai/core',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
  },
  plugins: [
    // @ts-ignore
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      copyDtsFiles: true,
      insertTypesEntry: true,
    }),
  ],
})
