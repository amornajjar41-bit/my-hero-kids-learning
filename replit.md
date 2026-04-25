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

Expo mobile app for ages 5–15: bilingual EN/AR homework helper (guides, never gives answers) + Learn EN/AR + 4 games (Word Puzzle, Math Blast, Letter Match, Jigsaw) + parent dashboard.

- **Stack**: Expo SDK 54 + expo-router, AsyncStorage, expo-audio, expo-image-picker, expo-haptics, expo-linear-gradient, react-native-reanimated.
- **Backend routes** (artifacts/api-server): `/api/chat` (text+image, hint-only), `/api/tts` (echo=boy, nova=girl), `/api/transcribe`, `/api/parent/weekly-report`.
- **Trial / Paywall**: 3-day free trial → $19.99/mo or $189/yr (demo only — no charges).
- **Screens**: onboarding (welcome→hero→parent→child→birthday→done), tabs (home/chat/learn/games), learn/[language], learn/lesson/[id] with Hook→Introduce→See→Challenge→Celebrate flow, dictionary, 4 games, parent (dashboard/controls/upgrade/why-adam), blocked (screen-time), birthday-celebration.
- **Storage**: profile + progress in AsyncStorage; weekly bar chart, streaks, badges, monthly active days.
