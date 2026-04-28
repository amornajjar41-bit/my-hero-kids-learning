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

- **Stack**: Expo SDK 54 + expo-router, AsyncStorage, expo-audio, expo-speech (local TTS, no API), expo-image-picker, expo-haptics, expo-linear-gradient, react-native-reanimated.
- **Database**: Supabase only (`@supabase/supabase-js` with service role key). All CRUD via `supabase.from()`. Tables auto-created on startup via `supabase.rpc("exec_sql")` (requires the `exec_sql` function in Supabase SQL Editor). Storage buckets also via Supabase Storage.
- **Auth**: Custom (no Supabase Auth). Email + bcrypt password stored in `users` table. Sessions stored in `app_settings` key/value. Session token persisted in AsyncStorage + localStorage.
- **Backend routes** (artifacts/api-server):
  - `/api/chat` — gpt-4o-mini, language-specific system prompt (EN/AR), Socratic teaching, ai_cache exact+semantic, suggestions, highFive flag
  - `/api/tts` — Edge TTS WebSocket (en-US-GuyNeural/en-US-AnaNeural/ar-SA-HamedNeural/ar-SA-ZariyahNeural) + gpt-audio-mini fallback
  - `/api/transcribe` — OpenAI Whisper-1 (replaces broken AssemblyAI integration). Writes audio to tmp file, calls whisper-1 with language hint, returns trimmed text.
  - `/api/auth/register`, `/api/auth/login`, `/api/auth/validate` — persistent auth
  - `/api/safety-alert` — stores in Supabase safety_alerts + sends email (via RESEND_API_KEY if set)
  - `/api/trial/usage` (GET) — returns TTS/STT/photo usage vs limits for session
  - `/api/trial/usage` (POST) — increments usage counters in Supabase users table
  - `/api/trial/check-photo` — checks if photo upload is allowed within trial limits
