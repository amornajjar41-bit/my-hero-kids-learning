const ASSEMBLYAI_KEY = process.env["ASSEMBLYAI_API_KEY"] ?? "";

const BASE = "https://api.assemblyai.com/v2";
const HEADERS = {
  authorization: ASSEMBLYAI_KEY,
  "content-type": "application/json",
};

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

  // 2. Submit transcription — note: speech_model was deprecated; omitting it uses the default "best" model
  const body: Record<string, unknown> = {
    audio_url: upload_url,
    language_code: language === "ar" ? "ar" : "en_us",
    punctuate: true,
    format_text: true,
  };

  const transcriptRes = await fetch(`${BASE}/transcript`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (!transcriptRes.ok) {
    const t = await transcriptRes.text();
    throw new Error(`AssemblyAI transcript request failed: ${transcriptRes.status} ${t}`);
  }

  const { id } = (await transcriptRes.json()) as { id: string };

  // 3. Poll until completed (max ~32s)
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((r) => setTimeout(r, 800));
    const pollRes = await fetch(`${BASE}/transcript/${id}`, {
      headers: { authorization: ASSEMBLYAI_KEY },
    });
    const data = (await pollRes.json()) as {
      status: string;
      text?: string;
      error?: string;
    };

    if (data.status === "completed") {
      return (data.text ?? "").trim();
    }
    if (data.status === "error") {
      throw new Error(`AssemblyAI error: ${data.error}`);
    }
  }

  throw new Error("AssemblyAI: transcription timed out");
}
