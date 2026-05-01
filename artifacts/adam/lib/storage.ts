import AsyncStorage from "@react-native-async-storage/async-storage";

export type AgeGroup = "4-6" | "7-9" | "10-12" | "13-14";
export type Hero = "boy" | "girl";
export type ScreenLimit = 2 | 4 | 6 | 0; // 0 = unlimited

export type Profile = {
  language: "en";
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

// Points awarded per activity
export const POINTS = {
  homework: 10,
  lesson: 25,
  game: 15,
  story: 20,
  streak3Bonus: 50,
  streak7Bonus: 150,
} as const;

// Rewards shop items
export type RewardItem = {
  id: string;
  emoji: string;
  en: string;
  cost: number;
  category: "accessory" | "background" | "trophy";
};

export const REWARD_SHOP: RewardItem[] = [
  // ── Accessories (cheap → expensive) ──────────────────────────────────────
  { id: "cape",        emoji: "🦸",  en: "Hero Cape",           cost: 50,  category: "accessory" },
  { id: "glasses",     emoji: "🕶️",  en: "Cool Shades",         cost: 60,  category: "accessory" },
  { id: "wand",        emoji: "🪄",  en: "Magic Wand",          cost: 75,  category: "accessory" },
  { id: "hat",         emoji: "🎩",  en: "Magic Hat",           cost: 90,  category: "accessory" },
  { id: "crown",       emoji: "👑",  en: "Royal Crown",         cost: 110, category: "accessory" },
  { id: "shield",      emoji: "🛡️",  en: "Hero Shield",         cost: 130, category: "accessory" },
  { id: "costume",     emoji: "🥷",  en: "Ninja Suit",          cost: 150, category: "accessory" },
  { id: "jetpack",     emoji: "🚀",  en: "Jetpack",             cost: 180, category: "accessory" },
  { id: "robot-suit",  emoji: "🤖",  en: "Robot Armor",         cost: 200, category: "accessory" },
  { id: "wings",       emoji: "🦅",  en: "Eagle Wings",         cost: 220, category: "accessory" },
  // ── Backgrounds ───────────────────────────────────────────────────────────
  { id: "bg-sunset",   emoji: "🌅",  en: "Sunset Paradise",     cost: 150, category: "background" },
  { id: "bg-ocean",    emoji: "🌊",  en: "Deep Ocean",          cost: 175, category: "background" },
  { id: "bg-jungle",   emoji: "🌴",  en: "Jungle Adventure",    cost: 175, category: "background" },
  { id: "bg-galaxy",   emoji: "🌌",  en: "Galaxy Background",   cost: 200, category: "background" },
  { id: "bg-castle",   emoji: "🏰",  en: "Magic Castle",        cost: 225, category: "background" },
  { id: "bg-space",    emoji: "🪐",  en: "Outer Space",         cost: 250, category: "background" },
  // ── Trophies & Awards ─────────────────────────────────────────────────────
  { id: "gold-star",   emoji: "⭐",  en: "Golden Star",         cost: 200, category: "trophy" },
  { id: "silver-cup",  emoji: "🥈",  en: "Silver Cup",          cost: 250, category: "trophy" },
  { id: "gold-cup",    emoji: "🥇",  en: "Gold Cup",            cost: 300, category: "trophy" },
  { id: "diamond",     emoji: "💎",  en: "Diamond Trophy",      cost: 400, category: "trophy" },
  { id: "champion",    emoji: "🏆",  en: "Champion Trophy",     cost: 500, category: "trophy" },
  { id: "legend",      emoji: "🌟",  en: "Legend Crown",        cost: 750, category: "trophy" },
  { id: "ultimate",    emoji: "👑",  en: "Ultimate Hero Badge",  cost: 1000, category: "trophy" },
];

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
  // Change 7 – Points system
  pointsTotal: number;     // all-time accumulated points
  todayPoints: number;     // points earned today (reset daily)
  todayPointsDate: string; // YYYY-MM-DD of last reset
  rewardsUnlocked: string[]; // reward item ids unlocked from shop
  techLessons: string[];    // completed tech lesson ids
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
  pointsTotal: 0,
  todayPoints: 0,
  todayPointsDate: "",
  rewardsUnlocked: [],
  techLessons: [],
};
