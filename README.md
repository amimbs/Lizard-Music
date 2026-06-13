# Local Music Player

A clean, fully-local music player built with React + Vite. Pick songs or whole
folders from your computer and play them — nothing ever leaves your machine.

## Features

- Add individual audio files or an entire folder
- Reads embedded tags (title, artist, album, cover art) from your files
- Play / pause, next / previous, seek, and volume control
- Shuffle and repeat (off / all / one)
- Live search across your library
- Album art with an animated "now playing" indicator
- OS media-key support (play/pause/next/prev) and keyboard shortcuts
- Supports mp3, m4a/aac, flac, wav, ogg/opus, and more

## Getting started

```bash
cd music-player
npm install
npm run dev
```

The app opens automatically at http://localhost:5173. Click **Add folder** (or
**Add files**) and select your downloaded music.

## Keyboard shortcuts

- `Space` — play / pause
- `Shift + →` — next track
- `Shift + ←` — previous track

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- Browsers can't read your disk directly, so you choose files through the native
  picker. Your music is loaded in-memory for the session only.
- The "Add folder" picker uses the `webkitdirectory` API, supported in Chrome,
  Edge, and other Chromium-based browsers (and recent Firefox/Safari).
