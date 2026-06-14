import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Lizard-Music/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'lizard-brand.svg',
        'lizard-logo.png',
        'lizard-logo-dark.png',
        'lizard-logo-light.png',
        'icon-192.png',
        'icon-192-light.png',
        'icon-512.png',
        'icon-512-light.png',
        'icon-maskable-512.png',
        'icon-maskable-512-light.png',
        'icon-monochrome-512.png',
        'apple-touch-icon.png',
        'apple-touch-icon-light.png',
      ],
      manifest: {
        id: '/Lizard-Music/',
        name: 'Lizard Music',
        short_name: 'Lizard Music',
        description: 'A fully-local music player — nothing leaves your device.',
        theme_color: '#0d0d14',
        background_color: '#0d0d14',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/Lizard-Music/',
        start_url: '/Lizard-Music/',
        categories: ['music', 'entertainment'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-192-light.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512-light.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-maskable-512-light.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-monochrome-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'monochrome',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    open: true,
    port: 5173,
    host: true,
  },
})
