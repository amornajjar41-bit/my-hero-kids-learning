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
  // ── First Steps ───────────────────────────────────────────────────────────
  { id: "first-word",    emoji: "🔤", en: "First Word",       ar: "أول كلمة",          earned: (p) => p.lessonsCompleted >= 1 },
  { id: "first-story",   emoji: "🌙", en: "First Story",      ar: "أول قصة",           earned: (p) => p.storiesListened >= 1 },
  { id: "first-game",    emoji: "🎮", en: "First Game",       ar: "أول لعبة",          earned: (p) => p.gamesPlayed >= 1 },
  { id: "first-chat",    emoji: "💬", en: "First Chat",       ar: "أول محادثة",        earned: (p) => p.chatSessions >= 1 },
  // ── Streak Badges ─────────────────────────────────────────────────────────
  { id: "streak-3",      emoji: "🔥",    en: "3-Day Streak",    ar: "٣ أيام متتالية",   earned: (p) => p.streak >= 3 },
  { id: "streak-7",      emoji: "🔥🔥",  en: "7-Day Streak",    ar: "٧ أيام متتالية",   earned: (p) => p.streak >= 7 },
  { id: "streak-14",     emoji: "💥",    en: "2-Week Streak",   ar: "أسبوعان متتاليان", earned: (p) => p.streak >= 14 },
  { id: "streak-30",     emoji: "👑",    en: "30-Day Streak",   ar: "٣٠ يوماً متتالياً",earned: (p) => p.streak >= 30 },
  { id: "streak-60",     emoji: "🌟",    en: "60-Day Legend",   ar: "٦٠ يوماً أسطوري", earned: (p) => p.streak >= 60 },
  // ── Lesson Milestones ─────────────────────────────────────────────────────
  { id: "lessons-5",     emoji: "📗", en: "5 Lessons",        ar: "٥ دروس",            earned: (p) => p.lessonsCompleted >= 5 },
  { id: "lessons-10",    emoji: "📘", en: "10 Lessons",       ar: "١٠ دروس",           earned: (p) => p.lessonsCompleted >= 10 },
  { id: "lessons-25",    emoji: "📙", en: "25 Lessons",       ar: "٢٥ درساً",          earned: (p) => p.lessonsCompleted >= 25 },
  { id: "lessons-50",    emoji: "🎓", en: "50 Lessons",       ar: "٥٠ درساً",          earned: (p) => p.lessonsCompleted >= 50 },
  // ── Language Badges ───────────────────────────────────────────────────────
  { id: "arabic-star",   emoji: "⭐",  en: "Arabic Star",      ar: "نجم العربية",       earned: (p) => p.arabicLessons >= 3 },
  { id: "arabic-master", emoji: "🌙",  en: "Arabic Master",    ar: "سيّد العربية",      earned: (p) => p.arabicLessons >= 10 },
  { id: "english-star",  emoji: "🌟",  en: "English Star",     ar: "نجم الإنجليزية",   earned: (p) => p.englishLessons >= 3 },
  { id: "english-master",emoji: "🇬🇧", en: "English Master",   ar: "سيّد الإنجليزية",  earned: (p) => p.englishLessons >= 10 },
  { id: "bilingual",     emoji: "🌍",  en: "Bilingual Hero",   ar: "بطل اللغتين",       earned: (p) => p.arabicLessons >= 5 && p.englishLessons >= 5 },
  // ── Game Achievements ─────────────────────────────────────────────────────
  { id: "math-master",   emoji: "🧮", en: "Math Master",      ar: "بطل الرياضيات",     earned: (p) => p.gamesPlayed >= 5 },
  { id: "game-champion", emoji: "🏆", en: "Game Champion",    ar: "بطل الألعاب",       earned: (p) => p.gamesPlayed >= 10 },
  { id: "game-legend",   emoji: "🎯", en: "Game Legend",      ar: "أسطورة الألعاب",   earned: (p) => p.gamesPlayed >= 25 },
  { id: "game-god",      emoji: "⚡", en: "Game God",         ar: "إله الألعاب",       earned: (p) => p.gamesPlayed >= 50 },
  // ── Story Badges ──────────────────────────────────────────────────────────
  { id: "story-lover",   emoji: "📖", en: "Story Lover",      ar: "عاشق القصص",        earned: (p) => p.storiesListened >= 5 },
  { id: "bookworm",      emoji: "🐛", en: "Bookworm",         ar: "دودة الكتب",        earned: (p) => p.storiesListened >= 10 },
  { id: "story-master",  emoji: "🌠", en: "Story Master",     ar: "سيّد القصص",        earned: (p) => p.storiesListened >= 20 },
  // ── Chat & Homework ───────────────────────────────────────────────────────
  { id: "homework-hero", emoji: "🦸", en: "Homework Hero",    ar: "بطل الواجب",        earned: (p) => p.chatSessions >= 5 },
  { id: "helping-hand",  emoji: "🤝", en: "Helping Hand",     ar: "يد المساعدة",       earned: (p) => p.chatSessions >= 20 },
  { id: "scholar",       emoji: "🎓", en: "Young Scholar",    ar: "العالم الصغير",     earned: (p) => p.chatSessions >= 50 },
  // ── Combo Achievements ────────────────────────────────────────────────────
  { id: "perfect-week",  emoji: "💯", en: "Perfect Week",     ar: "أسبوع مثالي",       earned: (p) => p.streak >= 7 && p.lessonsCompleted >= 5 },
  { id: "speed-learner", emoji: "⚡", en: "Speed Learner",    ar: "متعلم سريع",        earned: (p) => p.lessonsCompleted >= 10 },
  { id: "all-rounder",   emoji: "🌈", en: "All-Rounder",      ar: "المتكامل",          earned: (p) => p.lessonsCompleted >= 5 && p.gamesPlayed >= 5 && p.storiesListened >= 3 && p.chatSessions >= 3 },
  { id: "super-learner", emoji: "🚀", en: "Super Learner",    ar: "المتعلم الخارق",    earned: (p) => p.lessonsCompleted >= 20 && p.streak >= 14 },
  // ── Points Milestones ─────────────────────────────────────────────────────
  { id: "pts-100",       emoji: "💰", en: "100 Points",       ar: "١٠٠ نقطة",          earned: (p) => (p.pointsTotal ?? 0) >= 100 },
  { id: "pts-500",       emoji: "💵", en: "500 Points",       ar: "٥٠٠ نقطة",          earned: (p) => (p.pointsTotal ?? 0) >= 500 },
  { id: "pts-1000",      emoji: "💎", en: "1000 Points",      ar: "١٠٠٠ نقطة",         earned: (p) => (p.pointsTotal ?? 0) >= 1000 },
  { id: "pts-5000",      emoji: "🏦", en: "5000 Points",      ar: "٥٠٠٠ نقطة",         earned: (p) => (p.pointsTotal ?? 0) >= 5000 },
  // ── Special / Fun ─────────────────────────────────────────────────────────
  { id: "night-owl",     emoji: "🦉", en: "Night Owl",        ar: "بومة الليل",        earned: (p) => p.storiesListened >= 3 && p.streak >= 3 },
  { id: "unstoppable",   emoji: "🛸", en: "Unstoppable",      ar: "لا يوقفه شيء",      earned: (p) => p.streak >= 30 && p.lessonsCompleted >= 30 },
];

export function badgeName(b: Badge, lang: Lang) {
  return lang === "ar" ? b.ar : b.en;
}
