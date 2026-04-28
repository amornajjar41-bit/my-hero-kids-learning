import type { Lang } from "./i18n";

export type Badge = {
  id: string;
  emoji: string;
  en: string;
  ar: string;
  earned: (p: {
    streak: number;
    lessonsCompleted: number;
    chatSessions: number;
    arabicLessons: number;
    englishLessons: number;
    gamesPlayed: number;
    storiesListened: number;
    pointsTotal: number;
  }) => boolean;
};

export const allBadges: Badge[] = [
  // Milestone badges
  {
    id: "first-word",
    emoji: "🔤",
    en: "First Word",
    ar: "أول كلمة",
    earned: (p) => p.lessonsCompleted >= 1,
  },
  {
    id: "first-story",
    emoji: "🌙",
    en: "First Story",
    ar: "أول قصة",
    earned: (p) => p.storiesListened >= 1,
  },
  {
    id: "first-game",
    emoji: "🎮",
    en: "First Game Win",
    ar: "أول لعبة",
    earned: (p) => p.gamesPlayed >= 1,
  },
  // Streak badges
  {
    id: "streak-3",
    emoji: "🔥",
    en: "3 Day Streak",
    ar: "٣ أيام متتالية",
    earned: (p) => p.streak >= 3,
  },
  {
    id: "streak-7",
    emoji: "🔥🔥",
    en: "7 Day Streak",
    ar: "٧ أيام متتالية",
    earned: (p) => p.streak >= 7,
  },
  {
    id: "streak-30",
    emoji: "👑",
    en: "30 Day Streak",
    ar: "٣٠ يوم متتالية",
    earned: (p) => p.streak >= 30,
  },
  // Subject badges
  {
    id: "math-master",
    emoji: "🧮",
    en: "Math Master",
    ar: "بطل الرياضيات",
    earned: (p) => p.gamesPlayed >= 5,
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
  // Activity badges
  {
    id: "homework-hero",
    emoji: "🦸",
    en: "Homework Hero",
    ar: "بطل الواجب",
    earned: (p) => p.chatSessions >= 5,
  },
  {
    id: "story-lover",
    emoji: "📖",
    en: "Story Lover",
    ar: "عاشق القصص",
    earned: (p) => p.storiesListened >= 5,
  },
  {
    id: "game-champion",
    emoji: "🏆",
    en: "Game Champion",
    ar: "بطل الألعاب",
    earned: (p) => p.gamesPlayed >= 10,
  },
  // Advanced badges
  {
    id: "perfect-week",
    emoji: "💯",
    en: "Perfect Week",
    ar: "أسبوع مثالي",
    earned: (p) => p.streak >= 7 && p.lessonsCompleted >= 5,
  },
  {
    id: "speed-learner",
    emoji: "⚡",
    en: "Speed Learner",
    ar: "متعلم سريع",
    earned: (p) => p.lessonsCompleted >= 10,
  },
  {
    id: "helping-hand",
    emoji: "🤝",
    en: "Helping Hand",
    ar: "يد المساعدة",
    earned: (p) => p.chatSessions >= 20,
  },
];

export function badgeName(b: Badge, lang: Lang) {
  return lang === "ar" ? b.ar : b.en;
}
