import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'fr' | 'en'
type Bi = { fr: string; en: string }

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (b: Bi) => string }>({
  lang: 'fr',
  setLang: () => {},
  t: (b) => b.fr,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || (navigator.language.startsWith('fr') ? 'fr' : 'en'))
  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.lang = lang
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, t: (b) => b[lang] }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
