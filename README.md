# My Hero — Kids Learning App

An AI-powered learning companion for kids aged 3–15. Features two characters — **Adam** (boy) and **Sara** (girl) — who help children learn through conversation, games, stories, and structured lessons.

## Features

- **AI Chat** — Voice or text chat with Adam/Sara powered by GPT-4o-mini. Answers questions, helps with homework, tells jokes, explains concepts at the child's level.
- **Push-to-Talk** — Hold the mic button to speak; AssemblyAI transcribes in real-time with live timer and transcription status.
- **English Lessons** — Structured curriculum with 3 units, vocabulary, grammar, and comprehension exercises.
- **4 Games** — Word Puzzle, Letter Match, Math Blast, and Jigsaw, each with pre-generated audio.
- **Bedtime Stories** — 10 original stories read aloud with Google WaveNet TTS.
- **Parent Dashboard** — Usage stats, screen time limits, weekly reports, safety alerts, and subscription management.
- **Badge & Streak System** — Collectible badges and daily streaks to keep kids motivated.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Expo SDK 54 + Expo Router (React Native) |
| API Server | Express.js + TypeScript |
| Database | PostgreSQL (Replit built-in) via Drizzle ORM |
| File Storage | Supabase Storage |
| AI Chat | OpenAI GPT-4o-mini |
| Text-to-Speech | Google Cloud WaveNet TTS |
| Speech-to-Text | AssemblyAI universal-3-pro |
| Monorepo | pnpm workspaces |

## Project Structure

```
my-hero-kids-learning/
├── artifacts/
│   ├── adam/              # Expo mobile app
│   │   ├── app/           # Expo Router screens
│   │   ├── components/    # Reusable UI components
│   │   ├── constants/     # Stories, curriculum, countries, colors
│   │   ├── contexts/      # AppContext (profile, progress)
│   │   ├── hooks/         # useT, useColors, etc.
│   │   └── lib/           # API client, audio, storage, auth
│   └── api-server/        # Express API
│       └── src/
│           ├── routes/    # chat, tts, transcribe, admin, trial, auth
│           └── lib/       # assemblyai, google-tts, openai, db
├── lib/                   # Shared TypeScript libraries
├── .env.example           # All required env vars (no values)
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database
- Expo Go app (for mobile testing)

### 1. Clone & install

```bash
git clone https://github.com/amornajjar41-bit/my-hero-kids-learning.git
cd my-hero-kids-learning
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in your actual values (see .env.example for descriptions)
```

Required secrets:
- `DATABASE_URL` — PostgreSQL connection string
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com)
- `ASSEMBLYAI_API_KEY` — [assemblyai.com](https://www.assemblyai.com)
- `GOOGLE_TTS_API_KEY` — [Google Cloud Console](https://console.cloud.google.com) (enable Cloud Text-to-Speech API)
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` — [supabase.com](https://supabase.com)
- `SESSION_SECRET` — any long random string

Expo app env vars (prefix `EXPO_PUBLIC_`):
- `EXPO_PUBLIC_DOMAIN` — your API server domain
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run the API server

```bash
pnpm --filter @workspace/api-server run dev
```

### 4. Run the Expo app

```bash
pnpm --filter @workspace/adam run dev
# Scan the QR code with Expo Go, or press 'w' for web
```

## Environment Variables Reference

See [`.env.example`](.env.example) for the full list with descriptions.

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/chat` | AI chat with caching |
| POST | `/api/tts` | Google WaveNet text-to-speech |
| POST | `/api/transcribe` | AssemblyAI speech-to-text |
| POST | `/api/audio/batch` | Batch audio fetch from Supabase |
| GET | `/api/trial/usage` | Trial usage stats |
| POST | `/api/admin/generate-lesson-audio` | Pre-generate lesson audio (SSE) |
| POST | `/api/admin/generate-stories` | Pre-generate story audio (SSE) |
| POST | `/api/admin/prewarm-cache` | Pre-warm AI chat cache (SSE) |

## License

Private — all rights reserved.
