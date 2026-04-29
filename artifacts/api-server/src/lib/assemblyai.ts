const ASSEMBLYAI_KEY = process.env["ASSEMBLYAI_API_KEY"] ?? "";

const BASE = "https://api.assemblyai.com/v2";

// Explicit fetch response shape — avoids express.Response vs globalThis.Response ambiguity
interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export async function transcribeAudio(
  audioBase64: string,
  _language: "en" | "ar" = "en",
  _mimeType = "audio/wav"
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

  // 2. Submit transcription — English only, universal-3-pro for best accuracy
  // Note: AssemblyAI deprecated "speech_model" (string) — must use "speech_models" (array)
  const body: Record<string, unknown> = {
    audio_url: upload_url,
    speech_models: ["universal-3-pro"],
    language_code: "en",
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

  // 3. Poll until completed (max ~40s), checking every 400ms for low latency
  for (let attempt = 0; attempt < 100; attempt++) {
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
      // If overall confidence is very low (below 25%), likely silence or noise
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
