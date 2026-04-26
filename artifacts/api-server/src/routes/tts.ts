import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

const cache = new Map<string, string>();
const MAX_CACHE = 1000;

function cacheKey(text: string, voice: string, contentType: string) {
  return `${voice}::${contentType}::${text}`;
}

function summarizeForSpeech(text: string, maxChars = 320): string {
  const cleaned = text
    // eslint-disable-next-line no-misleading-character-class
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

/** Insert natural pauses after sentence-ending punctuation for calmer speech. */
function addPauses(text: string): string {
  // Add a short pause marker after sentence ends (the TTS engine uses commas as breath points)
  return text
    .replace(/([.!?؟])\s+/g, "$1 ... ")
    .replace(/([،,])\s+/g, "$1 ");
}

router.post("/tts", async (req, res) => {
  try {
    const {
      text,
      voice = "echo",
      speed = 1.0,
      maxChars,
      contentType = "explanation",
    } = req.body as {
      text: string;
      voice?: string;
      speed?: number;
      maxChars?: number;
      contentType?: "explanation" | "greeting" | "celebration" | "story";
    };

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text required" });
      return;
    }

    const limit = typeof maxChars === "number" && maxChars > 0 ? Math.min(maxChars, 800) : 320;
    let speechText = summarizeForSpeech(text, limit);

    // For educational explanations and stories, add natural pauses
    if (contentType === "explanation" || contentType === "story") {
      speechText = addPauses(speechText);
    }

    const key = cacheKey(speechText, voice, contentType);
    if (cache.has(key)) {
      res.json({ audioBase64: cache.get(key), mimeType: "audio/mpeg", cached: true });
      return;
    }

    // Build a content-type-appropriate system prompt
    const voiceStyle = (() => {
      switch (contentType) {
        case "explanation":
          return "You are a patient, calm, and warm teacher reading educational content to a child. Speak SLOWLY and CLEARLY at about 0.85x normal pace. Pause naturally between sentences. Your tone is kind, steady, and encouraging — like a caring teacher explaining something important. Never rush.";
        case "story":
          return "You are a warm, engaging storyteller reading a bedtime story to a child. Speak at a calm, soothing pace — slightly slower than normal. Add gentle expression to characters and exciting moments, but always remain calm and relaxing. Your voice should make the child feel safe and curious.";
        case "celebration":
          return "You are an enthusiastic cartoon superhero celebrating a child's achievement! Speak with energy, joy, and excitement. Use a cheerful, upbeat tone. You are SO proud of this child!";
        case "greeting":
          return "You are a friendly, warm cartoon hero greeting a child. Speak naturally, warmly, and with a gentle smile in your voice.";
        default:
          return "You are a warm, patient, child-friendly voice. Speak clearly and at a comfortable pace.";
      }
    })();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.chat.completions.create as any)({
      model: "gpt-audio-mini",
      modalities: ["text", "audio"],
      audio: { voice, format: "mp3" },
      messages: [
        { role: "system", content: voiceStyle },
        { role: "user", content: speechText },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioData = (response.choices[0]?.message as any)?.audio?.data as string | undefined;
    if (!audioData) throw new Error("no audio returned");

    void speed;

    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, audioData);

    res.json({ audioBase64: audioData, mimeType: "audio/mpeg", cached: false });
  } catch (err) {
    req.log.error({ err }, "tts error");
    res.status(500).json({ error: "tts failed" });
  }
});

export default router;
