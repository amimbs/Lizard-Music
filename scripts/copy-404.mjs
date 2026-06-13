import { copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'))
console.log('Copied dist/index.html to dist/404.html for GitHub Pages SPA fallback')
