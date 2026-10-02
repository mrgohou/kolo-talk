import core1 from './core-1.json'
import core2 from './core-2.json'
import kolohq from './generated/kolohq.json'
import deedotsherm from './generated/deedotsherm.json'
import youtube from './generated/youtube.json'
import type { Entry, Source } from './types'

export const SOURCES: Record<string, Source> = {
  common: { name: 'Usage courant (vérifié en contexte)' },
  gina: { name: 'Giant German Gina — Liberian English for Dummies (YouTube)', url: 'https://www.youtube.com/watch?v=jeGXDKyNeLQ' },
  dds: { name: 'Dee Dot Sherm — Liberian English 101', url: 'https://deedotsherm.wordpress.com/2011/02/23/liberian-english-101/' },
  reeds: { name: 'The Reeds in Liberia — Liberian English', url: 'https://reedsinliberia.blogspot.com/2007/10/liberian-english.html' },
  sites: { name: 'Sites of Liberia — Liberian Colloquial (D. K. Norris Jr.)', url: 'https://sitesofliberia.wordpress.com/2012/02/29/liberian-colloquial-the-language-of-our-people-4/' },
  libco: { name: 'Libco — Pronunciation Basics (d\'après Singler 1980)', url: 'https://libco406423561.wordpress.com/pronunciation-basics/' },
  singler: { name: 'J. V. Singler — An Introduction to Liberian English (1981, Peace Corps)', url: 'https://jpcliberia.wordpress.com/wp-content/uploads/2012/02/an-introduction-to-liberian-english.pdf' },
  kolo: { name: 'KoloHQ — Koloqua Dictionary', url: 'https://kolohq.lovable.app/' },
  youtube: { name: 'YouTube (Liberian music channels)' },
}

type RawCore = Omit<Entry, 'sources'> & { src: string[] }

const core: Entry[] = ([...core1, ...core2] as RawCore[]).map(({ src, ...e }) => ({
  ...e,
  origin: 'core',
  sources: src.map((k) => SOURCES[k]).filter(Boolean),
}))

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const coreTerms = new Set(core.flatMap((e) => [e.term, ...(e.variants ?? [])].map(norm)))

const external: Entry[] = [
  ...(deedotsherm as Entry[]).map((e) => ({ ...e, origin: 'deedotsherm' as const })),
  ...(kolohq as Entry[]).map((e) => ({ ...e, origin: 'kolohq' as const })),
].filter((e) => !coreTerms.has(norm(e.term)))

export const baseEntries: Entry[] = [...core, ...external]

export const videos = youtube as { id: string; title: string; channel: string; views: number; query: string; url: string }[]

export const CATEGORIES = [
  'greetings', 'people', 'grammar', 'expressions', 'transport', 'places', 'food', 'money',
  'everyday', 'feelings', 'exclamations', 'slang', 'culture', 'music', 'proverb',
  'word', 'phrase', 'expression', 'idiom', 'parable',
] as const

export const CATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
  greetings: { fr: 'Salutations', en: 'Greetings' },
  people: { fr: 'Personnes', en: 'People' },
  grammar: { fr: 'Grammaire', en: 'Grammar' },
  expressions: { fr: 'Expressions', en: 'Expressions' },
  expression: { fr: 'Expressions (KoloHQ)', en: 'Expressions (KoloHQ)' },
  transport: { fr: 'Transport', en: 'Transport' },
  places: { fr: 'Lieux', en: 'Places' },
  food: { fr: 'Nourriture', en: 'Food' },
  money: { fr: 'Argent', en: 'Money' },
  everyday: { fr: 'Quotidien', en: 'Everyday' },
  feelings: { fr: 'Émotions', en: 'Feelings' },
  exclamations: { fr: 'Exclamations', en: 'Exclamations' },
  slang: { fr: 'Argot', en: 'Slang' },
  culture: { fr: 'Culture', en: 'Culture' },
  music: { fr: 'Musique', en: 'Music' },
  proverb: { fr: 'Proverbes', en: 'Proverbs' },
  parable: { fr: 'Paraboles', en: 'Parables' },
  word: { fr: 'Mots', en: 'Words' },
  phrase: { fr: 'Phrases', en: 'Phrases' },
  idiom: { fr: 'Idiomes', en: 'Idioms' },
}
