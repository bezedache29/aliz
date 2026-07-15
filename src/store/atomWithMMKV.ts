import { atomWithStorage } from 'jotai/utils'
import type { SyncStorage } from 'jotai/vanilla/utils/atomWithStorage'

import { mmkv as storage } from './mmkv'

function safeClone(value: unknown, seen = new WeakSet(), depth = 0): unknown {
  if (depth > 10) return undefined
  if (value === null || typeof value !== 'object') return value
  const obj = value as Record<string, unknown>
  if (seen.has(obj)) return undefined
  seen.add(obj)
  if (Array.isArray(value)) {
    return (value as unknown[]).map((item) => safeClone(item, seen, depth + 1))
  }
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    try {
      result[key] = safeClone(obj[key], seen, depth + 1)
    } catch {
      // getter threw (ex. contexte navigation) — propriété ignorée
    }
  }
  return result
}

function mmkvStorage<T>(initialValue: T): SyncStorage<T> {
  return {
    getItem(key: string, fallback: T): T {
      const raw = storage.getString(key)
      if (!raw) return fallback
      try {
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    setItem(key: string, value: T): void {
      storage.set(key, JSON.stringify(safeClone(value)))
    },
    removeItem(key: string): void {
      storage.remove(key)
    },
    // Pas de subscribe : l'écouteur MMKV déclencherait un re-read après chaque write,
    // écrasant l'état Jotai avec la version safeClone (potentiellement tronquée).
    // Dans une app RN mono-contexte, Jotai est le seul writer — pas besoin de sync externe.
  }
}

export const atomWithMMKV = <T>(key: string, initialValue: T) =>
  atomWithStorage<T>(key, initialValue, mmkvStorage(initialValue), { getOnInit: true })
