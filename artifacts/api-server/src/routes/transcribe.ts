import { Router, type IRouter } from "express";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { openai } from "../lib/openai";

const router: IRouter = Router();

function extFromMime(mime: string): string {
  if (mime.includes("wav"))  return "wav";
  if (mime.includes("mp3"))  return "mp3";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg"))  return "ogg";
  if (mime.includes("flac")) return "flac";
  if (mime.includes("m4a") || mime.includes("mp4")) return "m4a";
  return "wav";
}

/** Convert any audio → 16-kHz mono WAV via ffmpeg (fallback for native formats). */
function toWavBase64(inputBase64: string, inputExt: string): string {
  const id  = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inp = join(tmpdir(), `adam-in-${id}.${inputExt}`);
  const out = join(tmpdir(), `adam-out-${id}.wav`);
  writeFileSync(inp, Buffer.from(inputBase64, "base64"));
  try {
    execSync(`ffmpeg -y -i "${inp}" -ar 16000 -ac 1 -f wav "${out}"`, { stdio: "pipe" });
    return readFileSync(out).toString("base64");
  } finally {
    for (const f of [inp, out]) { try { unlinkSync(f); } catch { /* ignore */ } }
  }
}

router.post("/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/wav", language } = req.body as {
      audioBase64: string;
      mimeType?: string;
      language?: "en" | "ar";
    };

    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 required" });
      return;
    }

    const ext = extFromMime(mimeType);

    // The proxy only accepts "wav" or "mp3".
    // Web client now sends WAV directly — no conversion needed.
    // For native (m4a, ogg, webm), convert with ffmpeg.
    let finalBase64 = audioBase64;
    let finalFmt: "wav" | "mp3" = "wav";

    if (ext === "wav") {
      finalBase64 = audioBase64;
      finalFmt = "wav";
    } else if (ext === "mp3") {
      finalBase64 = audioBase64;
      finalFmt = "mp3";
    } else {
      // Convert to WAV via ffmpeg
      finalBase64 = toWavBase64(audioBase64, ext);
      finalFmt = "wav";
    }

    const langInstruction = language === "ar"
      ? "The speaker is using ARABIC. You MUST transcribe Arabic speech only and return Arabic text in Arabic script. Do NOT transliterate or translate. If the speech sounds like Arabic, output it in Arabic."
      : "The speaker is using English. Transcribe English speech only.";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.chat.completions.create as any)({
      model: "gpt-audio-mini",
      modalities: ["text"],
      messages: [
        {
          role: "system",
          content:
            `You are a speech transcription engine. ${langInstruction} ` +
            "Return ONLY the exact words spoken — no labels, no punctuation commentary, no extra text. " +
            "If silent or unclear, return an empty string.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: { data: finalBase64, format: finalFmt },
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
