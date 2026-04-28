import { openai } from "./openai";
import { writeFileSync, unlinkSync, createReadStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function extFromMime(mime: string): string {
  if (mime.includes("mp3")) return "mp3";
  if (mime.includes("m4a") || mime.includes("mp4")) return "m4a";
  if (mime.includes("webm")) return "webm";
  return "wav";
}

export async function transcribeAudio(
  audioBase64: string,
  language: "en" | "ar" = "en",
  mimeType = "audio/wav"
): Promise<string> {
  const ext = extFromMime(mimeType);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tmpFile = join(tmpdir(), `adam-stt-${id}.${ext}`);

  try {
    writeFileSync(tmpFile, Buffer.from(audioBase64, "base64"));

    const response = await openai.audio.transcriptions.create({
      file: createReadStream(tmpFile) as unknown as File,
      model: "whisper-1",
      language,
      response_format: "text",
    });

    return (response as unknown as string).trim();
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
