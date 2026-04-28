import WebSocket from "ws";
import { randomUUID, createHmac } from "crypto";

// Correct 32-char Microsoft Edge TTS trusted token
const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
// Required since ~2024: Sec-MS-GEC header version
const SEC_MS_GEC_VERSION = "1-130102942875765823";

/**
 * Compute the Sec-MS-GEC HMAC token Microsoft Edge TTS now requires.
 * Algorithm mirrors the edge-tts Python library implementation:
 *  - Convert Unix time to Windows ticks (100-ns units from 1601-01-01)
 *  - Round down to 3-second boundary (30,000,000 ticks)
 *  - HMAC-SHA256(tick_string, TRUSTED_TOKEN.toUpperCase()) → hex uppercase
 */
function genSecMsGec(): string {
  const WIN_EPOCH_OFFSET = BigInt(11644473600); // seconds between 1601 and 1970
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const ticks = (nowSec + WIN_EPOCH_OFFSET) * BigInt(10_000_000); // 100-ns ticks
  const rounded = ticks - (ticks % BigInt(30_000_000)); // 3-second boundary
  return createHmac("sha256", TRUSTED_TOKEN.toUpperCase())
    .update(rounded.toString())
    .digest("hex")
    .toUpperCase();
}

const WSS_BASE = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

// ── Voice registry ────────────────────────────────────────────────────────────
// Stories use Ana (warm young girl EN) and Zariyah (Arabic)
// Lesson/chat voices remain on WaveNet (see tts.ts)
export const STORY_VOICES: Record<"en" | "ar", string> = {
  en: "en-US-AnaNeural",   // Ana — young, warm, natural girl voice
  ar: "ar-SA-ZariyahNeural", // Zariyah — clear, warm Arabic female
};

// Legacy map kept for any future extension
export const VOICES: Record<string, string> = {
  "boy-en": "en-US-GuyNeural",
  "boy-ar": "ar-SA-HamedNeural",
  "girl-en": "en-US-AnaNeural",
  "girl-ar": "ar-SA-ZariyahNeural",
};

function tsNow(): string {
  return new Date().toISOString().replace(/\.\d+/, "");
}

function buildConfig(): string {
  return (
    `X-Timestamp:${tsNow()}\r\n` +
    `Content-Type:application/json; charset=utf-8\r\n` +
    `Path:speech.config\r\n\r\n` +
    JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: "false",
              wordBoundaryEnabled: "false",
            },
            outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          },
        },
      },
    })
  );
}

function buildSSML(text: string, voice: string, rate = "+0%", pitch = "+0Hz"): string {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const ssml =
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${voice}'>` +
    `<prosody rate='${rate}' pitch='${pitch}'>${safe}</prosody>` +
    `</voice></speak>`;

  const requestId = randomUUID().replace(/-/g, "");
  return (
    `X-RequestId:${requestId}\r\n` +
    `Content-Type:application/ssml+xml\r\n` +
    `X-Timestamp:${tsNow()}\r\n` +
    `Path:ssml\r\n\r\n` +
    ssml
  );
}

export async function synthesize(
  text: string,
  voice: string,
  rate = "+0%",
  pitch = "+0Hz",
  timeoutMs = 20000
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const connectionId = randomUUID().replace(/-/g, "");
    const url = `${WSS_BASE}&ConnectionId=${connectionId}`;

    const ws = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-MS-GEC": genSecMsGec(),
        "Sec-MS-GEC-Version": SEC_MS_GEC_VERSION,
      },
    });

    const audioChunks: Buffer[] = [];
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try { ws.terminate(); } catch { /* ignore */ }
        reject(new Error("Edge TTS timeout"));
      }
    }, timeoutMs);

    ws.on("open", () => {
      ws.send(buildConfig());
      // Small delay before SSML to let the server process config
      setTimeout(() => ws.send(buildSSML(text, voice, rate, pitch)), 100);
    });

    ws.on("message", (data: Buffer | string) => {
      if (typeof data === "string") {
        if (data.includes("Path:turn.end")) {
          if (!done) {
            done = true;
            clearTimeout(timer);
            try { ws.close(); } catch { /* ignore */ }
            if (audioChunks.length === 0) {
              reject(new Error("Edge TTS: no audio received"));
            } else {
              resolve(Buffer.concat(audioChunks));
            }
          }
        }
      } else {
        // Binary: 2-byte big-endian header length, then header, then audio
        if (data.length < 2) return;
        const headerLen = data.readUInt16BE(0);
        if (data.length < 2 + headerLen) return;
        const header = data.slice(2, 2 + headerLen).toString("utf8");
        if (header.includes("Path:audio")) {
          const audioData = data.slice(2 + headerLen);
          if (audioData.length > 0) audioChunks.push(audioData);
        }
      }
    });

    ws.on("error", (err) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    ws.on("close", () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error("Edge TTS: connection closed without audio"));
        }
      }
    });
  });
}

/** Convenience: synthesize a story sentence using the correct language voice */
export async function synthesizeStory(
  text: string,
  lang: "en" | "ar",
  rate = "-15%",
  pitch = "+0Hz"
): Promise<Buffer> {
  const voice = STORY_VOICES[lang];
  return synthesize(text, voice, rate, pitch, 25000);
}
