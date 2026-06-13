const DB_NAME = 'local-music-library'
const DB_VERSION = 1
const STORE = 'tracks'

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  return dbPromise
}

function withStore(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const store = tx.objectStore(STORE)
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
  return withStore('readonly', (store) => {
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
  return withStore('readwrite', (store) => {
    store.put(record)
  })
}

export async function deleteTrack(id) {
  return withStore('readwrite', (store) => {
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
  }
}
