import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { env } from './config'
import { groundedSearch, hasGemini } from './gemini'

const run = promisify(execFile)

export interface ContentItem {
  key: string
  platform: 'youtube' | 'tiktok' | 'kolohq' | 'google'
  title: string
  url: string
  author?: string
  text: string
  /** Items that are already structured dictionary entries skip the AI extraction step. */
  structured?: { term: string; meaningEn: string; category?: string; example?: string }
}

type Log = (s: string) => void

async function hasYtDlp() {
  try {
    await run('yt-dlp', ['--version'])
    return true
  } catch {
    return false
  }
}

function cleanVtt(vtt: string) {
  const out: string[] = []
  for (const line of vtt.split('\n')) {
    if (!line.trim() || line.includes('-->') || /^(WEBVTT|Kind:|Language:)/.test(line)) continue
    const l = line.replace(/<[^>]+>/g, '').trim()
    if (l && out[out.length - 1] !== l) out.push(l)
  }
  return out.join(' ')
}

async function youtubeViaApi(query: string, max: number): Promise<ContentItem[]> {
  const u = new URL('https://www.googleapis.com/youtube/v3/search')
  u.search = new URLSearchParams({ part: 'snippet', q: query, type: 'video', maxResults: String(max), order: 'date', key: env.youtubeKey }).toString()
  const r = await fetch(u)
  if (!r.ok) throw new Error(`YouTube API ${r.status}`)
  const d = (await r.json()) as { items: { id: { videoId: string }; snippet: { title: string; description: string; channelTitle: string } }[] }
  return d.items.map((i) => ({
    key: `yt:${i.id.videoId}`,
    platform: 'youtube',
    title: i.snippet.title,
    url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
    author: i.snippet.channelTitle,
    text: `${i.snippet.title}\n${i.snippet.description}`,
  }))
}

async function youtubeViaYtDlp(query: string, max: number): Promise<ContentItem[]> {
  const { stdout } = await run('yt-dlp', ['--flat-playlist', '-J', `ytsearch${max}:${query}`], { maxBuffer: 20e6, timeout: 60000 })
  const d = JSON.parse(stdout) as { entries: { id: string; title: string; channel?: string; description?: string }[] }
  return d.entries.map((e) => ({
    key: `yt:${e.id}`,
    platform: 'youtube',
    title: e.title,
    url: `https://www.youtube.com/watch?v=${e.id}`,
    author: e.channel,
    text: `${e.title}\n${e.description ?? ''}`,
  }))
}

/** Adds auto/manual English captions to a YouTube item when yt-dlp is available. */
export async function addTranscript(item: ContentItem): Promise<ContentItem> {
  if (item.platform !== 'youtube' || !(await hasYtDlp())) return item
  try {
    const { stdout } = await run('yt-dlp', ['-J', '--skip-download', item.url], { maxBuffer: 50e6, timeout: 60000 })
    const info = JSON.parse(stdout) as {
      description?: string
      subtitles?: Record<string, { ext: string; url: string }[]>
      automatic_captions?: Record<string, { ext: string; url: string }[]>
    }
    const pick = (m?: Record<string, { ext: string; url: string }[]>) => {
      const k = m && Object.keys(m).find((l) => l.startsWith('en'))
      return k ? m![k].find((f) => f.ext === 'vtt') : undefined
    }
    const sub = pick(info.subtitles) ?? pick(info.automatic_captions)
    let transcript = ''
    if (sub) transcript = cleanVtt(await (await fetch(sub.url)).text())
    return { ...item, text: `${item.title}\n${info.description ?? ''}\n\nTRANSCRIPT:\n${transcript}` }
  } catch {
    return item
  }
}

export async function searchYouTube(queries: string[], log: Log): Promise<ContentItem[]> {
  const useApi = Boolean(env.youtubeKey)
  if (!useApi && !(await hasYtDlp())) {
    log('YouTube: no YOUTUBE_API_KEY and yt-dlp not installed, skipped')
    return []
  }
  const out: ContentItem[] = []
  for (const q of queries) {
    try {
      const items = useApi ? await youtubeViaApi(q, env.maxPerSource) : await youtubeViaYtDlp(q, env.maxPerSource)
      log(`YouTube "${q}": ${items.length} videos`)
      out.push(...items)
    } catch (e) {
      log(`YouTube "${q}" failed: ${(e as Error).message}`)
    }
  }
  return out
}

/**
 * TikTok has no public search endpoint. Two supported options:
 * - TikTok Research API (TIKTOK_CLIENT_KEY/SECRET, academic/approved access) — video/query by keyword;
 * - an Apify TikTok scraper actor (APIFY_TOKEN) as a fallback.
 * Without credentials we fall back to Google-grounded discovery of public TikTok posts.
 */
