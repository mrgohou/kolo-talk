import { useEffect, useMemo, useState } from 'react'
import { PageTitle } from '../components/ui'
import { videos } from '../data'
import { useLang } from '../lib/i18n'

const FEATURED = ['jeGXDKyNeLQ', 'Tlno3UTif1I', 'rL_yju4nRnQ', 'BMDdopwqpxg', 'KXqDPVuy9uE', 'Y76c6UqN0dc', 'e8a-OAArdvU', 'NfRCKG0PnNM']

export default function Listen() {
  const { t } = useLang()
  const [playing, setPlaying] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [discovered, setDiscovered] = useState<typeof videos>([])
  useEffect(() => {
    fetch('/api/discovered')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { items: { key: string; platform: string; title: string; author?: string; url: string }[] }) =>
        setDiscovered(d.items.filter((i) => i.platform === 'youtube').map((i) => ({ id: i.key.slice(3), title: i.title, channel: i.author ?? '', views: 0, query: 'auto', url: i.url }))),
      )
      .catch(() => {})
  }, [])
  const list = useMemo(() => {
    const f = filter.toLowerCase()
    const ids = new Set(videos.map((v) => v.id))
    const all = [...videos, ...discovered.filter((d) => !ids.has(d.id))]
    const v = all.filter((x) => !f || `${x.title} ${x.channel}`.toLowerCase().includes(f))
    return [...v].sort((a, b) => Number(FEATURED.includes(b.id)) - Number(FEATURED.includes(a.id)) || (b.views ?? 0) - (a.views ?? 0))
  }, [filter, discovered])
  return (
    <div>
      <PageTitle sub={t({ fr: "Vidéos repérées par l'auto-apprentissage (« Liberian English », « Koloqua », artistes…). Écoutez l'accent, répétez.", en: 'Videos found by self-learning ("Liberian English", "Koloqua", artists…). Listen, repeat.' })}>
        {t({ fr: 'Écouter de vrais locuteurs', en: 'Hear real speakers' })}
      </PageTitle>
      <div className="px-4">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t({ fr: 'Filtrer (ex. Gina, Teddyride, Koloqua)…', en: 'Filter…' })} className="w-full rounded-xl border border-slate-300 px-4 py-2" />
      </div>
      <ul className="space-y-3 p-4">
        {list.map((v) => (
          <li key={v.id} className="overflow-hidden rounded-2xl border border-slate-200">
            {playing === v.id ? (
              <iframe className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1`} title={v.title} allow="autoplay; encrypted-media" allowFullScreen />
            ) : (
              <button onClick={() => setPlaying(v.id)} className="relative block w-full">
                <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-xl text-white">▶</span>
              </button>
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold">{v.title}</p>
              <p className="text-xs text-slate-500">{v.channel}{v.views ? ` · ${v.views.toLocaleString()} ${t({ fr: 'vues', en: 'views' })}` : ''}{v.query === 'auto' && <span className="ml-1 rounded-full bg-green-100 px-1.5 text-green-800">{t({ fr: 'nouveau', en: 'new' })}</span>}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
