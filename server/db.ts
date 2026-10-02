import fs from 'node:fs'
import path from 'node:path'

export interface Candidate {
  id: string
  term: string
  meaningEn: string
  meaningFr?: string
  example?: string
  say?: string
  register?: string
  category?: string
  confidence: number
  status: 'pending' | 'approved' | 'rejected'
  source: { platform: string; title: string; url: string; author?: string }
  createdAt: string
}

export interface Run {
  id: string
  startedAt: string
  finishedAt?: string
  log: string[]
  found: number
  added: number
}

export interface Discovered {
  key: string
  platform: string
  title: string
  url: string
  author?: string
  foundAt: string
}

interface Data {
  candidates: Candidate[]
  discovered: Discovered[]
  runs: Run[]
  seenContent: string[]
}

const FILE = path.resolve(process.env.DATA_FILE ?? 'data/enrichment.json')

function load(): Data {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Data
    d.discovered ??= []
    return d
  } catch {
    return { candidates: [], discovered: [], runs: [], seenContent: [] }
  }
}

export const db: Data = load()

export function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  const tmp = FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 1))
  fs.renameSync(tmp, FILE)
}

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
