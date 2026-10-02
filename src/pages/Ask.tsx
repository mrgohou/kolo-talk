import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, PageTitle } from '../components/ui'
import { useLang } from '../lib/i18n'

interface Answer {
  text: string
  sources: { title: string; uri: string }[]
  queries?: string[]
}

export default function Ask() {
  const { t, lang } = useLang()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')

  const ask = async () => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setAnswer(null)
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, lang }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || r.statusText)
      setAnswer(d)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageTitle sub={t({ fr: 'Posez une question sur une expression, un accent, une chanson ou l\'actualité au Liberia. Réponses sourcées via Google Search.', en: 'Ask about an expression, accent, song or current events in Liberia. Answers grounded with Google Search.' })}>
        {t({ fr: 'Demander', en: 'Ask' })}
      </PageTitle>
      <div className="space-y-3 p-4">
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 p-3" placeholder={t({ fr: 'Ex. : Que veut dire « wleesayma » dans la chanson de Teddyride ?', en: 'E.g. What does "wleesayma" mean in the Teddyride song?' })} />
        <button onClick={ask} disabled={loading} className="w-full rounded-xl bg-lib-blue py-3 font-semibold text-white disabled:opacity-60">
          {loading ? t({ fr: 'Recherche…', en: 'Searching…' }) : t({ fr: 'Demander', en: 'Ask' })}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {answer && (
          <Card>
            <p className="whitespace-pre-wrap text-sm">{answer.text}</p>
            {answer.sources.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2 text-xs">
                <p className="font-semibold text-slate-500">Sources</p>
                <ul className="list-disc pl-4">
                  {answer.sources.map((s) => <li key={s.uri}><a href={s.uri} target="_blank" rel="noreferrer" className="text-lib-blue underline">{s.title}</a></li>)}
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
