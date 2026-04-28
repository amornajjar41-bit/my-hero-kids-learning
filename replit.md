# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Adam – Kids Learning App (artifacts/adam)

Expo SDK 54 + expo-router mobile app for ages 3–15: bilingual EN/AR homework helper. Characters: Adam (boy) and Lulu (girl). Brand: "My Hero".

- **Stack**: Expo SDK 54 + expo-router, AsyncStorage, expo-audio, expo-image-picker, expo-haptics, expo-linear-gradient, react-native-reanimated.
- **Database**: Replit PostgreSQL (via `pg` Pool + DATABASE_URL). All tables created automatically on server startup via setup.ts. Supabase kept only for audio file storage.
- **Auth**: Custom (no Supabase Auth). Email + bcrypt password stored in `users` table. Sessions stored in `app_settings` key/value. Session token persisted in AsyncStorage + localStorage.
- **Backend routes** (artifacts/api-server):
  - `/api/chat` — gpt-4o-mini, language-specific system prompt (EN/AR), Socratic teaching, ai_cache exact+semantic, suggestions, highFive flag
  - `/api/tts` — Edge TTS WebSocket (en-US-GuyNeural/en-US-AnaNeural/ar-SA-HamedNeural/ar-SA-ZariyahNeural) + gpt-audio-mini fallback
  - `/api/transcribe` — AssemblyAI polling + gpt-audio-mini fallback
  - `/api/auth/register`, `/api/auth/login`, `/api/auth/validate` — persistent auth
- **Trial / Pricing**: 7-day free trial. Plans shown only on done.tsx after registration. Monthly $24.99 / 6-month $135.99 / Yearly $236.99. Local currency conversion via constants/countries.ts (36 countries).
- **Onboarding flow**: welcome → hero → parent (email/password/country) → child (DOB picker) → birthday → done (subscription plans).
- **Chat UI**: Emoji opening buttons (🎒📚🎮😊) when no messages. Suggestion chips after each AI reply. High Five sticker animation (slides in, auto-dismisses 3.5s) when highFive=true.
- **System prompt**: Two separate prompts (SYSTEM_PROMPT_EN / SYSTEM_PROMPT_AR) — fully language-specific with proper vocabulary, forbidden phrases, and tone for each language.
- **AI Cache**: PostgreSQL ai_cache table with exact hash match + semantic word-overlap (≥80%) matching. 30-day cache TTL.
- **TTS Voices**: Boy EN: en-US-GuyNeural, Boy AR: ar-SA-HamedNeural, Girl EN: en-US-AnaNeural, Girl AR: ar-SA-ZariyahNeural.
- **Screens**: onboarding (welcome→hero→parent→child→birthday→done), tabs (home/chat/learn/games), learn/[language], learn/lesson/[id], 6 games, parent dashboard, terms, blocked (screen-time), birthday-celebration.
- **DB Tables**: users, children, messages, ai_cache, lesson_progress, safety_alerts, app_settings, curriculum_cache, daily_tips.
- **Sound effects**: chime.ts synthesizes all sounds client-side via Web Audio API.
