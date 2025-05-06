import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': JSON.stringify({}),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@orion-ai/core',
      fileName: 'index',
    },
  },
  plugins: [
    nodePolyfills({
      include: ['process', 'path', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    // @ts-ignore
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      copyDtsFiles: true,
      insertTypesEntry: true,
    }),
  ],
})
