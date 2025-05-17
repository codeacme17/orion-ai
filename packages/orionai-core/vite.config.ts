import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import dts from 'vite-plugin-dts'

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
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'node:path',
        'node:url',
        'node:stream',
        'node:util',
        /^node:.*/,
        /^@?[a-zA-Z0-9-]+$/,
        /^@?[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/,
      ],
      output: [
        {
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
          dir: 'dist',
          sourcemap: false,
        },
        {
          format: 'cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].cjs',
          dir: 'dist',
          sourcemap: false,
        },
      ],
    },
    sourcemap: false,
    minify: false,
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
    }) as any,
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      copyDtsFiles: true,
      insertTypesEntry: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    }),
  ],
})
