import { NavLink, Route, Routes } from 'react-router-dom'
import { useLang } from './lib/i18n'
import Home from './pages/Home'
import Dictionary from './pages/Dictionary'
import EntryPage from './pages/EntryPage'
import Modules from './pages/Modules'
import ModulePage from './pages/ModulePage'
import Pronunciation from './pages/Pronunciation'
import More from './pages/More'
import Listen from './pages/Listen'
import Enrich from './pages/Enrich'
import Ask from './pages/Ask'
import About from './pages/About'
import Quiz from './pages/Quiz'

const tabs = [
  { to: '/', icon: '🏠', fr: 'Accueil', en: 'Home' },
  { to: '/dictionary', icon: '📖', fr: 'Dico', en: 'Dictionary' },
  { to: '/modules', icon: '💬', fr: 'Dialogues', en: 'Dialogues' },
  { to: '/pronunciation', icon: '🗣️', fr: 'Accent', en: 'Accent' },
  { to: '/more', icon: '☰', fr: 'Plus', en: 'More' },
]

export default function App() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col bg-white shadow-sm">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-lib-blue px-4 py-3 text-white">
        <NavLink to="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">★</span> Kolo Talk
        </NavLink>
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold"
          aria-label="Language"
        >
          {lang === 'fr' ? 'FR → EN' : 'EN → FR'}
        </button>
      </header>
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/entry/:id" element={<EntryPage />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/modules/:id" element={<ModulePage />} />
          <Route path="/pronunciation" element={<Pronunciation />} />
          <Route path="/more" element={<More />} />
          <Route path="/listen" element={<Listen />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/enrich" element={<Enrich />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <nav className="safe-bottom fixed bottom-0 left-1/2 z-10 flex w-full max-w-xl -translate-x-1/2 border-t border-slate-200 bg-white">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center py-2 text-[11px] ${isActive ? 'font-semibold text-lib-blue' : 'text-slate-500'}`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {t(tab)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
