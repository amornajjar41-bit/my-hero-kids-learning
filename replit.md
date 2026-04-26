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

Expo mobile app for ages 3–15: bilingual EN/AR homework helper (guides, never gives answers) + Learn EN/AR + 6 games + parent dashboard. Brand: "My Hero".

- **Stack**: Expo SDK 54 + expo-router, AsyncStorage, expo-audio, expo-image-picker, expo-haptics, expo-linear-gradient, react-native-reanimated.
- **Backend routes** (artifacts/api-server): `/api/chat` (text+image, hint-only, childMemory injection), `/api/tts` (echo=boy, nova=girl, contentType param for speed control), `/api/transcribe`, `/api/parent/weekly-report`.
- **Trial / Paywall**: 7-day free trial → $19.99/mo or $189/yr (demo only — no charges).
- **Screens**: onboarding (welcome→hero→parent[T&C checkbox]→child→birthday→done), tabs (home/chat/learn/games), learn/[language], learn/lesson/[id] with Hook→Introduce→See→Challenge→Celebrate flow, dictionary, 6 games, parent (dashboard/controls/upgrade/why-adam), terms, blocked (screen-time), birthday-celebration.
- **Storage keys**: profile, progress, chatHistory, onboardingDone, storiesListened, voiceTutorialDone, safetyAlerts, childMemory (learning profile), termsAccepted.
- **Games**: Word Puzzle, Math Blast, Letter Match, Jigsaw, Story Builder (📖 branching narrative + science facts), Memory Champion (🧠 Word Flash + Color Sequence + Story Memory).
- **AI chat**: Upgraded system prompt with Socratic teaching, emotional intelligence, age adaptation (3-5/6-8/9-12 rules). Child memory profile (strong/weak subjects, interests, pace, recent topics) loaded and sent with every request. Memory auto-updated from detected keywords.
- **TTS**: contentType param → "explanation" = slow+calm teacher, "story" = soothing storyteller, "celebration" = energetic, "greeting" = warm. Pauses inserted between sentences.
- **Sound effects**: chime.ts synthesizes all sounds client-side via Web Audio API — tap/pop, success, unlock, sparkle, whoosh, bell, wrong, celebration.
- **Logo**: HeroLogo component (shield + gradient + star) displayed at top of home screen.
- **Terms**: Full bilingual T&C page at /terms. Checkbox required during onboarding. Link in parent dashboard.
