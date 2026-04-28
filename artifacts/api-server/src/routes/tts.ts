/**
 * TTS route — POST /api/tts
 *
 * Uses Google Cloud Text-to-Speech (WaveNet) for high-quality bilingual audio.
 * Auto-detects Arabic vs English from the text content and picks the right voice.
 *
 * Voices:
 *   English boy  → en-US-Wavenet-D  (male, warm)
 *   English girl → en-US-Wavenet-F  (female, clear)
 *   Arabic  boy  → ar-XA-Wavenet-B  (male)
 *   Arabic  girl → ar-XA-Wavenet-A  (female)
 *
 * In-memory LRU cache (500 entries) for instant replays.
 * Hard 12-second timeout — never hangs on a bad request.
 */
import { Router, type IRouter } from "express";
import { createHash } from "crypto";

const router: IRouter = Router();

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

// ── In-memory LRU cache ───────────────────────────────────────────────────────
const memCache = new Map<string, string>(); // key → base64 MP3
const MAX_CACHE = 500;

function cacheSet(key: string, value: string): void {
  if (memCache.size >= MAX_CACHE) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
  memCache.set(key, value);
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
    name: female ? "en-US-Wavenet-F" : "en-US-Wavenet-D",
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
    }),
    12000,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Google TTS ${response.status}: ${errText}`);
  }

  const data = await response.json() as { audioContent?: string };
  if (!data.audioContent) throw new Error("Google TTS: no audioContent in response");

  return data.audioContent; // already base64
}

// ── Speaking rate from age group ─────────────────────────────────────────────
function speakingRateFromAge(ageGroup?: string): number {
  // Young children (4-6) need a slower, clearer voice
  if (ageGroup === "4-6") return 0.78;
  // Older children: normal pace
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
  const key = cacheKey(speechText, voice + (ageGroup ?? ""));

  // Serve from cache instantly
  if (memCache.has(key)) {
    res.json({ audioBase64: memCache.get(key), mimeType: "audio/mpeg", cached: true });
    return;
  }

  try {
    const audioBase64 = await synthesizeWavenet(speechText, voice, rate);
    cacheSet(key, audioBase64);
    res.json({ audioBase64, mimeType: "audio/mpeg", cached: false });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Google WaveNet TTS failed");
    res.status(500).json({ error: "tts failed" });
  }
});

// ── Story TTS endpoint (Google Neural2 — warm, natural, non-robotic) ─────────
// Uses Neural2-F for EN (natural female) and Wavenet-A for AR (best Arabic female)
// Completely separate from WaveNet chat TTS. Slower rate, slightly warmer pitch.
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
  const pitch        = voiceLang === "ar" ? 0.0  : 2.0;

  const cacheK = createHash("md5").update(`story-neural::${voiceLang}::${text.slice(0, 300)}`).digest("hex");
  if (memCache.has(cacheK)) {
    res.json({ base64: memCache.get(cacheK), mimeType: "audio/mpeg", cached: true });
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
    });
    if (!resp.ok) throw new Error(`Google TTS ${resp.status}`);
    const data = await resp.json() as { audioContent?: string };
    if (!data.audioContent) throw new Error("no audioContent");
    cacheSet(cacheK, data.audioContent);
    res.json({ base64: data.audioContent, mimeType: "audio/mpeg", cached: false });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Story TTS (Neural2) failed");
    res.status(500).json({ error: "story tts failed" });
  }
});

export default router;
