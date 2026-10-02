import fs from 'node:fs'

if (fs.existsSync('.env')) process.loadEnvFile('.env')

export const KEYWORDS = [
  'Liberian English',
  'Koloqua',
  'Kolokwa',
  'how to speak Liberian English',
  'learn Liberian English',
  'Liberian slang',
  'Liberian accent',
]

/** Influencers, comedians and artists whose content is mined for current Koloqua usage. */
export const ACCOUNTS = [
  'Tuzee',
  'King Dennis',
  'Kobazzie',
  'Teddyride',
  'CIC Liberia',
  "L'Frankie",
  'TheBushReport',
  'Giant German Gina',
  'Luqisha Morais',
  'Lifey Liberia',
  'Takun J',
  'Christoph the Change',
  'Bentman',
]

export const env = {
  port: Number(process.env.PORT ?? 8787),
  geminiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-flash-latest',
  youtubeKey: process.env.YOUTUBE_API_KEY ?? '',
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ?? '',
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? '',
  apifyToken: process.env.APIFY_TOKEN ?? '',
  adminToken: process.env.ADMIN_TOKEN ?? '',
  autoIntervalHours: Number(process.env.ENRICH_INTERVAL_HOURS ?? 0),
  maxPerSource: Number(process.env.ENRICH_MAX_PER_SOURCE ?? 8),
}
