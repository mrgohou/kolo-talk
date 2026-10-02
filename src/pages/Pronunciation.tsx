import { Card, PageTitle, SpeakButton } from '../components/ui'
import { pronunciationRules } from '../data/pronunciation'
import { useLang } from '../lib/i18n'

export default function Pronunciation() {
  const { t } = useLang()
  return (
    <div>
      <PageTitle sub={t({ fr: "Les règles clés pour comprendre l'accent libérien (d'après Singler, 1980).", en: 'Key rules to understand the Liberian accent (after Singler, 1980).' })}>
        {t({ fr: "Comprendre l'accent", en: 'Understanding the accent' })}
      </PageTitle>
      <div className="space-y-3 p-4">
        {pronunciationRules.map((r) => (
          <Card key={r.id}>
            <p className="font-semibold">{t(r.title)}</p>
            <p className="mt-1 text-sm text-slate-600">{t(r.explain)}</p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {r.examples.map((x) => (
                  <tr key={x.standard} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-500">{x.standard}</td>
                    <td className="py-1.5">→</td>
                    <td className="py-1.5 font-semibold">{x.liberian}</td>
                    <td className="py-1.5 text-right"><SpeakButton text={x.liberian.split('/')[0]} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
        <Card className="border-amber-200 bg-amber-50 text-sm">
          💡 {t({
            fr: "Astuce : si vous ne comprenez pas, dites « Please, talk slow for me » (parlez lentement pour moi). Les Libériens adaptent volontiers leur débit, et ils apprécient qu'on essaie le koloqua.",
            en: 'Tip: if you don\'t understand, say "Please, talk slow for me". Liberians happily slow down, and appreciate the effort to try Koloqua.',
          })}
        </Card>
      </div>
    </div>
  )
}
