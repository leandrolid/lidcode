import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  outDir: 'dist',
  clean: true,
  minify: false,
  sourcemap: false,
  target: 'es2021',
  keepNames: true,
})
