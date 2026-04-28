import AsyncStorage from "@react-native-async-storage/async-storage";

export type AgeGroup = "4-6" | "7-9" | "10-12";
export type Hero = "boy" | "girl";
export type ScreenLimit = 2 | 4 | 6 | 0; // 0 = unlimited

export type Profile = {
  language: "en" | "ar";
  hero: Hero;
  childName: string;
  ageGroup: AgeGroup;
  parentEmail: string;
  parentName?: string;
  childBirthday?: string; // ISO date YYYY-MM-DD
  trialStartedAt: string; // ISO
  isPaid: boolean;
  paidPlan?: "monthly" | "6months" | "yearly";
  screenLimitHours: ScreenLimit;
  soundOn: boolean;
  country?: string;
  currency?: string;
};

export type Progress = {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  starsTotal: number;
  lessonsCompleted: string[]; // lesson ids
  englishLessons: number;
  arabicLessons: number;
  chatSessions: number;
  gamesPlayed: number;
  wordsLearned: number;
  weekly: number[]; // 7 numbers, index 0 = Sun
  monthlyActiveDays: string[]; // YYYY-MM-DD list
  badgesEarned: string[];
  // Daily usage tracking (for screen time limit)
  dailyUsageDate: string; // YYYY-MM-DD
  dailyUsageMinutes: number;
  storiesListened: number;
};

export type SafetyAlert = {
  ts: string;
  message: string;
  alertType: string;
};

export type ChildMemory = {
  strongSubjects: string[];
  weakSubjects: string[];
  interests: string[];
  learningPace: "fast" | "normal" | "slow";
  recentTopics: string[];
  lastUpdated: string;
};

export const defaultChildMemory: ChildMemory = {
  strongSubjects: [],
  weakSubjects: [],
  interests: [],
  learningPace: "normal",
  recentTopics: [],
  lastUpdated: "",
};

export const STORAGE_KEYS = {
  profile: "adam.profile.v1",
  progress: "adam.progress.v1",
  chatHistory: "adam.chat.v1",
  onboardingDone: "adam.onboarding.done.v1",
  storiesListened: "adam.stories.v1",
  voiceTutorialDone: "adam.voice.tutorial.v1",
  safetyAlerts: "adam.safety.v1",
  childMemory: "adam.memory.v1",
  termsAccepted: "adam.terms.v1",
  // 4C – First-time tour
  tourDone: "adam.tour.done.v1",
  // 5A – Parent PIN (stored as plain 4-digit string, device-local security)
  parentPin: "adam.parent.pin.v1",
  // 4D – Birthday check
  lastBirthdayCheck: "adam.birthday.check.v1",
  // 4B – Screen time session start
  screenTimeSessionStart: "adam.screen.session.v1",
};

export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}

export const defaultProgress: Progress = {
  streak: 0,
  lastActiveDate: "",
  starsTotal: 0,
  lessonsCompleted: [],
  englishLessons: 0,
  arabicLessons: 0,
  chatSessions: 0,
  gamesPlayed: 0,
  wordsLearned: 0,
  weekly: [0, 0, 0, 0, 0, 0, 0],
  monthlyActiveDays: [],
  badgesEarned: [],
  dailyUsageDate: "",
  dailyUsageMinutes: 0,
  storiesListened: 0,
};
