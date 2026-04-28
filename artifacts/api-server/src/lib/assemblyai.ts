const ASSEMBLYAI_KEY = process.env["ASSEMBLYAI_API_KEY"] ?? "";

const BASE = "https://api.assemblyai.com/v2";

export async function transcribeAudio(
  audioBase64: string,
  language: "en" | "ar" = "en",
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
  });

  if (!uploadRes.ok) {
    const t = await uploadRes.text();
    throw new Error(`AssemblyAI upload failed: ${uploadRes.status} ${t}`);
  }

  const { upload_url } = (await uploadRes.json()) as { upload_url: string };

  // 2. Submit transcription
  //
  // Key fixes:
  //   - Field is `speech_model` (singular string), NOT `speech_models` (array)
  //   - Arabic requires `speech_model: "universal"` — the "best" model is EN-only
  //   - English uses `speech_model: "best"` for highest accuracy
  //   - `language_detection: true` handles code-switching (child mixes AR+EN)
  //   - `punctuate` and `format_text` improve readability of transcribed output
  const body: Record<string, unknown> = {
    audio_url: upload_url,
    punctuate: true,
    format_text: true,
  };

  if (language === "ar") {
    body.speech_model = "universal";
    body.language_code = "ar";
    body.language_detection = true;
  } else {
    body.speech_model = "best";
    body.language_code = "en_us";
  }

  const transcriptRes = await fetch(`${BASE}/transcript`, {
    method: "POST",
    headers: {
      authorization: ASSEMBLYAI_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!transcriptRes.ok) {
    const t = await transcriptRes.text();
    throw new Error(`AssemblyAI transcript request failed: ${transcriptRes.status} ${t}`);
  }

  const { id } = (await transcriptRes.json()) as { id: string };

  // 3. Poll until completed (max ~40s)
  for (let attempt = 0; attempt < 50; attempt++) {
    await new Promise((r) => setTimeout(r, 800));
    const pollRes = await fetch(`${BASE}/transcript/${id}`, {
      headers: { authorization: ASSEMBLYAI_KEY },
    });
    const data = (await pollRes.json()) as {
      status: string;
      text?: string;
      error?: string;
      confidence?: number;
    };

    if (data.status === "completed") {
      // If overall confidence is very low (below 30%), likely silence or noise
      if (data.confidence !== undefined && data.confidence < 0.30) {
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
