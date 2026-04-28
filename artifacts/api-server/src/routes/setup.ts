import { Router, type IRouter } from "express";
import { pool } from "../lib/db";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  parent_name text,
  country text,
  currency text,
  language text,
  created_at timestamptz DEFAULT now(),
  subscription_plan text DEFAULT 'trial',
  subscription_status text DEFAULT 'trial',
  trial_start timestamptz DEFAULT now(),
  trial_tts_used_seconds integer DEFAULT 0,
  trial_stt_used_seconds integer DEFAULT 0,
  trial_photos_used integer DEFAULT 0,
  pin_hash text
);

CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  child_name text NOT NULL,
  gender text,
  date_of_birth date,
  character_choice text,
  age_group text,
  language_preference text DEFAULT 'en',
  streak_days integer DEFAULT 0,
  total_points integer DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  screen_time_limit_hours integer DEFAULT 4,
  screen_time_used_today_seconds integer DEFAULT 0,
  screen_time_reset_date date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  role text NOT NULL,
  content_text text,
  audio_url text,
  created_at timestamptz DEFAULT now(),
  is_cached boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_hash text NOT NULL,
  input_text text,
  response_text text,
  audio_url text,
  language text,
  gender text,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_cache_hash_lang ON ai_cache(input_hash, language);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  lesson_id text NOT NULL,
  completed boolean DEFAULT false,
  score integer DEFAULT 0,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS safety_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  timestamp timestamptz DEFAULT now(),
  category text,
  severity text DEFAULT 'low',
  alert_sent boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text
);

CREATE TABLE IF NOT EXISTS curriculum_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text,
  subject text,
  grade_level text,
  question_text text,
  answer_text text,
  answer_audio_url text,
  explanation_text text,
  curriculum_type text,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_text_en text,
  tip_text_ar text,
  time_of_day text,
  created_at timestamptz DEFAULT now()
);
`;

let setupDone = false;

export async function runSetup(): Promise<void> {
  if (setupDone) return;
  try {
    // Create tables in PostgreSQL (Replit DB)
    const statements = TABLES_SQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && /\b(CREATE)\b/i.test(s));

    for (const stmt of statements) {
      try {
        await pool.query(stmt + ";");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("already exists")) {
          console.warn("[setup] Statement warning:", msg.slice(0, 120));
        }
      }
    }

    console.log("[setup] ✅ Database tables ready");

    // Create Supabase storage buckets (non-fatal)
    const buckets = ["stories-audio", "lessons-audio", "game-audio", "user-data"];
    for (const bucket of buckets) {
      await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
    }

    setupDone = true;
  } catch (err) {
    console.error("[setup] Setup error (non-fatal):", err);
    setupDone = true;
  }
}

router.post("/setup", async (req, res) => {
  try {
    setupDone = false; // force re-run
    await runSetup();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
