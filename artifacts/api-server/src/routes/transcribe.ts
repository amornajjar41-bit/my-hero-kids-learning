import { Router, type IRouter } from "express";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { openai } from "../lib/openai";

const router: IRouter = Router();

// Derive a file extension from MIME type
function extFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("wav"))  return "wav";
  if (mime.includes("mp3"))  return "mp3";
  if (mime.includes("ogg"))  return "ogg";
  if (mime.includes("flac")) return "flac";
  if (mime.includes("m4a") || mime.includes("mp4")) return "m4a";
  return "webm";
}

/**
 * Convert any audio to 16-kHz mono WAV using ffmpeg.
 * The Replit AI proxy only accepts 'wav' or 'mp3' as input_audio format.
 * Returns base64-encoded WAV.
 */
function toWav(inputBase64: string, inputExt: string): string {
  const id   = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inp  = join(tmpdir(), `adam-in-${id}.${inputExt}`);
  const out  = join(tmpdir(), `adam-out-${id}.wav`);

  writeFileSync(inp, Buffer.from(inputBase64, "base64"));
  try {
    execSync(
      `ffmpeg -y -i "${inp}" -ar 16000 -ac 1 -f wav "${out}"`,
      { stdio: "pipe" },
    );
    const wav = readFileSync(out);
    return wav.toString("base64");
  } finally {
    for (const f of [inp, out]) {
      try { unlinkSync(f); } catch { /* ignore */ }
    }
  }
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

    const ext = extFromMime(mimeType);

    // Convert to WAV (supported by proxy; webm/m4a/ogg are NOT)
    const wavBase64 = toWav(audioBase64, ext);

    // Use gpt-audio-mini via chat completions with audio INPUT + text OUTPUT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.chat.completions.create as any)({
      model: "gpt-audio-mini",
      modalities: ["text"],
      messages: [
        {
          role: "system",
          content:
            "You are a transcription engine. " +
            "Return ONLY the exact words spoken in the audio — nothing else. " +
            "If the audio is silent or completely unclear, return an empty string.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: { data: wavBase64, format: "wav" },
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
