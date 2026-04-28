import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

// ─── DDL ─────────────────────────────────────────────────────────────────────
// Each statement must end with ; and be separated by a blank line.
// To enable programmatic creation, create this function once in Supabase SQL Editor:
//   CREATE OR REPLACE FUNCTION exec_sql(sql text)
//   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS
//   $$ BEGIN EXECUTE sql; END; $$;
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    parent_name text,
    country text,
    currency text,
    language text DEFAULT 'en',
    created_at timestamptz DEFAULT now(),
    subscription_plan text DEFAULT 'trial',
    subscription_status text DEFAULT 'trial',
    trial_start timestamptz DEFAULT now(),
    trial_tts_used_seconds integer DEFAULT 0,
    trial_stt_used_seconds integer DEFAULT 0,
    trial_photos_used integer DEFAULT 0,
    pin_hash text
  )`,
  `CREATE TABLE IF NOT EXISTS children (
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
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid REFERENCES children(id),
    role text NOT NULL,
    content_text text,
    audio_url text,
    created_at timestamptz DEFAULT now(),
    is_cached boolean DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS ai_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    input_hash text NOT NULL,
    input_text text,
    response_text text,
    audio_url text,
    language text,
    gender text,
    hit_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(input_hash, language)
  )`,
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid REFERENCES children(id),
    lesson_id text NOT NULL,
    completed boolean DEFAULT false,
    score integer DEFAULT 0,
    completed_at timestamptz
  )`,
  `CREATE TABLE IF NOT EXISTS safety_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid REFERENCES children(id),
    timestamp timestamptz DEFAULT now(),
    category text,
    severity text DEFAULT 'low',
    alert_sent boolean DEFAULT false
  )`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key text PRIMARY KEY,
    value text
  )`,
  `CREATE TABLE IF NOT EXISTS curriculum_cache (
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
  )`,
  `CREATE TABLE IF NOT EXISTS daily_tips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tip_text_en text,
    tip_text_ar text,
    time_of_day text,
    created_at timestamptz DEFAULT now()
  )`,
];

let setupDone = false;

async function tablesExist(): Promise<boolean> {
  const { error } = await supabase.from("users").select("id").limit(1);
  if (!error) return true;
  const msg = (error.message ?? "").toLowerCase();
  return !msg.includes("schema cache") && !msg.includes("does not exist") && !msg.includes("not found");
}

async function tryExecSql(sql: string): Promise<boolean> {
  const { error } = await supabase.rpc("exec_sql", { sql });
  return !error;
}

export async function runSetup(): Promise<void> {
  if (setupDone) return;
  try {
    // Create storage buckets (non-fatal)
    const buckets = ["stories-audio", "lessons-audio", "game-audio", "user-data"];
    for (const bucket of buckets) {
      await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
    }

    // Check if tables already exist
    if (await tablesExist()) {
      console.log("[setup] ✅ Supabase tables ready");
      setupDone = true;
      return;
    }

    console.log("[setup] Tables not found — attempting to create via exec_sql RPC...");

    let rpcAvailable = false;
    let created = 0;

    for (const stmt of STATEMENTS) {
      const ok = await tryExecSql(stmt);
      if (ok) {
        rpcAvailable = true;
        created++;
      } else if (created === 0) {
        // First statement failed — exec_sql function does not exist
        break;
      }
    }

    if (!rpcAvailable) {
      console.warn(
        "[setup] ⚠️  Could not create tables automatically.\n" +
        "The 'exec_sql' function does not exist in your Supabase project.\n\n" +
        "To enable automatic setup, run this once in Supabase SQL Editor:\n\n" +
        "  CREATE OR REPLACE FUNCTION exec_sql(sql text)\n" +
        "  RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS\n" +
        "  $$ BEGIN EXECUTE sql; END; $$;\n\n" +
        "Then restart the server.  Alternatively, paste the table definitions\n" +
        "from routes/setup.ts into the Supabase SQL Editor and run them manually."
      );
    } else {
      console.log(`[setup] ✅ Created ${created}/${STATEMENTS.length} tables via exec_sql`);
    }

    setupDone = true;
  } catch (err) {
    console.error("[setup] Setup error (non-fatal):", err);
    setupDone = true;
  }
}

router.post("/setup", async (req, res) => {
  try {
    setupDone = false;
    await runSetup();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
