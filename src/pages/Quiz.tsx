import { useMemo, useState } from 'react'
import { Card, PageTitle, SpeakButton } from '../components/ui'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

export default function Quiz() {
  const { t, lang } = useLang()
  const { entries } = useStore()
  const pool = useMemo(() => entries.filter((e) => e.origin === 'core' && e.register !== 'vulgar'), [entries])
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState({ ok: 0, total: 0 })

  const q = useMemo(() => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const answer = shuffled[0]
    const options = shuffled.slice(0, 4).sort(() => Math.random() - 0.5)
    return { answer, options }
  }, [pool, round]) // eslint-disable-line react-hooks/exhaustive-deps

  const label = (id: string) => {
    const e = pool.find((x) => x.id === id)!
    return lang === 'fr' ? e.meaningFr ?? e.meaningEn : e.meaningEn
  }

  return (
    <div>
      <PageTitle sub={`${score.ok}/${score.total}`}>{t({ fr: 'Quiz express', en: 'Quick quiz' })}</PageTitle>
      <div className="space-y-3 p-4">
        <Card className="flex items-center justify-between">
          <p className="text-xl font-bold">{q.answer.term}</p>
          <SpeakButton text={q.answer.term} />
        </Card>
        {q.options.map((o) => {
          const state = picked === null ? '' : o.id === q.answer.id ? 'border-green-500 bg-green-50' : o.id === picked ? 'border-red-400 bg-red-50' : 'opacity-50'
          return (
            <button
              key={o.id}
              disabled={picked !== null}
              onClick={() => {
                setPicked(o.id)
                setScore((s) => ({ ok: s.ok + (o.id === q.answer.id ? 1 : 0), total: s.total + 1 }))
              }}
              className={`block w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm ${state}`}
            >
              {label(o.id)}
            </button>
          )
        })}
        {picked && (
          <button onClick={() => { setPicked(null); setRound((r) => r + 1) }} className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white">
            {t({ fr: 'Suivant →', en: 'Next →' })}
          </button>
        )}
      </div>
    </div>
  )
}
