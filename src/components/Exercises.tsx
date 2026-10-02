import { useMemo, useState } from 'react'
import type { ConversationModule, Exercise } from '../data/types'
import { useLang } from '../lib/i18n'
import { canListen, listen, similarity, speak } from '../lib/speech'
import { useStore } from '../lib/store'
import { Card } from './ui'

function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

function Choice({ ex, onDone }: { ex: Extract<Exercise, { type: 'choice' | 'listen' }>; onDone: (ok: boolean) => void }) {
  const { t } = useLang()
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div className="space-y-3">
      {ex.type === 'choice' ? (
        <p className="font-semibold">{t(ex.prompt)}</p>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={() => speak(ex.lr)} className="h-14 w-14 rounded-full bg-lib-blue text-2xl text-white">🔊</button>
          <p className="font-semibold">{t({ fr: 'Écoutez et choisissez le sens', en: 'Listen and pick the meaning' })}</p>
        </div>
      )}
      {ex.options.map((o, i) => {
        const state = picked === null ? '' : i === ex.answer ? 'border-green-500 bg-green-50' : i === picked ? 'border-red-400 bg-red-50' : 'opacity-60'
        return (
          <button
            key={o}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i)
              onDone(i === ex.answer)
            }}
            className={`block w-full rounded-xl border border-slate-200 px-4 py-3 text-left ${state}`}
          >
            {o}
          </button>
        )
      })}
      {picked !== null && ex.type === 'listen' && <p className="text-sm text-slate-500">« {ex.lr} »</p>}
    </div>
  )
}

function Speak({ ex, onDone }: { ex: Extract<Exercise, { type: 'speak' }>; onDone: (ok: boolean) => void }) {
  const { t } = useLang()
  const [state, setState] = useState<'idle' | 'listening' | 'done' | 'error'>('idle')
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState(0)
  const go = async () => {
    setState('listening')
    try {
      const h = await listen()
      const s = similarity(ex.lr, h)
      setHeard(h)
      setScore(s)
      setState('done')
      onDone(s >= 0.6)
    } catch {
      setState('error')
    }
  }
  return (
    <div className="space-y-3">
      <p className="font-semibold">{t({ fr: 'Dites à voix haute :', en: 'Say out loud:' })}</p>
      <Card className="flex items-center justify-between gap-2 bg-slate-50">
        <div>
          <p className="text-lg font-bold">{ex.lr}</p>
          <p className="text-sm text-slate-500">{t({ fr: ex.fr, en: ex.en })}</p>
        </div>
        <button onClick={() => speak(ex.lr)} className="h-10 w-10 rounded-full bg-lib-blue/10">🔊</button>
      </Card>
      {canListen() ? (
        <button onClick={go} disabled={state === 'listening'} className={`w-full rounded-xl py-4 font-semibold text-white ${state === 'listening' ? 'animate-pulse bg-lib-red' : 'bg-lib-blue'}`}>
          🎤 {state === 'listening' ? t({ fr: 'Je vous écoute…', en: 'Listening…' }) : t({ fr: 'Appuyez et parlez', en: 'Tap and speak' })}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">{t({ fr: "La reconnaissance vocale n'est pas disponible sur ce navigateur (essayez Chrome). Répétez après l'audio puis validez :", en: 'Speech recognition unavailable (try Chrome). Repeat after the audio, then confirm:' })}</p>
          <button onClick={() => onDone(true)} className="w-full rounded-xl bg-slate-100 py-3">✓ {t({ fr: "Je l'ai dit", en: 'I said it' })}</button>
        </div>
      )}
      {state === 'done' && (
        <p className={`text-sm ${score >= 0.6 ? 'text-green-700' : 'text-amber-700'}`}>
          {t({ fr: 'Entendu', en: 'Heard' })} : « {heard} » — {Math.round(score * 100)} %{' '}
          {score >= 0.6 ? '👍 Correct!' : t({ fr: 'Réessayez en articulant les mots clés.', en: 'Try again, stressing key words.' })}
        </p>
      )}
      {state === 'error' && <p className="text-sm text-red-600">{t({ fr: "Micro indisponible ou rien entendu. Réessayez.", en: 'Mic unavailable or nothing heard. Try again.' })}</p>}
    </div>
  )
}

