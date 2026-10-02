export interface PronRule {
  id: string
  title: { fr: string; en: string }
  explain: { fr: string; en: string }
  examples: { standard: string; liberian: string }[]
}

/** Based on Singler (1980) "An Introduction to Liberian English", via libco406423561, plus The Reeds in Liberia. */
export const pronunciationRules: PronRule[] = [
  {
    id: 'th-voiced',
    title: { fr: '« TH » doux → d / v', en: 'Voiced "TH" → d / v' },
    explain: { fr: 'Le « th » de « those » devient « d » en début de mot et « v » ailleurs.', en: 'The "th" in "those" becomes "d" at the start of a word and "v" elsewhere.' },
    examples: [{ standard: 'those', liberian: 'doz' }, { standard: 'the', liberian: 'de' }, { standard: 'bathe', liberian: 'bev' }, { standard: 'together', liberian: 'togeddeh' }],
  },
  {
    id: 'th-voiceless',
    title: { fr: '« TH » dur → t / f', en: 'Voiceless "TH" → t / f' },
    explain: { fr: 'Le « th » de « thing » devient « t » ; en fin de mot, « f » ou « t ».', en: 'The "th" in "thing" becomes "t"; at the end of a word, "f" or "t".' },
    examples: [{ standard: 'thought', liberian: 'tot' }, { standard: 'thank you', liberian: 'tank you' }, { standard: 'teeth', liberian: 'tit' }, { standard: 'mouth', liberian: 'mouf' }],
  },
  {
    id: 'final-drop',
    title: { fr: 'Consonnes finales avalées', en: 'Dropped final consonants' },
    explain: { fr: 'Après une voyelle, la consonne finale disparaît souvent. C\'est la principale difficulté de compréhension.', en: 'After a vowel, the final consonant is often dropped. This is the main comprehension hurdle.' },
    examples: [{ standard: 'stop', liberian: 'sta' }, { standard: 'good', liberian: 'gu' }, { standard: 'not', liberian: 'na' }, { standard: 'house', liberian: 'hou\'' }, { standard: 'dog', liberian: 'daw' }, { standard: 'boiled egg', liberian: 'boieh' }],
  },
  {
    id: 'medial-drop',
    title: { fr: 'Syllabes internes réduites ; d/t → l', en: 'Reduced middle syllables; d/t → l' },
    explain: { fr: 'Les consonnes au milieu des mots tombent ; un « d », « t » ou « th » interne sonne comme un « l ».', en: 'Middle consonants drop; an internal "d", "t" or "th" sounds like "l".' },
    examples: [{ standard: 'headache', liberian: 'helek' }, { standard: 'putting', liberian: 'pule' }, { standard: 'everything', liberian: 'e\'ry\'tin\'' }, { standard: 'red light', liberian: 're\'li\'' }],
  },
  {
    id: 'l-r',
    title: { fr: '« L » et « R » interchangeables', en: '"L" and "R" interchangeable' },
    explain: { fr: 'Certains locuteurs ne distinguent pas « l » et « r » (stigmatisé en début de mot).', en: 'Some speakers do not distinguish "l" and "r" (stigmatised at word start).' },
    examples: [{ standard: 'load', liberian: 'lod / rod' }, { standard: 'road', liberian: 'rod / lod' }],
  },
  {
    id: 'final-o',
    title: { fr: 'Le « -o » final', en: 'The final "-o"' },
    explain: { fr: 'Ajouter « -o » donne de l\'emphase et signale l\'amitié.', en: 'Adding "-o" gives emphasis and signals friendliness.' },
    examples: [{ standard: 'finish', liberian: 'fini-o' }, { standard: 'good morning', liberian: 'good morning-o' }, { standard: 'dog', liberian: 'daw-o' }],
  },
  {
    id: 'reduplication',
    title: { fr: 'Redoublement et voyelles allongées', en: 'Reduplication & stretched vowels' },
    explain: { fr: 'On répète un mot pour l\'intensifier, et on allonge les voyelles pour insister (« tayyyy » = très longtemps).', en: 'Words are repeated to intensify, and vowels stretched for emphasis ("tayyyy" = a very long time).' },
    examples: [{ standard: 'very good', liberian: 'fine-fine / googoo' }, { standard: 'little by little', liberian: 'small small' }, { standard: 'genuine', liberian: 'true true' }],
  },
  {
    id: 'grammar',
    title: { fr: 'Grammaire simplifiée', en: 'Simplified grammar' },
    explain: { fr: 'Le verbe « être » disparaît souvent, la négation se fait avec « na », et le pluriel/temps sont marqués par le contexte.', en: '"To be" is often dropped, negation uses "na", and plural/tense are marked by context.' },
    examples: [{ standard: 'The rice is finished', liberian: 'De rice finish' }, { standard: "I don't know", liberian: 'I na know' }, { standard: 'Where is the pharmacy?', liberian: 'Where de pharmacy dey?' }],
  },
]
