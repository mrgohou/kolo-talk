import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { baseEntries } from '../data'
import type { Entry } from '../data/types'

interface Store {
  entries: Entry[]
  community: Entry[]
  favorites: string[]
  toggleFavorite: (id: string) => void
  progress: Record<string, number>
  setProgress: (moduleId: string, score: number) => void
  showVulgar: boolean
  setShowVulgar: (v: boolean) => void
  refreshCommunity: () => void
}

const Ctx = createContext<Store>(null as unknown as Store)

function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(v)), [key, v])
  return [v, setV] as const
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocal<string[]>('favorites', [])
  const [progress, setProgressState] = useLocal<Record<string, number>>('progress', {})
  const [showVulgar, setShowVulgar] = useLocal('showVulgar', false)
  const [community, setCommunity] = useLocal<Entry[]>('communityEntries', [])

  const refreshCommunity = () => {
    fetch('/api/approved')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { entries: Entry[] }) => setCommunity(d.entries))
      .catch(() => {})
  }
  useEffect(refreshCommunity, []) // eslint-disable-line react-hooks/exhaustive-deps

  const entries = useMemo(() => {
    const ids = new Set(baseEntries.map((e) => e.id))
    return [...baseEntries, ...community.filter((e) => !ids.has(e.id))]
  }, [community])

  return (
    <Ctx.Provider
      value={{
        entries,
        community,
        favorites,
        toggleFavorite: (id) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
        progress,
        setProgress: (m, s) => setProgressState((p) => ({ ...p, [m]: Math.max(p[m] ?? 0, s) })),
        showVulgar,
        setShowVulgar,
        refreshCommunity,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useStore = () => useContext(Ctx)