function Order({ ex, onDone }: { ex: Extract<Exercise, { type: 'order' }>; onDone: (ok: boolean) => void }) {
  const { t } = useLang()
  const pool = useMemo(() => shuffle(ex.words.map((w, i) => ({ w, i }))), [ex])
  const [picked, setPicked] = useState<{ w: string; i: number }[]>([])
  const [checked, setChecked] = useState<boolean | null>(null)
  const remaining = pool.filter((p) => !picked.includes(p))
  return (
    <div className="space-y-3">
      <p className="font-semibold">{t({ fr: 'Remettez dans l\'ordre :', en: 'Put in order:' })} <span className="font-normal text-slate-600">« {t({ fr: ex.fr, en: ex.en })} »</span></p>
      <div className="min-h-12 rounded-xl border-2 border-dashed border-slate-300 p-2">
        {picked.map((p) => (
          <button key={p.i} onClick={() => checked === null && setPicked(picked.filter((x) => x !== p))} className="m-1 rounded-lg bg-lib-blue px-3 py-1.5 text-white">{p.w}</button>
        ))}
      </div>
      <div>
        {remaining.map((p) => (
          <button key={p.i} onClick={() => setPicked([...picked, p])} className="m-1 rounded-lg bg-slate-100 px-3 py-1.5">{p.w}</button>
        ))}
      </div>
      {remaining.length === 0 && checked === null && (
        <button
          onClick={() => {
            const ok = picked.every((p, idx) => p.w === ex.words[idx])
            setChecked(ok)
            onDone(ok)
            speak(ex.words.join(' '))
          }}
          className="w-full rounded-xl bg-lib-blue py-3 font-semibold text-white"
        >
          {t({ fr: 'Vérifier', en: 'Check' })}
        </button>
      )}
      {checked !== null && <p className={checked ? 'text-green-700' : 'text-red-600'}>{checked ? '✓ Correct!' : `✗ ${ex.words.join(' ')}`}</p>}
    </div>
  )
}

export function ExerciseView({ ex, onDone }: { ex: Exercise; onDone: (ok: boolean) => void }) {
  if (ex.type === 'speak') return <Speak ex={ex} onDone={onDone} />
  if (ex.type === 'order') return <Order ex={ex} onDone={onDone} />
  return <Choice ex={ex} onDone={onDone} />
}

export default function Exercises({ module }: { module: ConversationModule }) {
  const { t } = useLang()
  const { setProgress } = useStore()
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const total = module.exercises.length

  if (idx >= total) {
    const pct = score / total
    return (
      <Card className="text-center">
        <p className="text-4xl">{pct >= 0.7 ? '🎉' : '💪'}</p>
        <p className="mt-2 text-lg font-bold">{score} / {total}</p>
        <p className="text-sm text-slate-600">{pct >= 0.7 ? 'Correct-o! You sabe Koloqua!' : t({ fr: 'Small small — réessayez !', en: 'Small small — try again!' })}</p>
        <button onClick={() => { setIdx(0); setScore(0); setAnswered(false) }} className="mt-4 w-full rounded-xl bg-lib-blue py-3 font-semibold text-white">
          {t({ fr: 'Recommencer', en: 'Restart' })}
        </button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lib-blue" style={{ width: `${(idx / total) * 100}%` }} /></div>
        {idx + 1}/{total}
      </div>
      <ExerciseView
        key={idx}
        ex={module.exercises[idx]}
        onDone={(ok) => {
          setAnswered(true)
          if (ok) setScore((s) => s + 1)
        }}
      />
      {answered && (
        <button
          onClick={() => {
            const next = idx + 1
            if (next >= total) setProgress(module.id, score / total)
            setIdx(next)
            setAnswered(false)
          }}
          className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white"
        >
          {t({ fr: 'Suivant →', en: 'Next →' })}
        </button>
      )}
    </div>
  )
}
