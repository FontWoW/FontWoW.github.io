import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

const root = path.dirname(fileURLToPath(import.meta.url))
const src = path.resolve(root, 'src')

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    legacy({
      targets: ['Android >= 7', 'iOS >= 12'],
    }),
  ],
  resolve: {
    // Prevent duplicate React copies after folder moves / mixed import paths.
    dedupe: ['react', 'react-dom'],
    alias: [
      // More specific aliases first. Keep trailing slashes so `@capacitor/*` is never remapped.
      { find: '@shared/', replacement: `${path.resolve(src, 'shared')}/` },
      { find: '@landing/', replacement: `${path.resolve(src, 'landing')}/` },
      { find: '@app/', replacement: `${path.resolve(src, 'app')}/` },
      { find: '@share/', replacement: `${path.resolve(src, 'share')}/` },
      { find: '@stats/', replacement: `${path.resolve(src, 'stats')}/` },
      { find: /^@\/(.*)/, replacement: `${src}/$1` },
    ],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
  },
  build: {
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
