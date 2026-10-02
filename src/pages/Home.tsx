import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Card, SpeakButton } from '../components/ui'
import { modules } from '../data/modules'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

export default function Home() {
  const { t, lang } = useLang()
  const { entries, progress } = useStore()
  const core = entries.filter((e) => e.origin === 'core')
  const daily = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000)
    return core[day % core.length]
  }, [core])
  const done = modules.filter((m) => (progress[m.id] ?? 0) >= 0.7).length

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-3xl bg-gradient-to-br from-lib-blue to-blue-900 p-5 text-white">
        <p className="text-sm opacity-80">{t({ fr: 'Bienvenue au Liberia !', en: 'Welcome to Liberia!' })}</p>
        <h1 className="mt-1 text-2xl font-bold">How da body? 👋</h1>
        <p className="mt-2 text-sm opacity-90">
          {t({
            fr: "Apprenez à parler et comprendre l'anglais libérien (Koloqua) pour échanger avec les gens au quotidien.",
            en: 'Learn to speak and understand Liberian English (Koloqua) to connect with people every day.',
          })}
        </p>
        <div className="mt-4 flex gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">{entries.length} {t({ fr: 'entrées', en: 'entries' })}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">{modules.length} {t({ fr: 'dialogues', en: 'dialogues' })}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">{done}/{modules.length} ✓</span>
        </div>
      </section>

      {daily && (
        <Link to={`/entry/${daily.id}`}>
          <Card className="border-lib-red/30">
            <p className="text-xs font-semibold tracking-wide text-lib-red uppercase">{t({ fr: 'Expression du jour', en: 'Phrase of the day' })}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-lg font-bold">{daily.term}</p>
              <SpeakButton text={daily.say && !/[A-Z]{2}/.test(daily.say) ? daily.say : daily.term} />
            </div>
            <p className="text-sm text-slate-600">{lang === 'fr' ? daily.meaningFr ?? daily.meaningEn : daily.meaningEn}</p>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { to: '/modules', icon: '💬', fr: 'Dialogues guidés', en: 'Guided dialogues' },
          { to: '/dictionary', icon: '📖', fr: 'Dictionnaire', en: 'Dictionary' },
          { to: '/pronunciation', icon: '🗣️', fr: "Comprendre l'accent", en: 'Understand the accent' },
          { to: '/quiz', icon: '🎯', fr: 'Quiz express', en: 'Quick quiz' },
          { to: '/listen', icon: '🎧', fr: 'Écouter de vrais locuteurs', en: 'Hear real speakers' },
          { to: '/ask', icon: '🔎', fr: 'Demander (IA + Google)', en: 'Ask (AI + Google)' },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50">
            <div className="text-2xl">{x.icon}</div>
            <div className="mt-2 text-sm font-semibold">{t(x)}</div>
          </Link>
        ))}
      </div>

      <Card>
        <p className="text-sm font-semibold">{t({ fr: '5 phrases de survie', en: '5 survival phrases' })}</p>
        <ul className="mt-2 divide-y divide-slate-100">
          {[
            ['How da body?', 'Comment ça va ?', 'How are you?'],
            ['I na know', 'Je ne sais pas', "I don't know"],
            ['Dat how much?', "C'est combien ?", 'How much is it?'],
            ['Please, talk slow for me', 'Parlez lentement, s\'il vous plaît', 'Please speak slowly'],
            ['Tank you plenty', 'Merci beaucoup', 'Thank you very much'],
          ].map(([lr, fr, en]) => (
            <li key={lr} className="flex items-center justify-between gap-2 py-2">
              <div>
                <p className="font-medium">{lr}</p>
                <p className="text-xs text-slate-500">{lang === 'fr' ? fr : en}</p>
              </div>
              <SpeakButton text={lr} small />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
