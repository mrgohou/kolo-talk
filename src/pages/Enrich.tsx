import { useEffect, useState } from 'react'
import { Badge, Card, PageTitle } from '../components/ui'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

interface Candidate {
  id: string
  term: string
  meaningEn: string
  meaningFr?: string
  example?: string
  say?: string
  register?: string
  confidence: number
  status: 'pending' | 'approved' | 'rejected'
  source: { platform: string; title: string; url: string; author?: string }
  createdAt: string
}

interface Status {
  config: Record<string, boolean>
  keywords: string[]
  accounts: string[]
  runs: { id: string; startedAt: string; finishedAt?: string; log: string[]; found: number; added: number }[]
  counts: { pending: number; approved: number; rejected: number }
  running: boolean
}

export default function Enrich() {
  const { t } = useLang()
  const { refreshCommunity } = useStore()
  const [status, setStatus] = useState<Status | null>(null)
  const [cands, setCands] = useState<Candidate[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [err, setErr] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') ?? '')

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': token }
  const load = async () => {
    try {
      const [s, c] = await Promise.all([fetch('/api/enrich/status').then((r) => r.json()), fetch(`/api/candidates?status=${filter}`).then((r) => r.json())])
      setStatus(s)
      setCands(c.candidates)
      setErr('')
    } catch {
      setErr(t({ fr: "Serveur d'enrichissement injoignable (lancez « npm run dev »).", en: 'Enrichment server unreachable (run "npm run dev").' }))
    }
  }
  useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!status?.running) return
    const i = setInterval(load, 3000)
    return () => clearInterval(i)
  }, [status?.running]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async () => {
    const r = await fetch('/api/enrich/run', { method: 'POST', headers })
    if (!r.ok) setErr((await r.json()).error)
    load()
  }
  const act = async (id: string, action: 'approve' | 'reject') => {
    const r = await fetch(`/api/candidates/${id}/${action}`, { method: 'POST', headers })
    if (!r.ok) return setErr((await r.json()).error)
    setCands((c) => c.filter((x) => x.id !== id))
    refreshCommunity()
    load()
  }

  const last = status?.runs[0]
  return (
    <div>
      <PageTitle sub={t({ fr: "L'app cherche de nouveaux contenus sur YouTube, TikTok, KoloHQ et Google, en extrait les expressions avec l'IA, puis un modérateur les valide.", en: 'The app searches YouTube, TikTok, KoloHQ and Google for new content, extracts expressions with AI, and a moderator validates them.' })}>
        🤖 {t({ fr: 'Auto-apprentissage', en: 'Self-learning' })}
      </PageTitle>
      <div className="space-y-3 p-4">
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        {status && (
          <Card>
            <p className="text-sm font-semibold">{t({ fr: 'Connecteurs', en: 'Connectors' })}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(status.config).map(([k, v]) => <Badge key={k} tone={v ? 'green' : 'slate'}>{v ? '✓' : '✗'} {k}</Badge>)}
            </div>
            <p className="mt-3 text-xs text-slate-500">{t({ fr: 'Mots-clés', en: 'Keywords' })} : {status.keywords.join(' · ')}</p>
            <p className="mt-1 text-xs text-slate-500">{t({ fr: 'Comptes suivis', en: 'Tracked accounts' })} : {status.accounts.join(' · ')}</p>
            <div className="mt-3 flex gap-2">
              <input value={token} onChange={(e) => { setToken(e.target.value); localStorage.setItem('adminToken', e.target.value) }} placeholder="Admin token" type="password" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button onClick={run} disabled={status.running} className="rounded-lg bg-lib-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {status.running ? t({ fr: 'En cours…', en: 'Running…' }) : t({ fr: 'Lancer', en: 'Run now' })}
              </button>
            </div>
            {last && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-slate-600">
                  {t({ fr: 'Dernière exécution', en: 'Last run' })} : {new Date(last.startedAt).toLocaleString()} — {last.found} {t({ fr: 'contenus', en: 'items' })}, {last.added} {t({ fr: 'candidats', en: 'candidates' })}
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-900 p-2 whitespace-pre-wrap text-slate-100">{last.log.join('\n')}</pre>
              </details>
            )}
          </Card>
        )}
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 rounded-full py-1.5 text-xs ${filter === f ? 'bg-lib-blue text-white' : 'bg-slate-100'}`}>
              {{ pending: t({ fr: 'À valider', en: 'Pending' }), approved: t({ fr: 'Validés', en: 'Approved' }), rejected: t({ fr: 'Rejetés', en: 'Rejected' }) }[f]} ({status?.counts[f] ?? 0})
            </button>
          ))}
        </div>
        {cands.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold">{c.term}</p>
              <Badge tone={c.confidence >= 0.7 ? 'green' : c.confidence >= 0.4 ? 'amber' : 'slate'}>{Math.round(c.confidence * 100)}%</Badge>
            </div>
            <p className="text-sm">{c.meaningFr ?? c.meaningEn}</p>
            {c.meaningFr && <p className="text-xs text-slate-500">{c.meaningEn}</p>}
            {c.example && <p className="mt-1 text-sm italic">« {c.example} »</p>}
            <a href={c.source.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-lib-blue underline">
              [{c.source.platform}] {c.source.title}
            </a>
            {c.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => act(c.id, 'approve')} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white">✓ {t({ fr: 'Valider', en: 'Approve' })}</button>
                <button onClick={() => act(c.id, 'reject')} className="flex-1 rounded-lg bg-slate-200 py-2 text-sm">✗ {t({ fr: 'Rejeter', en: 'Reject' })}</button>
              </div>
            )}
          </Card>
        ))}
        {!cands.length && status && <p className="text-center text-sm text-slate-500">{t({ fr: 'Rien ici pour le moment.', en: 'Nothing here yet.' })}</p>}
      </div>
    </div>
  )
}
