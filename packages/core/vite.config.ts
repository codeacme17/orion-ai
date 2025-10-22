import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 获取所有目录下的 index.ts 文件作为入口
const entries = {
  index: resolve(__dirname, 'src/index.ts'),
  'agents/index': resolve(__dirname, 'src/agents/index.ts'),
  'messages/index': resolve(__dirname, 'src/messages/index.ts'),
  'models/index': resolve(__dirname, 'src/models/index.ts'),
  'tools/index': resolve(__dirname, 'src/tools/index.ts'),
  'lib/index': resolve(__dirname, 'src/lib/index.ts'),
}

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
      entry: entries,
      name: '@orion-ai/core',
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['node:path', 'node:url', 'node:stream', 'node:util'],
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
