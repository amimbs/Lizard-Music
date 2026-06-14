const DB_NAME = 'local-music-library'
const DB_VERSION = 2
const TRACKS_STORE = 'tracks'
const PLAYLISTS_STORE = 'playlists'

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          db.createObjectStore(TRACKS_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
          db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return dbPromise
}

function withStore(storeName, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const result = fn(store)
        tx.oncomplete = () => resolve(result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

export function isQuotaError(err) {
  return (
    err?.name === 'QuotaExceededError' ||
    err?.code === 22 ||
    err?.code === 1014
  )
}

export async function getAllTracks() {
  return withStore(TRACKS_STORE, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const records = request.result ?? []
        records.sort((a, b) => a.addedAt - b.addedAt)
        resolve(records)
      }
      request.onerror = () => reject(request.error)
    })
  })
}

export async function putTrack(record) {
  return withStore(TRACKS_STORE, 'readwrite', (store) => {
    store.put(record)
  })
}

export async function deleteTrack(id) {
  return withStore(TRACKS_STORE, 'readwrite', (store) => {
    store.delete(id)
  })
}

export async function getAllPlaylists() {
  return withStore(PLAYLISTS_STORE, 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const records = request.result ?? []
        records.sort((a, b) => a.name.localeCompare(b.name))
        resolve(records)
      }
      request.onerror = () => reject(request.error)
    })
  })
}

export async function putPlaylist(playlist) {
  return withStore(PLAYLISTS_STORE, 'readwrite', (store) => {
    store.put(playlist)
  })
}

export async function deletePlaylist(id) {
  return withStore(PLAYLISTS_STORE, 'readwrite', (store) => {
    store.delete(id)
  })
}

let persistentStorageRequested = false

export async function requestPersistentStorage() {
  if (persistentStorageRequested) return
  persistentStorageRequested = true
  if (navigator.storage?.persist) {
    try {
      await navigator.storage.persist()
    } catch {
      // Best-effort; library still works without it.
    }
  }
}

export function trackToRecord(track) {
  return {
    id: track.id,
    fileName: track.file.name,
    mimeType: track.file.type || 'audio/mpeg',
    audioBlob: track.file,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    coverBlob: track.coverBlob ?? null,
    coverMime: track.coverMime ?? null,
    addedAt: track.addedAt ?? Date.now(),
    favorite: track.favorite ?? false,
  }
}
