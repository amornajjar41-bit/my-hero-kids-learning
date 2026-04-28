import { Router, type IRouter } from "express";
import { transcribeAudio } from "../lib/assemblyai";

const router: IRouter = Router();

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

  // ── Primary: AssemblyAI ────────────────────────────────────────────────────
  try {
    const text = await transcribeAudio(audioBase64, lang, mimeType);
    res.json({ text: text.trim() });
    return;
  } catch (primaryErr) {
    req.log.warn({ err: primaryErr }, "AssemblyAI failed — falling back to Whisper");
  }

  // ── Fallback: OpenAI Whisper ───────────────────────────────────────────────
  try {
    const { openai } = await import("../lib/openai");
    const { writeFileSync, unlinkSync, createReadStream } = await import("fs");
    const { tmpdir } = await import("os");
    const { join } = await import("path");

    function extFromMime(mime: string): string {
      if (mime.includes("mp3")) return "mp3";
      if (mime.includes("m4a") || mime.includes("mp4")) return "m4a";
      if (mime.includes("webm")) return "webm";
      return "wav";
    }

    const ext = extFromMime(mimeType);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmpFile = join(tmpdir(), `adam-stt-${id}.${ext}`);

    try {
      writeFileSync(tmpFile, Buffer.from(audioBase64, "base64"));
      const response = await openai.audio.transcriptions.create({
        file: createReadStream(tmpFile) as unknown as File,
        model: "whisper-1",
        language: lang,
        response_format: "text",
      });
      const text = (response as unknown as string).trim();
      res.json({ text, fallback: true });
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  } catch (fallbackErr) {
    req.log.error({ err: fallbackErr }, "transcribe fallback also failed");
    res.status(500).json({ error: "transcribe failed" });
  }
});

export default router;
