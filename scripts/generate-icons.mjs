import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svg = readFileSync(join(publicDir, 'note.svg'))

const sizes = [
  { name: 'icon-192.png', size: 192, padding: 0.2 },
  { name: 'icon-512.png', size: 512, padding: 0.2 },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.35 },
]

for (const { name, size, padding } of sizes) {
  const inner = Math.round(size * (1 - padding * 2))
  const offset = Math.round((size - inner) / 2)
  const icon = await sharp(svg)
    .resize(inner, inner)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 13, g: 13, b: 20, alpha: 1 },
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
    .toFile(join(publicDir, name))

  console.log(`Wrote public/${name}`)
}
