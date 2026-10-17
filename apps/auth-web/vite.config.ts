import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      quoteStyle: 'single',
      semicolons: false,
    }),
    react(),
  ],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3334' },
      '/.well-known': { target: 'http://localhost:3334' },
    },
  },
})
