const PREFERRED = ['en-LR', 'en-NG', 'en-GH', 'en-KE', 'en-ZA', 'en-GB', 'en-US']

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? []
  for (const lang of PREFERRED) {
    const v = voices.find((x) => x.lang.replace('_', '-') === lang)
    if (v) return v
  }
  return voices.find((v) => v.lang.startsWith('en'))
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Speaks Liberian English using the best available English voice; `say` (phonetic respelling) is preferred when given. */
export function speak(text: string, opts: { rate?: number } = {}) {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/[A-Z]{2,}/g, (m) => m.toLowerCase()))
  const v = pickVoice()
  if (v) {
    u.voice = v
    u.lang = v.lang
  }
  u.rate = opts.rate ?? 0.85
  window.speechSynthesis.speak(u)
}

type Recognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void
  onerror: (e: { error: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
}

export const canListen = () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, new () => Recognition>
    const R = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!R) return reject(new Error('unsupported'))
    const r = new R()
    r.lang = 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1
    let done = false
    r.onresult = (e) => {
      done = true
      resolve(e.results[0][0].transcript)
    }
    r.onerror = (e) => reject(new Error(e.error))
    r.onend = () => {
      if (!done) reject(new Error('no-speech'))
    }
    r.start()
  })
}

const LIB_TO_STD: Record<string, string> = {
  de: 'the', da: 'the', dat: 'that', dis: 'this', dem: 'them', deh: 'they', na: 'not', geh: 'get', gimme: 'give me',
  lemme: 'let me', leh: 'let', tank: 'thank', wetin: 'what', ya: '', yah: '', o: '', mouf: 'mouth', yaw: 'your', yor: 'your',
}

const tokens = (s: string) =>
  s.toLowerCase().replace(/-o\b/g, '').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean)
    .flatMap((w) => (LIB_TO_STD[w] ?? w).split(' ')).filter(Boolean)

/** Rough 0..1 score of how close a recognised transcript is to the target phrase. */
export function similarity(target: string, heard: string): number {
  const a = tokens(target)
  const b = new Set(tokens(heard))
  if (!a.length) return 0
  const hit = a.filter((w) => b.has(w) || [...b].some((x) => x.startsWith(w.slice(0, 3)) && w.length > 3)).length
  return hit / a.length
}
