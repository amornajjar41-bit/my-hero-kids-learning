/**
 * TTS route — POST /api/tts
 *
 * Uses Google Cloud Text-to-Speech (Neural2) for high-quality audio.
 * Auto-detects Arabic vs English and picks the right voice.
 *
 * Voices:
 *   English boy  → en-US-Neural2-D  (male, warm, natural)
 *   English girl → en-US-Neural2-F  (female, warm, natural)
 *   Arabic  boy  → ar-XA-Wavenet-B  (male)
 *   Arabic  girl → ar-XA-Wavenet-A  (female)
 *
 * Cache layers (fastest → slowest):
 *   1. In-memory LRU (500 entries) — sub-millisecond
 *   2. Supabase Storage tts-cache bucket — persistent across restarts/instances
 *   3. Google TTS API — only called when text is truly new
 *
 * Hard 12-second timeout — never hangs on a bad request.
 */
import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { supabase } from "../lib/supabase.js";

const router: IRouter = Router();

interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const TTS_BUCKET = "tts-cache";

// ── In-memory LRU cache (L1) ──────────────────────────────────────────────────
const memCache = new Map<string, string>(); // key → base64 MP3
const MAX_CACHE = 500;

function cacheSet(key: string, value: string): void {
  if (memCache.size >= MAX_CACHE) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
  memCache.set(key, value);
}

// ── Supabase Storage cache (L2) ───────────────────────────────────────────────
function storageKey(text: string, voice: string, ageGroup?: string): string {
  const raw = `${voice}::${ageGroup ?? ""}::${text}`;
  return createHash("sha256").update(raw).digest("hex");
}

async function storageGet(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(TTS_BUCKET).download(`${key}.mp3`);
    if (error || !data) return null;
    const buf = await data.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch {
    return null;
  }
}

async function storageSet(key: string, base64: string): Promise<void> {
  try {
    const buf = Buffer.from(base64, "base64");
    await supabase.storage.from(TTS_BUCKET).upload(`${key}.mp3`, buf, {
      contentType: "audio/mpeg",
      upsert: true,
    });
  } catch {
    // Non-fatal — L1 memory cache still works this session
  }
}

function cacheKey(text: string, voice: string): string {
  return createHash("md5").update(`${voice}::${text}`).digest("hex");
}

// ── Language & voice detection ────────────────────────────────────────────────
function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

interface VoiceParams {
  languageCode: string;
  name: string;
  ssmlGender: "MALE" | "FEMALE";
}

function resolveVoice(text: string, voice: string): VoiceParams {
  const female = voice === "nova";
  if (isArabic(text)) {
    return {
      languageCode: "ar-XA",
      name: female ? "ar-XA-Wavenet-A" : "ar-XA-Wavenet-B",
      ssmlGender: female ? "FEMALE" : "MALE",
    };
  }
  return {
    languageCode: "en-US",
    name: female ? "en-US-Neural2-F" : "en-US-Neural2-D",
    ssmlGender: female ? "FEMALE" : "MALE",
  };
}

// ── Text sanitiser ────────────────────────────────────────────────────────────
function cleanText(text: string, maxChars = 400): string {
  const cleaned = text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu, "")
    .replace(/\*\*/g, "")
    .replace(/[*_`#]/g, "")
    .trim();
  if (cleaned.length <= maxChars) return cleaned;
  const sentences = cleaned.split(/(?<=[.!?؟])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).trim().length > maxChars) break;
    out = (out + " " + s).trim();
  }
  return out || cleaned.slice(0, maxChars);
}

// ── Hard timeout wrapper ──────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise
      .then((v) => { clearTimeout(t); resolve(v); })
      .catch((e) => { clearTimeout(t); reject(e); });
  });
}

// ── Google WaveNet synthesis ──────────────────────────────────────────────────
async function synthesizeWavenet(text: string, voice: string, speakingRate = 0.90): Promise<string> {
  const apiKey = process.env["GOOGLE_TTS_API_KEY"];
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY not set");

  const voiceParams = resolveVoice(text, voice);

  const response = await withTimeout(
    fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: voiceParams,
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate,
          pitch: voiceParams.ssmlGender === "FEMALE" ? 3.0 : 1.0,
        },
      }),
    }) as Promise<unknown> as Promise<HttpResponse>,
    12000,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Google TTS ${response.status}: ${errText}`);
  }

  const data = await response.json() as { audioContent?: string };
  if (!data.audioContent) throw new Error("Google TTS: no audioContent in response");

  return data.audioContent;
}

