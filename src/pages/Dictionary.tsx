import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, PageTitle, SpeakButton } from '../components/ui'
import { CATEGORY_LABELS } from '../data'
import type { Entry } from '../data/types'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

const ORIGINS = [
  { id: 'all', fr: 'Tout', en: 'All' },
  { id: 'core', fr: 'Essentiel (FR)', en: 'Essentials' },
  { id: 'kolohq', fr: 'KoloHQ', en: 'KoloHQ' },
  { id: 'deedotsherm', fr: 'Glossaires', en: 'Glossaries' },
  { id: 'community', fr: 'Nouveautés', en: 'New' },
  { id: 'fav', fr: '★ Favoris', en: '★ Saved' },
]

export function meaning(e: Entry, lang: 'fr' | 'en') {
  return lang === 'fr' ? e.meaningFr ?? e.meaningEn : e.meaningEn
}

export default function Dictionary() {
  const { t, lang } = useLang()
  const { entries, favorites, showVulgar } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const origin = params.get('o') ?? 'all'
  const cat = params.get('c') ?? ''
  const [limit, setLimit] = useState(60)

  const visible = useMemo(() => entries.filter((e) => showVulgar || e.register !== 'vulgar'), [entries, showVulgar])
  const fuse = useMemo(
    () =>
      new Fuse(visible, {
        keys: [
          { name: 'term', weight: 3 },
          { name: 'variants', weight: 2 },
          { name: 'meaningFr', weight: 1 },
          { name: 'meaningEn', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [visible],
  )

  const results = useMemo(() => {
    let list = q.trim() ? fuse.search(q.trim()).map((r) => r.item) : [...visible].sort((a, b) => (a.origin === 'core' ? 0 : 1) - (b.origin === 'core' ? 0 : 1) || a.term.localeCompare(b.term))
    if (origin === 'fav') list = list.filter((e) => favorites.includes(e.id))
    else if (origin !== 'all') list = list.filter((e) => e.origin === origin)
    if (cat) list = list.filter((e) => e.category === cat)
    return list
  }, [q, fuse, visible, origin, cat, favorites])

  const cats = useMemo(() => [...new Set(visible.map((e) => e.category))].sort(), [visible])
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }

  return (
    <div>
      <PageTitle sub={t({ fr: `${visible.length} entrées — anglais libérien → ${lang === 'fr' ? 'français' : 'anglais'}`, en: `${visible.length} entries — Liberian English → English` })}>
        {t({ fr: 'Dictionnaire', en: 'Dictionary' })}
      </PageTitle>
      <div className="sticky top-0 z-[5] space-y-2 bg-white px-4 pb-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            set('q', e.target.value)
          }}
          placeholder={t({ fr: 'Chercher un mot (koloqua, français ou anglais)…', en: 'Search (Koloqua or English)…' })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-lib-blue"
          type="search"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ORIGINS.map((o) => (
            <button
              key={o.id}
              onClick={() => set('o', o.id === 'all' ? '' : o.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${origin === o.id ? 'bg-lib-blue text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {t(o)}
            </button>
          ))}
        </div>
        <select value={cat} onChange={(e) => set('c', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">{t({ fr: 'Toutes les catégories', en: 'All categories' })}</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c] ? t(CATEGORY_LABELS[c]) : c}
            </option>
          ))}
        </select>
      </div>
      <ul className="divide-y divide-slate-100 px-4">
        {results.slice(0, limit).map((e) => (
          <li key={e.id}>
            <Link to={`/entry/${e.id}`} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {e.term}{' '}
                  {e.register === 'vulgar' && <Badge tone="red">18+</Badge>}
                  {e.register === 'sensitive' && <Badge tone="amber">{t({ fr: 'sensible', en: 'sensitive' })}</Badge>}
                  {e.origin === 'community' && <Badge tone="green">{t({ fr: 'nouveau', en: 'new' })}</Badge>}
                </p>
                <p className="line-clamp-2 text-sm text-slate-600">{meaning(e, lang)}</p>
              </div>
              <SpeakButton text={e.term} small />
            </Link>
          </li>
        ))}
      </ul>
      {results.length > limit && (
        <div className="p-4">
          <button onClick={() => setLimit((l) => l + 60)} className="w-full rounded-xl bg-slate-100 py-3 text-sm font-medium">
            {t({ fr: `Voir plus (${results.length - limit} restants)`, en: `Show more (${results.length - limit} left)` })}
          </button>
        </div>
      )}
      {!results.length && (
        <p className="p-6 text-center text-sm text-slate-500">
          {t({ fr: 'Aucun résultat. Essayez « Demander » pour une recherche en ligne.', en: 'No results. Try "Ask" for an online search.' })}{' '}
          <Link to={`/ask?q=${encodeURIComponent(q)}`} className="text-lib-blue underline">
            {t({ fr: 'Demander', en: 'Ask' })}
          </Link>
        </p>
      )}
    </div>
  )
}
