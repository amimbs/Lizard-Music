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

Chrome no longer shows an automatic install popup for most sites. After deploying the latest version, you will see an **Install** bar at the top of the app when Chrome is ready, or manual steps below.

1. Open the deployed app in **Chrome**: **https://amimbs.github.io/Lizard-Music/**
2. If you see the purple **Install** bar, tap **Install** and wait for it to finish
3. Otherwise, tap the menu (**⋮**) → **Install app** or **Add to Home screen**
4. Launch from your **home screen icon** — not from the Downloads folder
5. A proper install adds an icon to your home screen (and usually the app drawer). Long-press the icon: **Uninstall** means it installed correctly; **Remove** means it is only a shortcut

> **Note:** On Android, use **Add files** to pick music. Folder picking is unreliable on mobile Chrome.

**If install fails or lands in Downloads:** make sure you are signed into Google Play Services, on normal Wi‑Fi (not a restrictive VPN), and wait 10–20 seconds after tapping Install. Then try Chrome menu → Install app again.

**If your library persists after uninstalling:** uninstalling removes the app icon, not stored site data. To clear your music: Chrome → Settings → Site settings → amimbs.github.io → Clear storage.

## Keyboard shortcuts (desktop)

- `Space` — play / pause
- `Shift + →` — next track
- `Shift + ←` — previous track

## Build for production

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test:run   # run once
npm test           # watch mode while developing
```

See [docs/TESTING.md](docs/TESTING.md) for what's covered and how to add tests.

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
