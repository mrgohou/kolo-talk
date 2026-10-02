import { GoogleGenAI } from '@google/genai'
import { env } from './config'

let client: GoogleGenAI | null = null
export const hasGemini = () => Boolean(env.geminiKey)
const ai = () => (client ??= new GoogleGenAI({ apiKey: env.geminiKey }))

const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']
const models = () => [...new Set([env.geminiModel, ...FALLBACK_MODELS])]
const status = (e: unknown) => Number(String((e as Error).message).match(/"code":\s*(\d{3})/)?.[1] ?? 0)

/** Calls Gemini, retrying transient 5xx errors and falling back to lighter models when one is overloaded. */
async function generate(params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>) {
  let last: unknown
  for (const model of models()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai().models.generateContent({ ...params, model })
      } catch (e) {
        last = e
        const code = status(e)
        if (code === 429 || code === 404) break
        if (code < 500) throw e
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      }
    }
  }
  throw last
}

export interface Extracted {
  term: string
  meaningEn: string
  meaningFr?: string
  example?: string
  say?: string
  register?: string
  category?: string
  confidence: number
}

const EXTRACT_PROMPT = `You are a linguist specialised in Liberian English (Koloqua / Kolokwa).
From the CONTENT below (a video transcript, description, caption or lyrics), extract Liberian English words, expressions,
proverbs or slang that a non-Liberian visitor would need explained. Ignore standard English, names and song titles unless they are Koloqua.
Return ONLY a JSON array (max 15 items) of objects:
{"term": string, "meaningEn": string, "meaningFr": string (French translation of the meaning), "example": string (a Koloqua sentence using it, ideally from the content),
 "say": string (simple phonetic respelling, e.g. "how dah BAH-dee"), "register": "neutral"|"informal"|"slang"|"vulgar"|"sensitive",
 "category": one of greetings, people, grammar, expressions, transport, places, food, money, everyday, feelings, exclamations, slang, culture, music, proverb,
 "confidence": number 0..1 (how sure you are this is genuine Liberian English with this meaning)}.
Exclude anything already in KNOWN.`

function parseJsonArray(text: string): unknown[] {
  const m = text.match(/\[[\s\S]*\]/)
  if (!m) return []
  try {
    return JSON.parse(m[0])
  } catch {
    return []
  }
}

export async function extractExpressions(content: string, known: string[]): Promise<Extracted[]> {
  const res = await generate({
    contents: `${EXTRACT_PROMPT}\n\nKNOWN: ${known.slice(0, 400).join(', ')}\n\nCONTENT:\n${content.slice(0, 20000)}`,
    config: { responseMimeType: 'application/json', temperature: 0.2 },
  })
  return (parseJsonArray(res.text ?? '') as Extracted[]).filter((x) => x && x.term && x.meaningEn)
}

export interface Grounded {
  text: string
  sources: { title: string; uri: string }[]
  queries: string[]
  grounded: boolean
}

/**
 * Gemini answer grounded with real-time Google Search results.
 * Google Search grounding needs a billing-enabled key; when its quota is unavailable we answer
 * from the model alone (grounded: false) unless `requireGrounding` is set.
 */
export async function groundedSearch(prompt: string, requireGrounding = false): Promise<Grounded> {
  try {
    const res = await generate({ contents: prompt, config: { tools: [{ googleSearch: {} }], temperature: 0.3 } })
    const meta = res.candidates?.[0]?.groundingMetadata
    const sources = (meta?.groundingChunks ?? [])
      .map((c) => ({ title: c.web?.title ?? c.web?.uri ?? '', uri: c.web?.uri ?? '' }))
      .filter((s) => s.uri)
    return { text: res.text ?? '', sources, queries: meta?.webSearchQueries ?? [], grounded: true }
  } catch (e) {
    if (requireGrounding || status(e) !== 429) throw e
    const res = await generate({ contents: prompt, config: { temperature: 0.3 } })
    return { text: res.text ?? '', sources: [], queries: [], grounded: false }
  }
}

export async function translateToFrench(term: string, text: string): Promise<string> {
  const res = await generate({
    contents: `Translate this English definition of the Liberian English term "${term}" into natural French. Reply with the translation only.\n\n${text}`,
    config: { temperature: 0.1 },
  })
  return (res.text ?? '').trim()
}
