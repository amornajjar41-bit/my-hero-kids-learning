import { Router, type IRouter } from "express";
import { transcribeAudio } from "../lib/assemblyai";

const router: IRouter = Router();

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

    const lang: "en" | "ar" = language === "ar" ? "ar" : "en";
    const text = await transcribeAudio(audioBase64, lang);

    res.json({ text: text.trim() });
  } catch (err) {
    req.log.error({ err }, "transcribe error");
    // Fallback to gpt-audio-mini
    try {
      const { audioBase64, mimeType = "audio/wav", language } = req.body;
      const { execSync } = await import("child_process");
      const { writeFileSync, readFileSync, unlinkSync } = await import("fs");
      const { tmpdir } = await import("os");
      const { join } = await import("path");
      const { openai } = await import("../lib/openai");

      function extFromMime(mime: string): string {
        if (mime.includes("wav")) return "wav";
        if (mime.includes("mp3")) return "mp3";
        if (mime.includes("webm")) return "webm";
        if (mime.includes("m4a") || mime.includes("mp4")) return "m4a";
        return "wav";
      }

      const ext = extFromMime(mimeType);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const inp = join(tmpdir(), `adam-in-${id}.${ext}`);
      const out = join(tmpdir(), `adam-out-${id}.wav`);
      writeFileSync(inp, Buffer.from(audioBase64, "base64"));

      let finalBase64 = audioBase64;
      let finalFmt: "wav" | "mp3" = "wav";

      if (ext === "wav") {
        finalBase64 = audioBase64;
        finalFmt = "wav";
      } else if (ext === "mp3") {
        finalBase64 = audioBase64;
        finalFmt = "mp3";
      } else {
        execSync(`ffmpeg -y -i "${inp}" -ar 16000 -ac 1 -f wav "${out}"`, { stdio: "pipe" });
        finalBase64 = readFileSync(out).toString("base64");
        finalFmt = "wav";
        for (const f of [inp, out]) { try { unlinkSync(f); } catch { /**/ } }
      }

      const langInstruction = language === "ar"
        ? "The speaker is using ARABIC. Return Arabic text in Arabic script only."
        : "The speaker is using English. Transcribe English speech only.";

      const response = await (openai.chat.completions.create as any)({
        model: "gpt-audio-mini",
        modalities: ["text"],
        messages: [
          { role: "system", content: `Speech transcription engine. ${langInstruction} Return ONLY the exact words. If silent, return empty string.` },
          { role: "user", content: [{ type: "input_audio", input_audio: { data: finalBase64, format: finalFmt } }] },
        ],
      });

      const text: string = response.choices[0]?.message?.content ?? "";
      return res.json({ text: text.trim(), fallback: true });
    } catch {
      res.status(500).json({ error: "transcribe failed" });
    }
  }
});

export default router;
