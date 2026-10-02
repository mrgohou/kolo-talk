import { Card, PageTitle } from '../components/ui'
import { SOURCES } from '../data'
import { useLang } from '../lib/i18n'

export default function About() {
  const { t } = useLang()
  return (
    <div>
      <PageTitle>{t({ fr: 'Sources et crédits', en: 'Sources & credits' })}</PageTitle>
      <div className="space-y-3 p-4 text-sm">
        <Card>
          <p>
            {t({
              fr: "Kolo Talk aide les visiteurs non libériens à comprendre et parler l'anglais libérien (Koloqua). Le koloqua n'a pas d'orthographe officielle : les graphies varient selon les locuteurs.",
              en: 'Kolo Talk helps non-Liberian visitors understand and speak Liberian English (Koloqua). Koloqua has no official spelling: spellings vary between speakers.',
            })}
          </p>
        </Card>
        <Card>
          <p className="mb-2 font-semibold">{t({ fr: 'Sources', en: 'Sources' })}</p>
          <ul className="list-disc space-y-1 pl-4">
            {Object.values(SOURCES).map((s) => (
              <li key={s.name}>{s.url ? <a className="text-lib-blue underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a> : s.name}</li>
            ))}
          </ul>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          {t({
            fr: "Les entrées KoloHQ proviennent de l'API publique de KoloHQ — Koloqua Dictionary (archive communautaire). Licence : usage gratuit pour la recherche, l'éducation et les produits non commerciaux, avec attribution. Un usage commercial nécessite leur accord.",
            en: 'KoloHQ entries come from the public API of KoloHQ — Koloqua Dictionary (community archive). Free for research, education and non-commercial use with attribution. Commercial use requires their permission.',
          })}
        </Card>
      </div>
    </div>
  )
}
