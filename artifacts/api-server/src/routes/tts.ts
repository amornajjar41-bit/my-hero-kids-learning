import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { synthesize, VOICES } from "../lib/edge-tts";
import { supabase } from "../lib/supabase";
import { query, queryOne } from "../lib/db";

const router: IRouter = Router();

// In-memory LRU cache (base64 audio)
const memCache = new Map<string, string>();
const MAX_MEM_CACHE = 500;

function cacheKey(text: string, voice: string): string {
  return createHash("md5").update(`${voice}::${text}`).digest("hex");
}

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

async function getCachedAudioUrl(text: string, voice: string): Promise<string | null> {
  try {
    const key = cacheKey(text, voice);
    const row = await queryOne<{ audio_url: string }>(
      `SELECT audio_url FROM ai_cache WHERE input_hash = $1 AND audio_url IS NOT NULL LIMIT 1`,
      [key]
    );
    return row?.audio_url ?? null;
  } catch {
    return null;
  }
}

async function uploadAudioToStorage(
  audioBuffer: Buffer,
  voice: string,
  textHash: string
): Promise<string | null> {
  try {
    const bucket = voice.includes("ar-SA") ? "stories-audio" : "lessons-audio";
    const path = `tts/${voice}/${textHash}.mp3`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

router.post("/tts", async (req, res) => {
  try {
    const {
      text,
      voice = "echo",
      gender = "boy",
      language = "en",
      maxChars,
    } = req.body as {
      text: string;
      voice?: string;
      gender?: "boy" | "girl";
      language?: "en" | "ar";
      maxChars?: number;
    };

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text required" });
      return;
    }

    const limit = typeof maxChars === "number" && maxChars > 0 ? Math.min(maxChars, 800) : 400;
    const speechText = cleanText(text, limit);

    // Determine Edge TTS voice
    const voiceKey = gender === "girl"
      ? language === "ar" ? "girl-ar" : "girl-en"
      : language === "ar" ? "boy-ar" : "boy-en";
    const edgeVoice = VOICES[voiceKey] ?? VOICES["boy-en"]!;

    const key = cacheKey(speechText, edgeVoice);

    // 1. Check in-memory cache
    if (memCache.has(key)) {
      return res.json({ audioBase64: memCache.get(key), mimeType: "audio/mpeg", cached: true });
    }

    // 2. Check Supabase storage URL cache
    const cachedUrl = await getCachedAudioUrl(speechText, edgeVoice);
    if (cachedUrl) {
      return res.json({ audioUrl: cachedUrl, mimeType: "audio/mpeg", cached: true });
    }

    // 3. Generate with Edge TTS
    const audioBuffer = await synthesize(speechText, edgeVoice);
    const audioBase64 = audioBuffer.toString("base64");

    // Update in-memory cache
    if (memCache.size >= MAX_MEM_CACHE) {
      const firstKey = memCache.keys().next().value;
      if (firstKey) memCache.delete(firstKey);
    }
    memCache.set(key, audioBase64);

    // Upload to Supabase storage async (non-blocking)
    uploadAudioToStorage(audioBuffer, edgeVoice, key)
      .then(async (audioUrl) => {
        if (audioUrl) {
          await query(
            `INSERT INTO ai_cache (input_hash, input_text, response_text, audio_url, language, gender, hit_count, created_at)
             VALUES ($1, $2, '', $3, $4, $5, 0, now())
             ON CONFLICT (input_hash, language) DO UPDATE SET audio_url = EXCLUDED.audio_url`,
            [key, speechText, audioUrl, language, gender]
          );
        }
      })
      .catch(() => {});

    res.json({ audioBase64, mimeType: "audio/mpeg", cached: false });
  } catch (err: any) {
    req.log.error({ err }, "tts error");
    // Fallback: try old gpt-audio-mini
    try {
      const { openai } = await import("../lib/openai");
      const { text, voice = "echo" } = req.body;
      const response = await (openai.chat.completions.create as any)({
        model: "gpt-audio-mini",
        modalities: ["text", "audio"],
        audio: { voice, format: "mp3" },
        messages: [
          { role: "system", content: "Read this text clearly for a child." },
          { role: "user", content: text?.slice(0, 300) ?? "" },
        ],
      });
      const audioData = (response.choices[0]?.message as any)?.audio?.data;
      if (audioData) {
        return res.json({ audioBase64: audioData, mimeType: "audio/mpeg", cached: false, fallback: true });
      }
    } catch {
      // ignore fallback failure
    }
    res.status(500).json({ error: "tts failed" });
  }
});

export default router;
