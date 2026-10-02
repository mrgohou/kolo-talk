import { Link } from 'react-router-dom'
import { PageTitle } from '../components/ui'
import { modules } from '../data/modules'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

export default function Modules() {
  const { t } = useLang()
  const { progress } = useStore()
  return (
    <div>
      <PageTitle sub={t({ fr: 'Situations réelles, dialogues en koloqua, nuances culturelles et exercices.', en: 'Real situations, Koloqua dialogues, cultural nuances and exercises.' })}>
        {t({ fr: 'Dialogues guidés', en: 'Guided dialogues' })}
      </PageTitle>
      <ul className="space-y-3 p-4">
        {modules.map((m) => {
          const p = progress[m.id] ?? 0
          return (
            <li key={m.id}>
              <Link to={`/modules/${m.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50">
                <span className="text-3xl">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t(m.title)}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{t(m.situation)}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-green-500" style={{ width: `${Math.round(p * 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400">{'●'.repeat(m.level)}{'○'.repeat(3 - m.level)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