export async function searchTikTok(queries: string[], log: Log): Promise<ContentItem[]> {
  if (env.tiktokClientKey && env.tiktokClientSecret) {
    try {
      const tok = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_key: env.tiktokClientKey, client_secret: env.tiktokClientSecret, grant_type: 'client_credentials' }),
      }).then((r) => r.json() as Promise<{ access_token: string }>)
      const end = new Date()
      const start = new Date(end.getTime() - 30 * 86400000)
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
      const out: ContentItem[] = []
      for (const q of queries) {
        const r = await fetch('https://open.tiktokapis.com/v2/research/video/query/?fields=id,video_description,username,voice_to_text,hashtag_names', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: { and: [{ operation: 'IN', field_name: 'keyword', field_values: [q] }] }, start_date: fmt(start), end_date: fmt(end), max_count: env.maxPerSource }),
        })
        const d = (await r.json()) as { data?: { videos?: { id: string; video_description: string; username: string; voice_to_text?: string }[] } }
        const vids = d.data?.videos ?? []
        log(`TikTok Research "${q}": ${vids.length} videos`)
        out.push(...vids.map((v) => ({
          key: `tt:${v.id}`,
          platform: 'tiktok' as const,
          title: v.video_description.slice(0, 100),
          url: `https://www.tiktok.com/@${v.username}/video/${v.id}`,
          author: v.username,
          text: `${v.video_description}\n${v.voice_to_text ?? ''}`,
        })))
      }
      return out
    } catch (e) {
      log(`TikTok Research API failed: ${(e as Error).message}`)
    }
  }
  if (env.apifyToken) {
    try {
      const r = await fetch(`https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${env.apifyToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQueries: queries, resultsPerPage: env.maxPerSource, shouldDownloadVideos: false }),
      })
      const items = (await r.json()) as { id: string; text: string; webVideoUrl: string; authorMeta?: { name: string } }[]
      log(`TikTok (Apify): ${items.length} videos`)
      return items.map((v) => ({ key: `tt:${v.id}`, platform: 'tiktok', title: v.text.slice(0, 100), url: v.webVideoUrl, author: v.authorMeta?.name, text: v.text }))
    } catch (e) {
      log(`TikTok (Apify) failed: ${(e as Error).message}`)
    }
  }
  if (hasGemini()) {
    try {
      const g = await groundedSearch(
        `Search the web for recent public TikTok videos and accounts teaching or using Liberian English / Koloqua (keywords: ${queries.join(', ')}). ` +
          'List the creators, what each video teaches, and quote every Koloqua word or phrase with its meaning.',
      )
      log(`TikTok via Google Search: ${g.sources.length} sources`)
      return [{ key: `tt-google:${new Date().toISOString().slice(0, 10)}`, platform: 'tiktok', title: 'TikTok creators (Google Search)', url: g.sources[0]?.uri ?? 'https://www.tiktok.com/tag/koloqua', text: g.text }]
    } catch (e) {
      log(`TikTok via Google failed: ${(e as Error).message}`)
    }
  }
  log('TikTok: no TIKTOK_CLIENT_KEY / APIFY_TOKEN / GEMINI_API_KEY, skipped')
  return []
}

/** KoloHQ public API (attribution required, 100 req/h anonymous). */
export async function searchKoloHQ(log: Log): Promise<ContentItem[]> {
  const out: ContentItem[] = []
  try {
    for (let page = 1; page <= 10; page++) {
      const r = await fetch(`https://kolohq.lovable.app/api/v1/words?limit=100&page=${page}`)
      if (!r.ok) break
      const d = (await r.json()) as { data: { id: string; word: string; definition: string; category?: string }[] }
      if (!d.data?.length) break
      out.push(...d.data.map((w) => ({
        key: `kolo:${w.id}`,
        platform: 'kolohq' as const,
        title: w.word,
        url: `https://kolohq.lovable.app/entry/${w.id}`,
        author: 'KoloHQ — Koloqua Dictionary',
        text: w.definition,
        structured: { term: w.word, meaningEn: w.definition, category: w.category },
      })))
      if (d.data.length < 100) break
    }
    log(`KoloHQ: ${out.length} entries checked`)
  } catch (e) {
    log(`KoloHQ failed: ${(e as Error).message}`)
  }
  return out
}

/** Google-grounded discovery of new slang, song lyrics explanations and articles. */
export async function searchGoogle(accounts: string[], log: Log): Promise<ContentItem[]> {
  if (!hasGemini()) {
    log('Google Search: no GEMINI_API_KEY, skipped')
    return []
  }
  const prompts = [
    'Find recent articles, posts or videos (last 12 months) explaining new Liberian English / Koloqua slang. Quote each slang term and its meaning.',
    `Find explanations of Koloqua words and phrases used in recent songs or videos by these Liberian artists and influencers: ${accounts.join(', ')}. Quote each phrase and its meaning.`,
  ]
  const out: ContentItem[] = []
  for (const p of prompts) {
    try {
      const g = await groundedSearch(p)
      log(`Google Search: ${g.sources.length} sources`)
      out.push({ key: `google:${p.slice(0, 30)}:${new Date().toISOString().slice(0, 10)}`, platform: 'google', title: g.queries[0] ?? 'Google Search', url: g.sources[0]?.uri ?? '', text: g.text })
    } catch (e) {
      log(`Google Search failed: ${(e as Error).message}`)
    }
  }
  return out
}
