export type Register = 'neutral' | 'informal' | 'slang' | 'vulgar' | 'sensitive'

export interface Source {
  name: string
  url?: string
}

export interface Example {
  lr: string
  en: string
  fr: string
}

export interface Entry {
  id: string
  term: string
  variants?: string[]
  pos?: string | null
  meaningEn: string
  meaningFr?: string
  examples?: Example[]
  /** Phonetic respelling used for text-to-speech and as a reading aid. */
  say?: string
  pronunciation?: string
  culture?: string
  category: string
  region?: string | null
  register?: Register
  sources: Source[]
  origin?: 'core' | 'kolohq' | 'deedotsherm' | 'community'
}

export interface DialogueLine {
  speaker: string
  lr: string
  say?: string
  en: string
  fr: string
  note?: string
}

export type Exercise =
  | { type: 'choice'; prompt: { fr: string; en: string }; question: string; options: string[]; answer: number; explain?: { fr: string; en: string } }
  | { type: 'speak'; lr: string; say?: string; fr: string; en: string }
  | { type: 'listen'; lr: string; say?: string; options: string[]; answer: number }
  | { type: 'order'; fr: string; en: string; words: string[] }

export interface ConversationModule {
  id: string
  icon: string
  title: { fr: string; en: string }
  situation: { fr: string; en: string }
  level: 1 | 2 | 3
  keyPhrases: { lr: string; say?: string; fr: string; en: string }[]
  dialogue: DialogueLine[]
  culture: { fr: string; en: string }[]
  exercises: Exercise[]
  videos?: { title: string; url: string }[]
}
