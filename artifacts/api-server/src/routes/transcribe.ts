import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { transcribeAudio } from "../lib/assemblyai";

const router: IRouter = Router();

// ── Short-lived dedup cache (prevents double-charging for the same audio) ─────
// Key: MD5 of first 2KB of base64 audio  |  Value: { text, expiresAt }
// TTL: 60 seconds — covers accidental double-taps and retries
const _sttCache = new Map<string, { text: string; expiresAt: number }>();
const STT_CACHE_TTL_MS = 60_000;
const STT_CACHE_MAX = 50;

function sttCacheKey(audioBase64: string): string {
  // Hash only the first 2KB — fast and uniquely identifies the recording
  return createHash("md5").update(audioBase64.slice(0, 2048)).digest("hex");
}

function sttCacheGet(key: string): string | null {
  const entry = _sttCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _sttCache.delete(key);
    return null;
  }
  return entry.text;
}

function sttCacheSet(key: string, text: string): void {
  if (_sttCache.size >= STT_CACHE_MAX) {
    const oldest = _sttCache.keys().next().value;
    if (oldest) _sttCache.delete(oldest);
  }
  _sttCache.set(key, { text, expiresAt: Date.now() + STT_CACHE_TTL_MS });
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post("/transcribe", async (req, res) => {
  const {
    audioBase64,
    mimeType = "audio/wav",
    language,
  } = req.body as {
    audioBase64: string;
    mimeType?: string;
    language?: "en" | "ar";
  };

  if (!audioBase64) {
    res.status(400).json({ error: "audioBase64 required" });
    return;
  }

  const lang: "en" | "ar" = language === "ar" ? "ar" : "en";

  // Check dedup cache first — same audio within 60s returns instantly, zero cost
  const cacheKey = sttCacheKey(audioBase64);
  const cached = sttCacheGet(cacheKey);
  if (cached !== null) {
    res.json({ text: cached, cached: true });
    return;
  }

  try {
    const text = await transcribeAudio(audioBase64, lang, mimeType);
    const trimmed = text.trim();
    // Store result so any retry within 60s is free
    sttCacheSet(cacheKey, trimmed);
    res.json({ text: trimmed });
  } catch (err) {
    req.log.error({ err }, "transcribe error");
    res.json({ text: "", error: "transcribe failed" });
  }
});

export default router;
