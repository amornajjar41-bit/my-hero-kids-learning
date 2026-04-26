import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

// Derive the audio format label from the MIME type string
function fmtFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("wav"))  return "wav";
  if (mime.includes("mp3"))  return "mp3";
  if (mime.includes("ogg"))  return "ogg";
  if (mime.includes("flac")) return "flac";
  if (mime.includes("m4a") || mime.includes("mp4")) return "mp4";
  return "webm"; // safe default for web browsers
}

router.post("/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body as {
      audioBase64: string;
      mimeType?: string;
    };

    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 required" });
      return;
    }

    const fmt = fmtFromMime(mimeType);

    // The Replit AI proxy does NOT have whisper-1 deployed.
    // Use gpt-audio-mini (same model used for TTS) via chat completions,
    // but with audio INPUT and text-only OUTPUT.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.chat.completions.create as any)({
      model: "gpt-audio-mini",
      modalities: ["text"],
      messages: [
        {
          role: "system",
          content:
            "You are a transcription engine. The user will send you an audio clip. " +
            "Return ONLY the exact words spoken — no punctuation commentary, no labels, " +
            "no extra text. If the audio is silent or unclear, return an empty string.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: audioBase64,
                format: fmt,
              },
            },
          ],
        },
      ],
    });

    const text: string = response.choices[0]?.message?.content ?? "";
    res.json({ text: text.trim() });
  } catch (err) {
    req.log.error({ err }, "transcribe error");
    res.status(500).json({ error: "transcribe failed" });
  }
});

export default router;
