# Local Music Player

A clean, fully-local music player built with React + Vite. Pick songs or whole
folders from your device and play them — nothing ever leaves your machine.

Install it on Android as a PWA for a native-like experience with lock-screen controls.

## Features

- Add individual audio files or an entire folder
- Reads embedded tags (title, artist, album, cover art) from your files
- Play / pause, next / previous, seek, and volume control
- Shuffle and repeat (off / all / one)
- Live search across your library
- Album art with an animated "now playing" indicator
- OS media-key support (play/pause/next/prev) and keyboard shortcuts
- Lock-screen controls on Android via Media Session API
- Installable PWA for Android (add to home screen)
- Library persists locally between sessions (IndexedDB)
- Virtualized playlist for smooth scrolling with large libraries
- Supports mp3, m4a/aac, flac, wav, ogg/opus, and more

## Getting started

```bash
cd music-player
npm install
npm run dev
```

The app opens automatically at http://localhost:5173/Lizard-Music/. Click **Add files** (or
**Add folder** on desktop) and select your music.

### Test on your phone over Wi-Fi

With the dev server running, open `http://<your-pc-ip>:5173/Lizard-Music/` on your
Android phone (same Wi-Fi network). The dev server binds to all interfaces (`host: true`).

## Install on Android

1. Open the deployed app in Chrome: **https://amimbs.github.io/Lizard-Music/**
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**
3. Launch from your home screen like a native app

> **Note:** On Android, use **Add files** to pick music. Folder picking is unreliable on mobile Chrome.

## Keyboard shortcuts (desktop)

- `Space` — play / pause
- `Shift + →` — next track
- `Shift + ←` — previous track

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

Pushes to `main` automatically deploy via GitHub Actions (`.github/workflows/deploy.yml`).

To enable GitHub Pages for the first time:

1. Go to the repo **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the workflow builds and publishes to `https://amimbs.github.io/Lizard-Music/`

## Notes

- Browsers can't read your disk directly, so you choose files through the native
  picker. Your music is stored locally on your device in IndexedDB and restored
  when you reopen the app.
- Removing a song deletes it from your saved library. Add files again to bring it back.
- The "Add folder" picker uses the `webkitdirectory` API, supported on desktop
  Chrome, Edge, and other Chromium-based browsers (and recent Firefox/Safari).
- PWA install and service workers require HTTPS — GitHub Pages provides this automatically.
