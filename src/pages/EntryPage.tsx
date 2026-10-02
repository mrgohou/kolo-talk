import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Card, SpeakButton } from '../components/ui'
import { CATEGORY_LABELS } from '../data'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'
import { useEffect, useState } from 'react'

export default function EntryPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, lang } = useLang()
  const { entries, favorites, toggleFavorite } = useStore()
  const e = entries.find((x) => x.id === id)
  const [fr, setFr] = useState<string | null>(null)

  useEffect(() => {
    setFr(null)
    if (!e || e.meaningFr || lang !== 'fr') return
    fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ term: e.term, text: e.meaningEn }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.fr && setFr(d.fr))
      .catch(() => {})
  }, [e, lang])

  if (!e) return <p className="p-6">{t({ fr: 'Entrée introuvable.', en: 'Entry not found.' })}</p>
  const fav = favorites.includes(e.id)
  const ttsText = e.say && !/[ẽ]/.test(e.say) ? e.say.replace(/\//g, ',') : e.term

  return (
    <div className="space-y-4 p-4">
      <button onClick={() => nav(-1)} className="text-sm text-lib-blue">← {t({ fr: 'Retour', en: 'Back' })}</button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{e.term}</h1>
          {e.variants?.length ? <p className="text-sm text-slate-500">{t({ fr: 'Variantes', en: 'Variants' })} : {e.variants.join(' · ')}</p> : null}
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone="blue">{CATEGORY_LABELS[e.category] ? t(CATEGORY_LABELS[e.category]) : e.category}</Badge>
            {e.pos && <Badge>{e.pos}</Badge>}
            {e.region && <Badge>{e.region}</Badge>}
            {e.register === 'vulgar' && <Badge tone="red">18+</Badge>}
            {e.register === 'sensitive' && <Badge tone="amber">{t({ fr: 'Sensible', en: 'Sensitive' })}</Badge>}
            {e.register === 'slang' && <Badge>{t({ fr: 'Argot', en: 'Slang' })}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <SpeakButton text={ttsText} />
          <button onClick={() => toggleFavorite(e.id)} className="h-9 w-9 rounded-full bg-amber-50 text-lg" aria-label="favorite">
            {fav ? '★' : '☆'}
          </button>
        </div>
      </div>

      {e.say && (
        <Card className="bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase">{t({ fr: 'Prononciation', en: 'Pronunciation' })}</p>
          <p className="mt-1 font-mono text-lg">{e.say}</p>
          {e.pronunciation && <p className="mt-1 text-sm text-slate-600">{e.pronunciation}</p>}
        </Card>
      )}

      <Card>
        <p className="text-xs font-semibold text-slate-500 uppercase">{t({ fr: 'Sens', en: 'Meaning' })}</p>
        {lang === 'fr' && (e.meaningFr || fr) && <p className="mt-1 text-base">{e.meaningFr ?? fr}{!e.meaningFr && <span className="ml-1 text-xs text-slate-400">(traduction auto)</span>}</p>}
        <p className={`mt-1 ${lang === 'fr' && (e.meaningFr || fr) ? 'text-sm text-slate-500' : 'text-base'}`}>{e.meaningEn}</p>
      </Card>

      {e.examples?.length ? (
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase">{t({ fr: 'Exemples', en: 'Examples' })}</p>
          <ul className="mt-2 space-y-3">
            {e.examples.map((x) => (
              <li key={x.lr} className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">« {x.lr} »</p>
                  <p className="text-sm text-slate-600">{lang === 'fr' ? x.fr : x.en}</p>
                </div>
                <SpeakButton text={x.lr} small />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {e.culture && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-800 uppercase">{t({ fr: 'Note culturelle', en: 'Cultural note' })}</p>
          <p className="mt-1 text-sm">{e.culture}</p>
        </Card>
      )}

      <div className="text-xs text-slate-500">
        <p className="font-semibold">{t({ fr: 'Sources', en: 'Sources' })}</p>
        <ul className="mt-1 list-disc pl-4">
          {e.sources.map((s) => (
            <li key={s.name}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.name}</a> : s.name}</li>
          ))}
        </ul>
      </div>
      <Link to={`/ask?q=${encodeURIComponent(`What does "${e.term}" mean in Liberian English?`)}`} className="block rounded-xl bg-slate-100 py-3 text-center text-sm">
        🔎 {t({ fr: 'En savoir plus (IA + Google)', en: 'Learn more (AI + Google)' })}
      </Link>
    </div>
  )
}
