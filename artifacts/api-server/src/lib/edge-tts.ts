import WebSocket from "ws";
import { randomUUID } from "crypto";

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6FAD";
const WSS_BASE = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;

// Voice map: character + language → Neural voice name
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

  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
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
  timeoutMs = 15000
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const audioChunks: Buffer[] = [];
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        ws.close();
        reject(new Error("Edge TTS timeout"));
      }
    }, timeoutMs);

    ws.on("open", () => {
      ws.send(buildConfig());
      ws.send(buildSSML(text, voice, rate, pitch));
    });

    ws.on("message", (data: Buffer | string) => {
      if (typeof data === "string") {
        if (data.includes("Path:turn.end")) {
          if (!done) {
            done = true;
            clearTimeout(timer);
            ws.close();
            resolve(Buffer.concat(audioChunks));
          }
        }
      } else {
        // Binary message: 2-byte header length + header text + audio data
        if (data.length < 2) return;
        const headerLen = data.readUInt16BE(0);
        if (data.length < 2 + headerLen) return;
        const header = data.slice(2, 2 + headerLen).toString("utf8");
        if (header.includes("Path:audio")) {
          audioChunks.push(data.slice(2 + headerLen));
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
          reject(new Error("Edge TTS: no audio received"));
        }
      }
    });
  });
}
