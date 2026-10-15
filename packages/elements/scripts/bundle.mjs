import esbuild from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

await esbuild.build({
  entryPoints: [path.resolve(rootDir, 'src/index.ts')],
  bundle: true,
  minify: false,
  format: 'iife',
  outfile: path.resolve(rootDir, 'dist/bundle.js'),
  target: ['es2022'],
})

await esbuild.build({
  entryPoints: [path.resolve(rootDir, 'src/index.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: path.resolve(rootDir, 'dist/bundle.min.js'),
  target: ['es2022'],
})
