/**
 * Tiny wrapper around the api-server endpoints we use in Adam.
 */

import { setBaseUrl } from "@workspace/api-client-react";

let initialized = false;

export function ensureApiBaseUrl() {
  if (initialized) return;
  initialized = true;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    setBaseUrl(`https://${domain}`);
  }
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const base = domain ? `https://${domain}` : "";
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export type ChatRole = "user" | "assistant";
export type ChatMessage = {
  role: ChatRole;
  text: string;
  imageBase64?: string;
};

export async function chatSend(opts: {
  language: "en" | "ar";
  childName: string;
  heroName?: string;
  ageGroup: "4-6" | "7-9" | "10-12";
  history: ChatMessage[];
}): Promise<{ reply: string }> {
  // Convert to server format (messages with content + optional imageBase64 at root)
  const last = opts.history[opts.history.length - 1];
  const imageBase64 = last?.imageBase64;
  const messages = opts.history.map((m) => ({ role: m.role, content: m.text }));
  return postJSON("/api/chat", {
    messages,
    language: opts.language,
    childName: opts.childName,
    heroName: opts.heroName,
    ageGroup: opts.ageGroup,
    imageBase64,
  });
}

export async function ttsSpeak(opts: {
  text: string;
  voice?: "echo" | "nova";
  speed?: number;
}): Promise<{ audioBase64: string; mimeType: string }> {
  return postJSON("/api/tts", opts);
}

export async function transcribe(opts: {
  audioBase64: string;
  mimeType?: string;
}): Promise<{ text: string }> {
  return postJSON("/api/transcribe", opts);
}

export async function sendWeeklyReport(opts: {
  parentEmail: string;
  childName: string;
  summary: {
    wordsLearned: number;
    questionsAsked: number;
    lessonsCompleted: number;
    activeDays: number;
    strengths: string[];
    difficulties: string[];
  };
}) {
  return postJSON("/api/parent/weekly-report", opts);
}
