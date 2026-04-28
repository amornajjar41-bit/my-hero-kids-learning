import { Router, type IRouter } from "express";
import { transcribeAudio } from "../lib/assemblyai";

const router: IRouter = Router();

router.post("/transcribe", async (req, res) => {
  try {
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
    const text = await transcribeAudio(audioBase64, lang, mimeType);
    res.json({ text: text.trim() });
  } catch (err) {
    req.log.error({ err }, "transcribe error");
    res.status(500).json({ error: "transcribe failed" });
  }
});

export default router;