// ── Speaking rate from age group ─────────────────────────────────────────────
function speakingRateFromAge(ageGroup?: string): number {
  if (ageGroup === "4-6") return 0.78;
  return 0.90;
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/tts", async (req, res) => {
  const {
    text,
    voice = "echo",
    maxChars,
    ageGroup,
  } = req.body as { text?: string; voice?: string; maxChars?: number; ageGroup?: string };

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text required" });
    return;
  }

  const limit = typeof maxChars === "number" && maxChars > 0 ? Math.min(maxChars, 400) : 400;
  const speechText = cleanText(text, limit);
  const rate = speakingRateFromAge(ageGroup);

  // L1: in-memory cache (sub-ms)
  const memKey = cacheKey(speechText, voice + (ageGroup ?? ""));
  if (memCache.has(memKey)) {
    res.json({ audioBase64: memCache.get(memKey), mimeType: "audio/mpeg", cached: true });
    return;
  }

  // L2: Supabase Storage (persistent across restarts)
  const sKey = storageKey(speechText, voice, ageGroup);
  const stored = await storageGet(sKey);
  if (stored) {
    cacheSet(memKey, stored); // promote to L1
    res.json({ audioBase64: stored, mimeType: "audio/mpeg", cached: true });
    return;
  }

  // L3: Google TTS (first time only)
  try {
    const audioBase64 = await synthesizeWavenet(speechText, voice, rate);
    cacheSet(memKey, audioBase64);
    storageSet(sKey, audioBase64).catch(() => {}); // non-blocking upload
    res.json({ audioBase64, mimeType: "audio/mpeg", cached: false });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Google WaveNet TTS failed");
    res.status(500).json({ error: "tts failed" });
  }
});

// ── Story TTS endpoint (Google Neural2 — warm, natural, non-robotic) ─────────
router.post("/tts/edge-story", async (req, res) => {
  const { text, lang = "en" } = req.body as { text?: string; lang?: string };

  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }

  const voiceLang: "en" | "ar" = lang === "ar" ? "ar" : "en";
  const voiceParams = voiceLang === "ar"
    ? { languageCode: "ar-XA", name: "ar-XA-Wavenet-A", ssmlGender: "FEMALE" }
    : { languageCode: "en-US", name: "en-US-Neural2-F", ssmlGender: "FEMALE" };
  const speakingRate = voiceLang === "ar" ? 0.76 : 0.78;
  const pitch        = voiceLang === "ar" ? 0.0 : 2.0;

  // L1: in-memory
  const memKey = createHash("md5").update(`story-neural::${voiceLang}::${text.slice(0, 300)}`).digest("hex");
  if (memCache.has(memKey)) {
    res.json({ base64: memCache.get(memKey), mimeType: "audio/mpeg", cached: true });
    return;
  }

  // L2: Supabase Storage
  const sKey = storageKey(text.slice(0, 300), `story-${voiceLang}`, undefined);
  const stored = await storageGet(sKey);
  if (stored) {
    cacheSet(memKey, stored);
    res.json({ base64: stored, mimeType: "audio/mpeg", cached: true });
    return;
  }

  const apiKey = process.env["GOOGLE_TTS_API_KEY"];
  if (!apiKey) { res.status(500).json({ error: "TTS key not configured" }); return; }

  try {
    const resp = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: voiceParams,
        audioConfig: { audioEncoding: "MP3", speakingRate, pitch },
      }),
    }) as unknown as HttpResponse;
    if (!resp.ok) throw new Error(`Google TTS ${resp.status}`);
    const data = await resp.json() as { audioContent?: string };
    if (!data.audioContent) throw new Error("no audioContent");
    cacheSet(memKey, data.audioContent);
    storageSet(sKey, data.audioContent).catch(() => {}); // non-blocking
    res.json({ base64: data.audioContent, mimeType: "audio/mpeg", cached: false });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Story TTS (Neural2) failed");
    res.status(500).json({ error: "story tts failed" });
  }
});

export default router;
