import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const rawPath = join(publicDir, 'lizard-source-raw.png')

const BG = { r: 13, g: 13, b: 20, alpha: 1 }
const LIGHT_BG = { r: 245, g: 245, b: 247, alpha: 1 }

function isBackgroundColor(r, g, b) {
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
  return maxDiff <= 12 && r >= 200 && g >= 200 && b >= 200
}

function isDark(r, g, b) {
  return r < 120 && g < 120 && b < 120
}

function idx(x, y, w) {
  return (y * w + x) * 4
}

function classifyPixels(data, w, h) {
  const alpha = new Uint8Array(w * h)
  const isBody = new Uint8Array(w * h)
  const isBackground = new Uint8Array(w * h)
  const queue = []

  for (let x = 0; x < w; x++) {
    queue.push([x, 0], [x, h - 1])
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push([0, y], [w - 1, y])
  }

  while (queue.length) {
    const [x, y] = queue.pop()
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const p = y * w + x
    if (isBackground[p]) continue

    const i = idx(x, y, w)
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!isBackgroundColor(r, g, b)) continue

    isBackground[p] = 1
    queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1])
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (isBackground[p]) continue

      const i = idx(x, y, w)
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      alpha[p] = 255
      if (isDark(r, g, b)) isBody[p] = 1
    }
  }

  return { alpha, isBody }
}

function buildRgba(data, w, h, alpha, isBody, theme) {
  const out = Buffer.alloc(w * h * 4)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      const i = idx(x, y, w)
      const a = alpha[p]
      out[i + 3] = a
      if (!a) continue

      const wasBody = isBody[p]
      const wasWhite = !wasBody && data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200

      if (theme === 'dark') {
        if (wasBody) {
          out[i] = 255
          out[i + 1] = 255
          out[i + 2] = 255
        } else if (wasWhite) {
          out[i] = 20
          out[i + 1] = 20
          out[i + 2] = 28
        } else {
          out[i] = 255
          out[i + 1] = 255
          out[i + 2] = 255
        }
      } else if (theme === 'light') {
        if (wasBody) {
          out[i] = 28
          out[i + 1] = 28
          out[i + 2] = 36
        } else if (wasWhite) {
          out[i] = 255
          out[i + 1] = 255
          out[i + 2] = 255
        } else {
          out[i] = 28
          out[i + 1] = 28
          out[i + 2] = 36
        }
      } else {
        out[i] = data[i]
        out[i + 1] = data[i + 1]
        out[i + 2] = data[i + 2]
      }
    }
  }

  return out
}

async function loadProcessedLayers() {
  const { data, info } = await sharp(rawPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { alpha, isBody } = classifyPixels(data, info.width, info.height)

  const transparent = buildRgba(data, info.width, info.height, alpha, isBody, 'transparent')
  const darkTheme = buildRgba(data, info.width, info.height, alpha, isBody, 'dark')
  const lightTheme = buildRgba(data, info.width, info.height, alpha, isBody, 'light')

  const meta = { width: info.width, height: info.height }

  return {
    transparent: await sharp(transparent, { raw: { ...meta, channels: 4 } }).png().toBuffer(),
    darkTheme: await sharp(darkTheme, { raw: { ...meta, channels: 4 } }).png().toBuffer(),
    lightTheme: await sharp(lightTheme, { raw: { ...meta, channels: 4 } }).png().toBuffer(),
  }
}

async function writeLogoVariants(layers) {
  await sharp(layers.transparent).toFile(join(publicDir, 'lizard-logo.png'))
  await sharp(layers.darkTheme).toFile(join(publicDir, 'lizard-logo-dark.png'))
  await sharp(layers.lightTheme).toFile(join(publicDir, 'lizard-logo-light.png'))
  console.log('Wrote public/lizard-logo.png (transparent)')
  console.log('Wrote public/lizard-logo-dark.png (white, for dark theme)')
  console.log('Wrote public/lizard-logo-light.png (dark, for light theme)')
}

async function compositeIcon(layers, { name, size, padding, theme, background }) {
  const layer = theme === 'dark' ? layers.darkTheme : layers.lightTheme
  const inner = Math.round(size * (1 - padding * 2))
  const offset = Math.round((size - inner) / 2)
  const icon = await sharp(layer).resize(inner, inner).png().toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
    .toFile(join(publicDir, name))

  console.log(`Wrote public/${name}`)
}

async function writeFaviconSvg(layers) {
  const darkB64 = layers.darkTheme.toString('base64')
  const lightB64 = layers.lightTheme.toString('base64')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .icon { display: none; }
    @media (prefers-color-scheme: dark) {
      .icon-dark { display: block; }
    }
    @media (prefers-color-scheme: light) {
      .icon-light { display: block; }
    }
  </style>
  <image class="icon icon-dark" width="32" height="32" href="data:image/png;base64,${darkB64}" />
  <image class="icon icon-light" width="32" height="32" href="data:image/png;base64,${lightB64}" />
</svg>
`
  writeFileSync(join(publicDir, 'favicon.svg'), svg)
  console.log('Wrote public/favicon.svg')
}

async function writeBrandSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">
  <style>
    .logo { display: none; width: 100%; height: 100%; object-fit: contain; }
    @media (prefers-color-scheme: dark) {
      .logo-dark { display: block; }
    }
    @media (prefers-color-scheme: light) {
      .logo-light { display: block; }
    }
  </style>
  <image class="logo logo-dark" href="/lizard-logo-dark.png" width="32" height="32" />
  <image class="logo logo-light" href="/lizard-logo-light.png" width="32" height="32" />
</svg>
`
  writeFileSync(join(publicDir, 'lizard-brand.svg'), svg)
  console.log('Wrote public/lizard-brand.svg')
}

if (!existsSync(rawPath)) {
  console.error('Missing public/lizard-source-raw.png — add the source artwork first.')
  process.exit(1)
}

const layers = await loadProcessedLayers()
await writeLogoVariants(layers)
await writeFaviconSvg(layers)
await writeBrandSvg()

const iconSets = [
  { suffix: '', theme: 'dark', background: BG },
  { suffix: '-light', theme: 'light', background: LIGHT_BG },
]

const sizes = [
  { name: 'icon-192', size: 192, padding: 0.18 },
  { name: 'icon-512', size: 512, padding: 0.18 },
  { name: 'icon-maskable-512', size: 512, padding: 0.32 },
  { name: 'apple-touch-icon', size: 180, padding: 0.18 },
]

for (const { suffix, theme, background } of iconSets) {
  for (const { name, size, padding } of sizes) {
    await compositeIcon(layers, {
      name: `${name}${suffix}.png`,
      size,
      padding,
      theme,
      background,
    })
  }
}

const monochromeInner = Math.round(512 * (1 - 0.32 * 2))
const monochromeOffset = Math.round((512 - monochromeInner) / 2)
const monochromeIcon = await sharp(layers.darkTheme)
  .resize(monochromeInner, monochromeInner)
  .png()
  .toBuffer()

await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: monochromeIcon, left: monochromeOffset, top: monochromeOffset }])
  .png()
  .toFile(join(publicDir, 'icon-monochrome-512.png'))

console.log('Wrote public/icon-monochrome-512.png')
