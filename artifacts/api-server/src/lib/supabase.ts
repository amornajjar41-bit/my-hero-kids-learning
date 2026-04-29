import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_KEY"];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "[supabase] SUPABASE_URL and SUPABASE_SERVICE_KEY must be set — " +
    "API calls will fail until these are configured in Vercel environment variables.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseServiceKey ?? "placeholder-key",
  { auth: { persistSession: false } },
);

export type Database = typeof supabase;
