/**
 * Audio transcription via OpenAI Whisper.
 * Single synchronous API call — replaces the old AssemblyAI upload+poll cycle.
 * Cost: $0.006 / minute (billed per second, min 1 s).
 * Supports English and Arabic natively.
 */
import { openai } from "./openai.js";
import { toFile } from "openai";

export async function transcribeAudio(
  audioBase64: string,
  language: "en" | "ar" = "en",
  mimeType = "audio/wav"
): Promise<string> {
  const audioBuffer = Buffer.from(audioBase64, "base64");

  const ext = mimeType.includes("mp3") ? "mp3"
    : mimeType.includes("m4a") ? "m4a"
    : mimeType.includes("ogg") ? "ogg"
    : "wav";

  const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

  const result = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: language === "ar" ? "ar" : "en",
    response_format: "text",
  });

  return (typeof result === "string" ? result : (result as any).text ?? "").trim();
}
