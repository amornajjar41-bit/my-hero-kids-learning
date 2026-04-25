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
  // Child birthday for celebration screen (ISO date YYYY-MM-DD)
  childBirthday?: string;
  trialStartedAt: string; // ISO
  isPaid: boolean;
  paidPlan?: "monthly" | "yearly";
  screenLimitHours: ScreenLimit;
  soundOn: boolean;
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
};

export const STORAGE_KEYS = {
  profile: "adam.profile.v1",
  progress: "adam.progress.v1",
  chatHistory: "adam.chat.v1",
  onboardingDone: "adam.onboarding.done.v1",
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
};
