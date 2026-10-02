import { Link } from 'react-router-dom'
import { PageTitle } from '../components/ui'
import { useLang } from '../lib/i18n'
import { useStore } from '../lib/store'

export default function More() {
  const { t } = useLang()
  const { showVulgar, setShowVulgar } = useStore()
  const links = [
    { to: '/quiz', icon: '🎯', fr: 'Quiz express', en: 'Quick quiz' },
    { to: '/listen', icon: '🎧', fr: 'Écouter de vrais locuteurs (YouTube)', en: 'Hear real speakers (YouTube)' },
    { to: '/ask', icon: '🔎', fr: 'Demander à l\'assistant (Gemini + Google Search)', en: 'Ask the assistant (Gemini + Google Search)' },
    { to: '/enrich', icon: '🤖', fr: 'Auto-apprentissage (YouTube, TikTok, Google)', en: 'Self-learning (YouTube, TikTok, Google)' },
    { to: '/dictionary?o=fav', icon: '★', fr: 'Mes favoris', en: 'My saved words' },
    { to: '/about', icon: 'ℹ️', fr: 'Sources et crédits', en: 'Sources & credits' },
  ]
  return (
    <div>
      <PageTitle>{t({ fr: 'Plus', en: 'More' })}</PageTitle>
      <ul className="divide-y divide-slate-100 px-4">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center gap-3 py-4">
              <span className="w-8 text-center text-xl">{l.icon}</span>
              <span className="flex-1">{t(l)}</span>
              <span className="text-slate-400">›</span>
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-3 py-4">
          <span className="w-8 text-center text-xl">🔞</span>
          <span className="flex-1 text-sm">{t({ fr: 'Afficher les mots vulgaires / adultes', en: 'Show vulgar / adult words' })}</span>
          <input type="checkbox" checked={showVulgar} onChange={(e) => setShowVulgar(e.target.checked)} className="h-5 w-5" />
        </li>
      </ul>
    </div>
  )
}
