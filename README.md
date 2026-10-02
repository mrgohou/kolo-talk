# Kolo Talk — Liberian English (Koloqua) for visitors

Mobile web app (installable PWA) that helps non-Liberians understand and speak Liberian English.

- **Dictionary**: ~1,000 entries (153 curated entries with French translation, pronunciation, examples and cultural notes, plus KoloHQ and Dee Dot Sherm glossaries). Fuzzy search, text-to-speech, favourites, 18+ filter.
- **Guided dialogues**: 10 real-life situations (greetings, taxi/keke, market, cookshop, directions, phone/money, checkpoint, health, going out, neighbours) with dialogue, translation, cultural notes and exercises (multiple choice, listening, speaking with speech recognition, word order).
- **Accent**: Singler's main pronunciation rules with audio examples.
- **Hear real speakers**: 140+ YouTube videos (teachers, comedians, Hipco/Trapco artists) found by keyword search.
- **Ask**: Gemini assistant grounded with real-time Google Search, with cited sources.
- **Self-learning**: server job that searches YouTube, TikTok, KoloHQ and Google for the keywords and tracked accounts, extracts new expressions with Gemini, and queues them for moderation before they appear in the app.

## Run

```bash
npm install
cp .env.example .env   # optional keys
npm run dev            # web on :5173, API on :8787
npm run build && npm start   # production: API serves dist/ on :8787
npm run enrich         # one enrichment run from the CLI
```

Works offline without any key (dictionary, dialogues, exercises). Keys unlock:

| Variable | Unlocks |
| --- | --- |
| `GEMINI_API_KEY` | Ask (Google Search grounding), AI extraction, automatic French translations |
| `YOUTUBE_API_KEY` | YouTube Data API search (otherwise `yt-dlp` is used if installed) |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok Research API search |
| `APIFY_TOKEN` | TikTok fallback via Apify |
| `ADMIN_TOKEN` | Protects "run" and moderation endpoints |
| `ENRICH_INTERVAL_HOURS` | Scheduled enrichment |

Moderation queue and run logs are stored in `data/enrichment.json` (git-ignored).

## Data

`data/sources/` holds the raw collected sources; `scripts/build-sources.py` regenerates `src/data/generated/*.json`.

Sources: Singler, *An Introduction to Liberian English* (1981); Libco pronunciation basics; Dee Dot Sherm; The Reeds in Liberia; Sites of Liberia (D. K. Norris Jr.); [KoloHQ — Koloqua Dictionary](https://kolohq.lovable.app) (free for non-commercial use with attribution); YouTube creators listed in the app.
