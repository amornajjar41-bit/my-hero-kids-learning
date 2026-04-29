/**
 * Tiny wrapper around the api-server endpoints we use in Adam.
 *
 * URL resolution priority:
 *  1. EXPO_PUBLIC_API_URL  — set in eas.json for production builds → https://myheroapp.org
 *  2. EXPO_PUBLIC_DOMAIN   — set by Replit dev workflow → https://<replit-domain>
 *  3. Fallback             — empty string (relative URLs, dev/web)
 */

import { getSessionToken } from "@/lib/auth";

/** Production API base — always https://myheroapp.org for store builds */
const PRODUCTION_API = "https://myheroapp.org";

let initialized = false;

export function ensureApiBaseUrl() {
  if (initialized) return;
  initialized = true;
  // Base URL is resolved per-call in resolveApiBase() — nothing extra needed here.
}

function resolveApiBase(): string {
  // EAS production/preview builds set this explicitly
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // Replit dev environment
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  // If neither is set (e.g. local bare RN) use production
  return PRODUCTION_API;
}

async function getBaseUrl(): Promise<string> {
  return resolveApiBase();
}

async function postJSON<T>(path: string, body: unknown, withSession = false): Promise<T> {
  const base = await getBaseUrl();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (withSession) {
    const token = await getSessionToken();
    if (token) headers["x-session-token"] = token;
  }
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function getJSON<T>(path: string, withSession = false): Promise<T> {
  const base = await getBaseUrl();
  const headers: Record<string, string> = {};
  if (withSession) {
    const token = await getSessionToken();
    if (token) headers["x-session-token"] = token;
  }
  const res = await fetch(`${base}${path}`, { headers });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
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
  ageGroup?: string;
  contentType?: "explanation" | "greeting" | "celebration" | "story";
}): Promise<{ audioBase64: string; mimeType: string }> {
  return postJSON("/api/tts", opts);
}

/** Edge TTS for stories — uses Ana (EN) or Zariyah (AR), never WaveNet */
export async function ttsEdgeStory(opts: {
  text: string;
  lang: "en" | "ar";
}): Promise<{ base64: string; mimeType: string } | null> {
  try {
    return await postJSON<{ base64: string; mimeType: string }>("/api/tts/edge-story", opts);
  } catch {
    return null;
  }
}

export async function reportSafetyAlert(opts: {
  childName: string;
  parentEmail: string;
  message: string;
  alertType: string;
  childId?: string;
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

// 5B – Trial usage
export type TrialUsage = {
  tts: { usedSeconds: number; limitSeconds: number; blocked: boolean };
  stt: { usedSeconds: number; limitSeconds: number; blocked: boolean };
  photos: { used: number; limit: number; blocked: boolean };
  isPaid: boolean;
  trialStart: string;
};

export async function getTrialUsage(): Promise<TrialUsage | null> {
  try {
    return await getJSON<TrialUsage>("/api/trial/usage", true);
  } catch {
    return null;
  }
}

export async function incrementTrialUsage(opts: {
  type: "tts" | "stt" | "photo";
  seconds?: number;
}): Promise<{ ok: boolean; blocked: boolean }> {
  try {
    return await postJSON("/api/trial/usage", opts, true);
  } catch {
    return { ok: false, blocked: false };
  }
}

export async function checkPhotoAllowed(): Promise<boolean> {
  try {
    const result = await postJSON<{ allowed: boolean }>("/api/trial/check-photo", {}, true);
    return result.allowed;
  } catch {
    return true; // graceful fallback — allow if check fails
  }
}
