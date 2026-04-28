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

export type ChildMemoryForApi = {
  strongSubjects?: string[];
  weakSubjects?: string[];
  interests?: string[];
  learningPace?: "fast" | "normal" | "slow";
  recentTopics?: string[];
};

export type ChatSuggestion = { text: string; key: string };

export async function chatSend(opts: {
  language: "en" | "ar";
  childName: string;
  heroName?: string;
  ageGroup: "4-6" | "7-9" | "10-12" | "13-14";
  history: ChatMessage[];
  childMemory?: ChildMemoryForApi | null;
  gender?: "boy" | "girl";
  sessionId?: string;
}): Promise<{
  reply: string;
  safetyAlert: string | null;
  suggestions?: ChatSuggestion[];
  highFive?: boolean;
  cached?: boolean;
}> {
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
    childMemory: opts.childMemory ?? null,
    gender: opts.gender ?? "boy",
    sessionId: opts.sessionId,
  });
}

export async function ttsSpeak(opts: {
  text: string;
  voice?: "echo" | "nova";
  speed?: number;
  maxChars?: number;
  contentType?: "explanation" | "greeting" | "celebration" | "story";
}): Promise<{ audioBase64: string; mimeType: string }> {
  return postJSON("/api/tts", opts);
}

export async function reportSafetyAlert(opts: {
  childName: string;
  parentEmail: string;
  message: string;
  alertType: string;
}): Promise<void> {
  return postJSON("/api/safety-alert", opts);
}

export async function transcribe(opts: {
  audioBase64: string;
  mimeType?: string;
  language?: "en" | "ar";
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
