import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, SpeakButton } from '../components/ui'
import Exercises from '../components/Exercises'
import { modules } from '../data/modules'
import { useLang } from '../lib/i18n'
import { speak } from '../lib/speech'

type Tab = 'phrases' | 'dialogue' | 'culture' | 'practice'

export default function ModulePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, lang } = useLang()
  const m = modules.find((x) => x.id === id)
  const [tab, setTab] = useState<Tab>('phrases')
  const [showTr, setShowTr] = useState(true)
  if (!m) return <p className="p-6">Module introuvable.</p>

  const playAll = async () => {
    for (const line of m.dialogue) {
      await new Promise<void>((res) => {
        speak(line.lr)
        const check = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(check)
            setTimeout(res, 400)
          }
        }, 200)
      })
    }
  }

  const tabs: { id: Tab; fr: string; en: string }[] = [
    { id: 'phrases', fr: 'Phrases clés', en: 'Key phrases' },
    { id: 'dialogue', fr: 'Dialogue', en: 'Dialogue' },
    { id: 'culture', fr: 'Culture', en: 'Culture' },
    { id: 'practice', fr: 'Exercices', en: 'Practice' },
  ]

  return (
    <div>
      <div className="space-y-1 px-4 pt-4">
        <button onClick={() => nav('/modules')} className="text-sm text-lib-blue">← {t({ fr: 'Dialogues', en: 'Dialogues' })}</button>
        <h1 className="text-xl font-bold">{m.icon} {t(m.title)}</h1>
        <p className="text-sm text-slate-500">{t(m.situation)}</p>
      </div>
      <div className="sticky top-0 z-[5] flex gap-1 overflow-x-auto bg-white px-4 py-2">
        {tabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${tab === x.id ? 'bg-lib-blue text-white' : 'bg-slate-100'}`}>
            {t(x)}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {tab === 'phrases' &&
          m.keyPhrases.map((p) => (
            <Card key={p.lr} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{p.lr}</p>
                {p.say && <p className="font-mono text-xs text-slate-400">{p.say}</p>}
                <p className="text-sm text-slate-600">{lang === 'fr' ? p.fr : p.en}</p>
              </div>
              <SpeakButton text={p.lr} />
            </Card>
          ))}

        {tab === 'dialogue' && (
          <>
            <div className="flex gap-2">
              <button onClick={playAll} className="flex-1 rounded-xl bg-lib-blue py-2 text-sm font-medium text-white">▶ {t({ fr: 'Écouter tout', en: 'Play all' })}</button>
              <button onClick={() => setShowTr((s) => !s)} className="flex-1 rounded-xl bg-slate-100 py-2 text-sm">
                {showTr ? t({ fr: 'Masquer la traduction', en: 'Hide translation' }) : t({ fr: 'Afficher la traduction', en: 'Show translation' })}
              </button>
            </div>
            {m.dialogue.map((l, i) => {
              const me = l.speaker === 'Vous'
              return (
                <div key={i} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${me ? 'bg-lib-blue text-white' : 'bg-slate-100'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[11px] font-semibold ${me ? 'text-white/70' : 'text-slate-500'}`}>{me ? t({ fr: 'Vous', en: 'You' }) : l.speaker}</p>
                      <button onClick={() => speak(l.lr)} aria-label="play" className="text-sm">🔊</button>
                    </div>
                    <p className="font-medium">{l.lr}</p>
                    {showTr && <p className={`mt-1 text-sm ${me ? 'text-white/80' : 'text-slate-600'}`}>{lang === 'fr' ? l.fr : l.en}</p>}
                    {l.note && showTr && <p className={`mt-1 text-xs italic ${me ? 'text-amber-200' : 'text-amber-700'}`}>💡 {l.note}</p>}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {tab === 'culture' && (
          <>
            {m.culture.map((c, i) => (
              <Card key={i} className="border-amber-200 bg-amber-50 text-sm">💡 {t(c)}</Card>
            ))}
            {m.videos?.length ? (
              <Card>
                <p className="mb-2 text-sm font-semibold">🎧 {t({ fr: 'Écouter de vrais locuteurs', en: 'Hear real speakers' })}</p>
                <ul className="space-y-1 text-sm">
                  {m.videos.map((v) => (
                    <li key={v.url}><a href={v.url} target="_blank" rel="noreferrer" className="text-lib-blue underline">{v.title}</a></li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        )}

        {tab === 'practice' && <Exercises module={m} />}
      </div>
    </div>
  )
}
