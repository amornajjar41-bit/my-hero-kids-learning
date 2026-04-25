import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

const cache = new Map<string, string>();
const MAX_CACHE = 1000;

function cacheKey(text: string, voice: string) {
  return `${voice}::${text}`;
}

function summarizeForSpeech(text: string, maxChars = 220): string {
  // Strip emojis and special markdown for cleaner speech
  const cleaned = text
    // eslint-disable-next-line no-misleading-character-class
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu,
      "",
    )
    .replace(/\*\*/g, "")
    .replace(/[*_`#]/g, "")
    .trim();
  if (cleaned.length <= maxChars) return cleaned;
  // Take first sentences up to maxChars
  const sentences = cleaned.split(/(?<=[.!?؟])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).trim().length > maxChars) break;
    out = (out + " " + s).trim();
  }
  return out || cleaned.slice(0, maxChars);
}

router.post("/tts", async (req, res) => {
  try {
    const {
      text,
      voice = "echo",
      speed = 1.1,
    } = req.body as {
      text: string;
      voice?: string;
      speed?: number;
    };

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text required" });
      return;
    }

    const speechText = summarizeForSpeech(text);
    const key = cacheKey(speechText, voice);

    if (cache.has(key)) {
      res.json({ audio: cache.get(key), cached: true });
      return;
    }

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice as "alloy" | "echo" | "fable" | "nova" | "shimmer" | "onyx",
      input: speechText,
      speed,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");

    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, base64);

    res.json({ audio: base64, cached: false });
  } catch (err) {
    req.log.error({ err }, "tts error");
    res.status(500).json({ error: "tts failed" });
  }
});

export default router;
