import express, { type NextFunction, type Request, type Response } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { ACCOUNTS, KEYWORDS, env } from './config'
import { db, save, type Candidate } from './db'
import { isRunning, runEnrichment, startScheduler } from './enrich'
import { groundedSearch, hasGemini, translateToFrench } from './gemini'

const app = express()
app.use(express.json({ limit: '100kb' }))

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (env.adminToken && req.get('X-Admin-Token') !== env.adminToken) {
    res.status(401).json({ error: 'Admin token invalide / invalid admin token' })
    return
  }
  next()
}

const toEntry = (c: Candidate) => ({
  id: `community-${c.id}`,
  term: c.term,
  meaningEn: c.meaningEn,
  meaningFr: c.meaningFr,
  say: c.say,
  examples: c.example ? [{ lr: c.example, en: '', fr: '' }] : undefined,
  category: c.category ?? 'expressions',
  register: c.register ?? 'informal',
  origin: 'community',
  sources: [{ name: `${c.source.platform}: ${c.source.title}${c.source.author ? ` (${c.source.author})` : ''}`, url: c.source.url }],
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/enrich/status', (_req, res) => {
  const counts = { pending: 0, approved: 0, rejected: 0 }
  for (const c of db.candidates) counts[c.status]++
  res.json({
    config: {
      'Gemini + Google Search': hasGemini(),
      'YouTube API': Boolean(env.youtubeKey),
      'yt-dlp': true,
      'TikTok Research API': Boolean(env.tiktokClientKey),
      'Apify (TikTok)': Boolean(env.apifyToken),
      KoloHQ: true,
      [`Auto (${env.autoIntervalHours || '—'} h)`]: Boolean(env.autoIntervalHours),
    },
    keywords: KEYWORDS,
    accounts: ACCOUNTS,
    runs: db.runs.slice(0, 5),
    counts,
    running: isRunning(),
  })
})

app.post('/api/enrich/run', requireAdmin, (_req, res) => {
  if (isRunning()) {
    res.status(409).json({ error: 'already running' })
    return
  }
  runEnrichment().catch(() => {})
  res.json({ started: true })
})

app.get('/api/candidates', (req, res) => {
  const status = String(req.query.status ?? 'pending')
  res.json({ candidates: db.candidates.filter((c) => c.status === status).slice(-200).reverse() })
})

for (const action of ['approve', 'reject'] as const) {
  app.post(`/api/candidates/:id/${action}`, requireAdmin, (req, res) => {
    const c = db.candidates.find((x) => x.id === req.params.id)
    if (!c) {
      res.status(404).json({ error: 'not found' })
      return
    }
    c.status = action === 'approve' ? 'approved' : 'rejected'
    save()
    res.json({ ok: true })
  })
}

app.get('/api/discovered', (_req, res) => {
  res.json({ items: db.discovered })
})

app.get('/api/approved', (_req, res) => {
  res.json({ entries: db.candidates.filter((c) => c.status === 'approved').map(toEntry) })
})

const SYSTEM = `You are Kolo Talk, a friendly assistant helping non-Liberian visitors understand and speak Liberian English (Koloqua) and navigate daily life in Liberia.
Use Google Search for anything recent (news, events, prices, new songs, slang) and cite facts. When explaining Koloqua, give the meaning, a simple pronunciation,
an example sentence and any cultural nuance. Be concise.`

app.post('/api/ask', async (req, res) => {
  const question = String(req.body?.question ?? '').slice(0, 2000)
  const lang = req.body?.lang === 'en' ? 'English' : 'French'
  if (!question.trim()) {
    res.status(400).json({ error: 'question required' })
    return
  }
  if (!hasGemini()) {
    res.status(503).json({ error: "Assistant non configuré : ajoutez GEMINI_API_KEY côté serveur. / Assistant not configured: set GEMINI_API_KEY on the server." })
    return
  }
  try {
    res.json(await groundedSearch(`${SYSTEM}\nAnswer in ${lang}.\n\nQuestion: ${question}`))
  } catch (e) {
    res.status(502).json({ error: (e as Error).message })
  }
})

const frCache = new Map<string, string>()
app.post('/api/translate', async (req, res) => {
  const term = String(req.body?.term ?? '').slice(0, 200)
  const text = String(req.body?.text ?? '').slice(0, 1000)
  if (!hasGemini() || !text) {
    res.status(503).json({ error: 'unavailable' })
    return
  }
  const key = `${term}|${text}`
  try {
    if (!frCache.has(key)) frCache.set(key, await translateToFrench(term, text))
    res.json({ fr: frCache.get(key) })
  } catch (e) {
    res.status(502).json({ error: (e as Error).message })
  }
})

const dist = path.resolve('dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(env.port, () => {
  console.log(`Kolo Talk API on http://localhost:${env.port} (Gemini: ${hasGemini() ? 'on' : 'off'})`)
  startScheduler()
})
