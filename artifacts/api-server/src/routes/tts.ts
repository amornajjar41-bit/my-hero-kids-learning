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

    // Use gpt-audio chat completion (supported via Replit AI Integrations proxy)
    // The standalone /audio/speech endpoint is NOT supported by the proxy.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.chat.completions.create as any)({
      model: "gpt-audio-mini",
      modalities: ["text", "audio"],
      audio: { voice, format: "mp3" },
      messages: [
        {
          role: "system",
          content:
            "You are a text-to-speech engine. Speak the user's exact message in a warm, energetic, child-friendly cartoon-hero voice. Do NOT add words. Do NOT comment. Just read it aloud.",
        },
        { role: "user", content: speechText },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioData = (response.choices[0]?.message as any)?.audio?.data as
      | string
      | undefined;
    if (!audioData) {
      throw new Error("no audio returned");
    }
    const base64 = audioData;
    void speed;

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
