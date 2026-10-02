import { GoogleGenAI } from '@google/genai'
import { env } from './config'

let client: GoogleGenAI | null = null
export const hasGemini = () => Boolean(env.geminiKey)
const ai = () => (client ??= new GoogleGenAI({ apiKey: env.geminiKey }))

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
  const res = await ai().models.generateContent({
    model: env.geminiModel,
    contents: `${EXTRACT_PROMPT}\n\nKNOWN: ${known.slice(0, 400).join(', ')}\n\nCONTENT:\n${content.slice(0, 20000)}`,
    config: { responseMimeType: 'application/json', temperature: 0.2 },
  })
  return (parseJsonArray(res.text ?? '') as Extracted[]).filter((x) => x && x.term && x.meaningEn)
}

export interface Grounded {
  text: string
  sources: { title: string; uri: string }[]
  queries: string[]
}

/** Gemini answer grounded with real-time Google Search results. */
export async function groundedSearch(prompt: string): Promise<Grounded> {
  const res = await ai().models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }], temperature: 0.3 },
  })
  const meta = res.candidates?.[0]?.groundingMetadata
  const sources = (meta?.groundingChunks ?? [])
    .map((c) => ({ title: c.web?.title ?? c.web?.uri ?? '', uri: c.web?.uri ?? '' }))
    .filter((s) => s.uri)
  return { text: res.text ?? '', sources, queries: meta?.webSearchQueries ?? [] }
}

export async function translateToFrench(term: string, text: string): Promise<string> {
  const res = await ai().models.generateContent({
    model: env.geminiModel,
    contents: `Translate this English definition of the Liberian English term "${term}" into natural French. Reply with the translation only.\n\n${text}`,
    config: { temperature: 0.1 },
  })
  return (res.text ?? '').trim()
}
