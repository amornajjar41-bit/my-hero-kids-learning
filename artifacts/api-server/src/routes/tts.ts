/**
 * TTS route — POST /api/tts
 *
 * Primary:  OpenAI tts-1 via audio.speech.create  (1–2 s, true MP3)
 * Fallback: gpt-4o-audio-preview via chat completions (same proxy, ~3–5 s)
 * Guard:    10-second hard timeout so nothing ever hangs
 * Cache:    In-memory LRU (up to 500 entries) — instant on repeat requests
 */
import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { openai } from "../lib/openai";

const router: IRouter = Router();

// ── In-memory LRU cache ───────────────────────────────────────────────────────
const memCache = new Map<string, string>(); // key → base64
const MAX_MEM_CACHE = 500;

function cacheKey(text: string, voice: string): string {
  return createHash("md5").update(`${voice}::${text}`).digest("hex");
}

function cacheSet(key: string, value: string): void {
  if (memCache.size >= MAX_MEM_CACHE) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
  memCache.set(key, value);
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

// ── Valid tts-1 / gpt-4o-audio voices ────────────────────────────────────────
const VALID_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "ash", "coral", "sage", "verse", "ballad"]);
function resolveVoice(v: string): string {
  return VALID_VOICES.has(v) ? v : "echo";
}

// ── Hard timeout wrapper ──────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); })
           .catch((e) => { clearTimeout(t); reject(e); });
  });
}

// ── Primary: OpenAI tts-1 ─────────────────────────────────────────────────────
async function synthesizeTTS1(text: string, voice: string): Promise<string> {
  const response = await withTimeout(
    openai.audio.speech.create({
      model: "tts-1",
      voice: resolveVoice(voice) as any,
      input: text,
      response_format: "mp3",
    }),
    9000,
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

// ── Fallback: gpt-4o-audio-preview via chat completions ──────────────────────
async function synthesizeAudioPreview(text: string, voice: string): Promise<string | null> {
  try {
    const response = await withTimeout(
      (openai.chat.completions.create as any)({
        model: "gpt-4o-audio-preview",
        modalities: ["text", "audio"],
        audio: { voice: resolveVoice(voice), format: "mp3" },
        messages: [
          { role: "system", content: "Read the following text clearly for a child. Do not add anything extra." },
          { role: "user", content: text.slice(0, 300) },
        ],
        max_tokens: 1,
      }),
      9000,
    );
    return (response.choices[0]?.message as any)?.audio?.data ?? null;
  } catch {
    return null;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/tts", async (req, res) => {
  const {
    text,
    voice = "echo",
    maxChars,
  } = req.body as {
    text?: string;
    voice?: string;
    maxChars?: number;
  };

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text required" });
    return;
  }

  const limit = typeof maxChars === "number" && maxChars > 0 ? Math.min(maxChars, 400) : 400;
  const speechText = cleanText(text, limit);
  const safeVoice = resolveVoice(voice);
  const key = cacheKey(speechText, safeVoice);

  // 1. Serve from in-memory cache instantly
  if (memCache.has(key)) {
    res.json({ audioBase64: memCache.get(key), mimeType: "audio/mpeg", cached: true });
    return;
  }

  // 2. Try OpenAI tts-1
  try {
    const audioBase64 = await synthesizeTTS1(speechText, safeVoice);
    cacheSet(key, audioBase64);
    res.json({ audioBase64, mimeType: "audio/mpeg", cached: false });
    return;
  } catch (err: any) {
    req.log.warn({ err: err?.message }, "tts-1 failed, trying audio-preview fallback");
  }

  // 3. Fallback: gpt-4o-audio-preview
  const fallbackBase64 = await synthesizeAudioPreview(speechText, safeVoice);
  if (fallbackBase64) {
    cacheSet(key, fallbackBase64);
    res.json({ audioBase64: fallbackBase64, mimeType: "audio/mpeg", cached: false, fallback: true });
    return;
  }

  // 4. Both failed — return a graceful error (no silent hang)
  req.log.error("tts: both tts-1 and audio-preview failed");
  res.status(500).json({ error: "tts failed" });
});

export default router;
