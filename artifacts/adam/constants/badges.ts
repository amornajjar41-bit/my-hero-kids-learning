import type { Lang } from "./i18n";

export type Badge = {
  id: string;
  emoji: string;
  en: string;
  ar: string;
  // Returns true if earned given progress.
  earned: (p: {
    streak: number;
    lessonsCompleted: number;
    chatSessions: number;
    arabicLessons: number;
    englishLessons: number;
    gamesPlayed: number;
  }) => boolean;
};

export const allBadges: Badge[] = [
  {
    id: "first-lesson",
    emoji: "🎓",
    en: "First Lesson",
    ar: "أول درس",
    earned: (p) => p.lessonsCompleted >= 1,
  },
  {
    id: "5-day-streak",
    emoji: "🔥",
    en: "5 Days Streak",
    ar: "٥ أيام متتالية",
    earned: (p) => p.streak >= 5,
  },
  {
    id: "homework-hero",
    emoji: "🦸",
    en: "Homework Hero",
    ar: "بطل الواجب",
    earned: (p) => p.chatSessions >= 5,
  },
  {
    id: "arabic-star",
    emoji: "⭐",
    en: "Arabic Star",
    ar: "نجم العربية",
    earned: (p) => p.arabicLessons >= 3,
  },
  {
    id: "english-star",
    emoji: "🌟",
    en: "English Star",
    ar: "نجم الإنجليزية",
    earned: (p) => p.englishLessons >= 3,
  },
  {
    id: "game-master",
    emoji: "🎮",
    en: "Game Master",
    ar: "ملك الألعاب",
    earned: (p) => p.gamesPlayed >= 5,
  },
];

export function badgeName(b: Badge, lang: Lang) {
  return lang === "ar" ? b.ar : b.en;
}
