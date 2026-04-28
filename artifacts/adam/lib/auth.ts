import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "adam.session.token.v1";

export async function saveSessionToken(token: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, token);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SESSION_KEY, token);
  }
}

export async function getSessionToken(): Promise<string | null> {
  // Try localStorage first (web), then AsyncStorage (native)
  if (typeof localStorage !== "undefined") {
    const webToken = localStorage.getItem(SESSION_KEY);
    if (webToken) return webToken;
  }
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

const API_BASE =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

export async function validateSession(token: string): Promise<{
  valid: boolean;
  userId?: string;
  childId?: string;
  user?: {
    parentName: string;
    country: string;
    currency: string;
    language: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    trialStart: string;
  };
  child?: {
    childName: string;
    gender: "boy" | "girl";
    characterChoice: "boy" | "girl";
    ageGroup: string;
    languagePreference: "en" | "ar";
    streak: number;
    points: number;
  };
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token }),
    });
    if (!res.ok) return { valid: false };
    return res.json();
  } catch {
    return { valid: false };
  }
}

export async function registerUser(data: {
  email: string;
  password: string;
  parentName: string;
  country: string;
  currency: string;
  language: string;
  childName: string;
  childGender: "boy" | "girl";
  childDob: string;
  characterChoice: "boy" | "girl";
  languagePreference: "en" | "ar";
}): Promise<{
  sessionToken?: string;
  userId?: string;
  childId?: string;
  ageGroup?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error ?? "registration_failed" };
    return json;
  } catch {
    return { error: "network_error" };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{
  sessionToken?: string;
  userId?: string;
  childId?: string;
  user?: unknown;
  child?: unknown;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error ?? "login_failed" };
    return json;
  } catch {
    return { error: "network_error" };
  }
}
