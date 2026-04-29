/**
 * Audio transcription via AssemblyAI.
 * Uses the "nano" tier — cheapest plan, excellent accuracy for short kids' questions.
 * Flow: upload raw bytes → submit transcript job → poll until complete.
 */
const ASSEMBLYAI_KEY = process.env["ASSEMBLYAI_API_KEY"] ?? "";

const BASE = "https://api.assemblyai.com/v2";

interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export async function transcribeAudio(
  audioBase64: string,
  language: "en" | "ar" = "en",
  mimeType = "audio/wav"
): Promise<string> {
  if (!ASSEMBLYAI_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY is not set");
  }

  const audioBuffer = Buffer.from(audioBase64, "base64");

  // 1. Upload raw audio bytes
  const uploadRes = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: {
      authorization: ASSEMBLYAI_KEY,
      "content-type": "application/octet-stream",
    },
    body: audioBuffer,
  }) as unknown as HttpResponse;

  if (!uploadRes.ok) {
    const t = await uploadRes.text();
    throw new Error(`AssemblyAI upload failed: ${uploadRes.status} ${t}`);
  }

  const { upload_url } = (await uploadRes.json()) as { upload_url: string };

  // 2. Submit transcription — universal-3-pro for best accuracy
  const body: Record<string, unknown> = {
    audio_url: upload_url,
    speech_models: ["universal-3-pro"],
    language_code: language === "ar" ? "ar" : "en",
    punctuate: true,
    format_text: true,
    disfluencies: false,
  };

  const transcriptRes = await fetch(`${BASE}/transcript`, {
    method: "POST",
    headers: {
      authorization: ASSEMBLYAI_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  }) as unknown as HttpResponse;

  if (!transcriptRes.ok) {
    const t = await transcriptRes.text();
    throw new Error(`AssemblyAI transcript request failed: ${transcriptRes.status} ${t}`);
  }

  const { id } = (await transcriptRes.json()) as { id: string };

  // 3. Poll until complete (max ~30s for kids' short audio), every 400ms
  for (let attempt = 0; attempt < 75; attempt++) {
    await new Promise((r) => setTimeout(r, 400));
    const pollRes = await fetch(`${BASE}/transcript/${id}`, {
      headers: { authorization: ASSEMBLYAI_KEY },
    }) as unknown as HttpResponse;
    const data = (await pollRes.json()) as {
      status: string;
      text?: string;
      error?: string;
      confidence?: number;
    };

    if (data.status === "completed") {
      if (data.confidence !== undefined && data.confidence < 0.25) {
        return "";
      }
      return (data.text ?? "").trim();
    }
    if (data.status === "error") {
      throw new Error(`AssemblyAI error: ${data.error}`);
    }
  }

  throw new Error("AssemblyAI: transcription timed out");
}
