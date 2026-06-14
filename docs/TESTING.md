# Testing

This project uses [Vitest](https://vitest.dev/) for unit tests. Tests run in a simulated browser (jsdom) so we can check React components and browser APIs without opening the app manually.

## Quick start

```bash
npm install          # if you haven't already
npm run test:run     # run all tests once
npm test             # watch mode — re-runs when you save files
```

**Watch mode** is handy while you work on a file. **Single run** (`test:run`) is what you'd use in CI or before pushing.

## What is tested?

Tests focus on small, predictable pieces of logic — not the full app UI end-to-end.

### Utilities (`src/utils/`)

| File | What it checks |
|------|----------------|
| `format.test.js` | Time display (`1:05`) and turning filenames into readable titles |
| `audio.test.js` | Detecting audio files by type/extension; reading track duration from a file |
| `async.test.js` | Processing many items at once without exceeding a concurrency limit |
| `tracks.test.js` | Sorting songs by title/artist; building shuffle play order |
| `view.test.js` | Switching library tabs and search box placeholder text |
| `deleteConfirm.test.js` | Delete confirmation mode and user-facing copy for songs and playlists |

### Library storage (`src/libraryDb.test.js`)

| What it checks |
|----------------|
| Recognizing "storage full" errors |
| Converting an in-memory track into the shape saved to IndexedDB |

### Hooks (`src/hooks/`)

| File | What it checks |
|------|----------------|
| `useTrackViews.test.jsx` | Songs, Favorites, Recent, and playlist views; search filtering; play order |
| `useMusicLibrary.test.jsx` | Playlist delete keeps tracks; track delete removes from library only |

### Components (`src/components/`)

| File | What it checks |
|------|----------------|
| `StorageBanner.test.jsx` | Warning banner shows a message and the dismiss button works |
| `ConfirmModal.test.jsx` | Focus, confirm/cancel, Escape, overlay dismiss, delete copy |
| `PlaylistsBrowser.test.jsx` | Delete requests confirmation via callback; playlist card opens playlist |

**Not covered yet:** full playback (`usePlayback`), file import flow, dropdown menus, and end-to-end App wiring. Those rely more on browser APIs and user interaction; they're better suited to manual testing or future integration tests.

## Where test files live

Test files sit next to the code they test and use a `.test.js` or `.test.jsx` suffix:

```
src/utils/format.js       →  src/utils/format.test.js
src/hooks/useTrackViews.js → src/hooks/useTrackViews.test.jsx
```

## How to read a test

Tests are grouped with `describe` (the subject) and `it` (one behavior):

```js
describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(65)).toBe('1:05')
  })
})
```

- **`expect(...).toBe(...)`** — exact match  
- **`expect(...).toEqual(...)`** — deep compare objects/arrays  
- **`expect(...).toHaveLength(n)`** — array length  

React hook tests use `renderHook` from Testing Library. Component tests use `render` and simulate clicks with `userEvent`.

## Adding a new test

1. Create `yourModule.test.js` beside `yourModule.js`.
2. Import the function or component and write a `describe` / `it` block.
3. Run `npm test` and confirm it passes.

Example for a new utility:

```js
import { describe, expect, it } from 'vitest'
import { myHelper } from './myHelper.js'

describe('myHelper', () => {
  it('does the expected thing', () => {
    expect(myHelper('input')).toBe('output')
  })
})
```

## Configuration

| File | Purpose |
|------|---------|
| `vite.config.js` | `test` section — jsdom environment, setup file |
| `src/test/setup.js` | Loads extra matchers (e.g. `toBeInTheDocument`) |

Vitest is pinned to v2 so it works with this project's Vite 5 setup.
