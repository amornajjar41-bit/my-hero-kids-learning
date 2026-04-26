import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.post("/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/m4a" } = req.body as {
      audioBase64: string;
      mimeType?: string;
    };

    if (!audioBase64) {
      res.status(400).json({ error: "audioBase64 required" });
      return;
    }

    const buffer = Buffer.from(audioBase64, "base64");
    const ext =
      mimeType.includes("webm")
        ? "webm"
        : mimeType.includes("wav")
          ? "wav"
          : mimeType.includes("mp3")
            ? "mp3"
            : mimeType.includes("mp4")
              ? "mp4"
              : "m4a";

    // OpenAI SDK File-style input
    const file = new File([new Uint8Array(buffer)], `audio.${ext}`, {
      type: mimeType,
    });

    const result = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      response_format: "json",
    });

    res.json({ text: result.text });
  } catch (err) {
    req.log.error({ err }, "transcribe error");
    res.status(500).json({ error: "transcribe failed" });
  }
});

export default router;
