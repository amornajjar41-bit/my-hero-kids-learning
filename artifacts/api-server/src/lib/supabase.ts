import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_KEY"];

function isValidUrl(s: string | undefined): boolean {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const resolvedUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : "https://placeholder.supabase.co";
const resolvedKey = (supabaseServiceKey && supabaseServiceKey.length > 10)
  ? supabaseServiceKey
  : "placeholder-key";

if (!isValidUrl(supabaseUrl)) {
  console.error(
    "[supabase] SUPABASE_URL is missing or invalid — " +
    "set it in Vercel environment variables to a valid https:// URL. " +
    `Received: ${JSON.stringify(supabaseUrl)}`
  );
}
if (!supabaseServiceKey || supabaseServiceKey.length < 10) {
  console.error(
    "[supabase] SUPABASE_SERVICE_KEY is missing — " +
    "set it in Vercel environment variables."
  );
}

export const supabase = createClient(resolvedUrl, resolvedKey, {
  auth: { persistSession: false },
});

export type Database = typeof supabase;
