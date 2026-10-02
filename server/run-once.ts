import { runEnrichment } from './enrich'

const r = await runEnrichment()
console.log(`found ${r.found}, added ${r.added}`)
