import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { ACCOUNTS, KEYWORDS, env } from './config'
import { db, norm, save, type Candidate, type Run } from './db'
import { extractExpressions, hasGemini } from './gemini'
import { addTranscript, searchGoogle, searchKoloHQ, searchTikTok, searchYouTube, type ContentItem } from './sources'

let running = false
export const isRunning = () => running

/** Terms already in the bundled dictionary or the moderation queue, used for de-duplication. */
function knownTerms(): Set<string> {
  const set = new Set<string>()
  const dir = path.resolve('src/data')
  for (const f of ['core-1.json', 'core-2.json', 'generated/kolohq.json', 'generated/deedotsherm.json']) {
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as { term: string; variants?: string[] }[]
      for (const e of arr) for (const t of [e.term, ...(e.variants ?? [])]) set.add(norm(t))
    } catch {
      /* file optional */
    }
  }
  for (const c of db.candidates) set.add(norm(c.term))
  return set
}

export async function runEnrichment(): Promise<Run> {
  if (running) throw new Error('already running')
  running = true
  const r: Run = { id: randomUUID(), startedAt: new Date().toISOString(), log: [], found: 0, added: 0 }
  db.runs.unshift(r)
  db.runs.splice(20)
  const log = (s: string) => {
    r.log.push(`${new Date().toISOString().slice(11, 19)} ${s}`)
    console.log('[enrich]', s)
  }
  try {
    const known = knownTerms()
    const seen = new Set(db.seenContent)
    const accountQueries = ACCOUNTS.map((a) => `${a} Liberia`)
    const batches = await Promise.all([
      searchYouTube([...KEYWORDS, ...accountQueries], log),
      searchTikTok(KEYWORDS.slice(0, 5), log),
      searchKoloHQ(log),
      searchGoogle(ACCOUNTS, log),
    ])
    const fresh = [...new Map(batches.flat().filter((i) => !seen.has(i.key)).map((i) => [i.key, i])).values()]
    r.found = fresh.length
    const have = new Set(db.discovered.map((d) => d.key))
    for (const i of fresh) {
      if ((i.platform === 'youtube' || i.platform === 'tiktok') && !have.has(i.key) && i.url) {
        have.add(i.key)
        db.discovered.unshift({ key: i.key, platform: i.platform, title: i.title, url: i.url, author: i.author, foundAt: new Date().toISOString() })
      }
    }
    db.discovered.splice(500)
    log(`${fresh.length} new content items`)

    const push = (c: Omit<Candidate, 'id' | 'status' | 'createdAt'>) => {
      const k = norm(c.term)
      if (!k || known.has(k)) return
      known.add(k)
      db.candidates.push({ ...c, id: randomUUID(), status: 'pending', createdAt: new Date().toISOString() })
      r.added++
    }

    for (const item of fresh.filter((i) => i.structured)) {
      const s = item.structured!
      push({ term: s.term, meaningEn: s.meaningEn, example: s.example, category: s.category, confidence: 0.8, source: src(item) })
      seen.add(item.key)
    }

    const unstructured = fresh.filter((i) => !i.structured)
    if (!hasGemini()) {
      log(`AI extraction skipped (no GEMINI_API_KEY): ${unstructured.length} items kept for next run`)
    } else {
      for (const raw of unstructured.slice(0, 40)) {
        const item = await addTranscript(raw)
        try {
          const found = await extractExpressions(item.text, [...known].slice(0, 400))
          for (const x of found) push({ ...x, confidence: Number(x.confidence) || 0.5, source: src(item) })
          log(`${item.platform} "${item.title.slice(0, 50)}": ${found.length} expressions`)
          seen.add(item.key)
        } catch (e) {
          log(`extraction failed for ${item.url}: ${(e as Error).message}`)
        }
      }
    }
    db.seenContent = [...seen]
    log(`done: ${r.added} new candidates awaiting moderation`)
  } catch (e) {
    log(`error: ${(e as Error).message}`)
  } finally {
    r.finishedAt = new Date().toISOString()
    running = false
    save()
  }
  return r
}

const src = (i: ContentItem) => ({ platform: i.platform, title: i.title, url: i.url, author: i.author })

export function startScheduler() {
  if (!env.autoIntervalHours) return
  const ms = env.autoIntervalHours * 3600000
  console.log(`[enrich] scheduled every ${env.autoIntervalHours}h`)
  setInterval(() => runEnrichment().catch(() => {}), ms)
}