- **4B – Screen Time**: AppContext tracks usage with AppState events + 60s ticker. Blocked screen shows hero-and-language-specific sleeping message with midnight countdown. No interaction allowed when blocked. AppContext exposes `isScreenBlocked` computed value. Limits: 2h/4h/6h/Unlimited.
- **4C – First-Time Tour**: `components/Tour.tsx` — 5-step interactive modal overlay with expo-speech local audio (zero API calls). Shows once after registration. Steps: Homework Helper, Games, Language, Stories, Rewards. Ends with confetti.
- **4D – Daily Tips**: `components/DailyTip.tsx` — locally stored tips by time of day (morning/afternoon/evening) in EN+AR. No AI, no API. Birthday check at 8am: confetti + party hat + expo-speech happy birthday song.
- **5A – Parent PIN**: `app/parent/pin.tsx` — 4-digit PIN pad (setup on first access, verify every time). PIN stored in AsyncStorage. Forgot PIN triggers Alert with parent email. Parent dashboard wrapped with PIN guard. Why My Hero updated with 10 reasons.
- **5A – Safety Monitoring**: All messages checked against EN/AR keyword lists (excluding educational terms). Safety alerts stored in Supabase + email sent via Resend API (RESEND_API_KEY required). Client also stores alerts in AsyncStorage for offline dashboard display.
- **5B – Trial Limits**: TTS 15min/3days, STT 15min/3days, Photos 1 total. Tracked in users table (trial_tts_used_seconds, trial_stt_used_seconds, trial_photos_used). Trial usage API requires session token header (x-session-token).
- **5B – Upgrade Screen**: 3 plans — Monthly $24.99 / 6-Month $135.99 (save 10%) / Yearly $236.99 (save 21%). Local currency via exchange rate table (20+ currencies). Never shows USD to non-USD countries.
- **Trial / Pricing**: Plans shown on done.tsx (onboarding) and parent/upgrade.tsx. Local currency conversion via constants/countries.ts (36 countries) and upgrade.tsx rate table.
- **Onboarding flow**: welcome → hero → parent (email/password/country) → child (DOB picker + saveProfile) → done (subscription plans). The `birthday.tsx` screen is no longer in the active flow (child.tsx now calls saveProfile directly and navigates to done).
- **Chat UI**: Emoji opening buttons (🎒📚🎮😊) when no messages. Suggestion chips after each AI reply. High Five sticker animation (slides in, auto-dismisses 3.5s) when highFive=true.
- **System prompt**: Two separate prompts (SYSTEM_PROMPT_EN / SYSTEM_PROMPT_AR) — fully language-specific. Teaching rules: (1) Direct fact questions ("what is 3×6?") → ALWAYS answer first, then explain; never ask the child back. (2) Homework checks → confirm/correct + explain. (3) Concept questions → explain + example + invite try. Garbled voice input is interpreted by intent, not transcribed literally. Forbidden: Socratic bouncing on factual questions.
- **AI Cache**: Supabase ai_cache table with exact hash match + semantic word-overlap (≥80%) matching. 30-day cache TTL.
- **TTS Voices**: Boy EN: en-US-Wavenet-D, Boy AR: ar-XA-Wavenet-B, Girl EN: en-US-Wavenet-F, Girl AR: ar-XA-Wavenet-A. Audio config: speakingRate=0.88, pitch: female=3.0, male=1.0 (warm/friendly, no effectsProfileId). Hero maps to voice: `hero==="girl"` → "nova" → female voices; else → "echo" → male voices.
- **Screens**: onboarding (welcome→hero→parent→child→done), tabs (home/chat/learn/games), learn/[language], learn/lesson/[id], 6 games, parent (PIN+dashboard+controls+why-adam+upgrade), terms, blocked (4B sleeping screen), birthday-celebration (4D party hat+confetti).
- **Stories screens**: stories/index.tsx shows ALL 10 stories (5 AR + 5 EN) grouped by language (user's language first). Navigation uses explicit `{ pathname: "/stories/[id]", params: { id } }` format. stories/[id].tsx normalizes id with Array.isArray() guard to prevent STORIES[0] fallback.
- **DB Tables**: users, children, messages, ai_cache, lesson_progress, safety_alerts, app_settings, curriculum_cache, daily_tips.
- **New Components**: Tour.tsx (4C), DailyTip.tsx (4D).
- **New Screens**: parent/pin.tsx (5A), stories/index.tsx + stories/[id].tsx (6B).
- **Sound effects**: chime.ts synthesizes all sounds client-side via Web Audio API. Tour/birthday audio via expo-speech (device TTS, zero API calls).
- **6A – Pre-Generated Lesson/Game Audio**:
  - `lib/lessonAudio.ts` — in-memory preloader/cache. Calls POST /api/audio/batch to batch-fetch base64 MP3s from Supabase Storage and caches them in memory. `playPreloaded(path, fallback?)` plays in <100ms; falls back to live TTS if not cached.
  - Games updated: word-puzzle uses responsive tile sizing via `useWindowDimensions` (no overflow); letter-match calls `preloadLetterAudio` on mount + uses `playPreloaded(letterCelebratePath)` for celebration; math-blast calls `preloadMathAudio` + `playPreloaded(mathCorrectPath)` for correct answers; jigsaw calls `preloadJigsawAudio` + `playPreloaded(jigsawFunFactPath)` on solve + visual tile selection with `selectedIdx` state + highlighted border.
  - Lesson player updated: preloads all word audio on mount, plays pronunciation/hint/reveal from cache.
  - Admin SSE endpoints: POST /api/admin/generate-lesson-audio (lessons+games), POST /api/admin/generate-stories, GET /api/admin/status — stream progress via SSE.
  - Admin routes fixed: `routes/admin.ts` now calls Google WaveNet TTS API directly (removed broken edge-tts import). Voices: en-US-Wavenet-F (EN), ar-XA-Wavenet-A (AR). Rate/pitch params converted from edge-tts format ("-18%" → speakingRate=0.82; "-2st" → pitch semitones=-2).
  - Batch proxy: POST /api/audio/batch — fetches up to 200 Supabase Storage objects per call, returns `{ audios: { path: base64 } }`. 2000-item server-side LRU cache.
  - `lib/audio.ts` safety timeout bumped: `text.length * 100` ms with floor 6000ms and ceiling 30000ms (was 80ms / 4000ms floor — too short for long Arabic phrases).
- **6B – Bedtime Stories**:
  - `constants/stories.ts` — 10 story definitions (5 Arabic + 5 English) with id, lang, title, emoji, moral, sentences[].
  - `app/stories/index.tsx` — list screen grouped by language with emoji, title, and moral preview.
  - `app/stories/[id].tsx` — sentence-by-sentence reader with auto-play, manual prev/next/tap controls, progress dots, full story list, and "The End" confetti screen.
  - Learn tab has a new "Bedtime Stories" card (dark navy) linking to /stories.
  - Parent dashboard admin section (at bottom of parent/index.tsx): "Generate Lesson & Game Audio" + "Generate Stories" buttons. Each reads SSE stream via fetch ReadableStream + TextDecoder (works on both web and native). Shows real-time progress bar (percent + last message), done state, and error state. Uses AbortController for cleanup.
- **6C – Curriculum Cache + Image Compression + Photo Check**:
  - API server `checkCurriculumCache()` — queries `curriculum_cache` table (Supabase), checks word overlap ≥80% before hitting AI cache. Returns answer_text if hit.
  - API server `classifyImageAsHomework()` — fast gpt-4o-mini vision pre-check on photos; rejects non-educational images with a bilingual message before the main call.
  - Client `pickImage()` in chat.tsx — uses `expo-image-manipulator` to resize to max 800px longest side at 60% JPEG quality before base64 encoding. Reduces payload by 70–90%.
- **Change 7 – Complete Rewards System**:
  - `constants/badges.ts` — expanded to 15 badges: First Word, First Story, First Game Win, 3/7/30-day streak, Math Master, Arabic Star, English Star, Homework Hero, Story Lover, Game Champion, Perfect Week, Speed Learner, Helping Hand.
  - `lib/storage.ts` — Progress type now has `pointsTotal`, `todayPoints`, `todayPointsDate`, `rewardsUnlocked[]`. `POINTS` constants: homework=10, lesson=25, game=15, story=20, streak3bonus=50, streak7bonus=150. `REWARD_SHOP` array: 6 items (cape 50pts, hat 100pts, crown 100pts, costume 150pts, galaxy bg 200pts, golden star 300pts).
  - `contexts/AppContext.tsx` — `addPoints(pts)` helper that auto-resets todayPoints daily. `resetAll()` also clears `onboardingDone` so logout returns to welcome screen.
  - `app/rewards/index.tsx` — Full Rewards Room screen with Badges tab (15 animated badge cards) and Shop tab (6 purchasable items with alert confirmation). Shows today's points pill and streak bonus banners.
  - `components/BadgeShelf.tsx` — Trophy Room section on home tab now shows ⭐ total points + today's earned. Tapping opens /rewards. "View Rewards & Shop" CTA at bottom.
  - All activity completions award points: chat (+10), lesson (+25, first time only), games (+15), stories (+20), streak 3-day (+50), streak 7-day (+150).
- **Change 8 – Bug Fixes, PWA, Welcome Updates**:
  - Bottom nav label font reduced from 12→10px to prevent label cutoff on small screens.
  - `resetAll()` now also clears `onboardingDone` — logout properly returns to welcome screen and blocks back-navigation (router.replace).
  - `app.json` web config updated with full PWA settings: themeColor, backgroundColor, display:standalone, orientation:portrait, scope, startUrl.
  - Welcome screen now shows social proof: "2,400+ happy families" and "4.9 / 5" rating badges below the CTA.
  - `expo-image-manipulator` installed for client-side image compression.
