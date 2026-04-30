export type Badge = {
  id: string;
  emoji: string;
  en: string;
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
  { id: "first-word",    emoji: "🔤", en: "First Word",     earned: (p) => p.lessonsCompleted >= 1 },
  { id: "first-story",   emoji: "🌙", en: "First Story",    earned: (p) => p.storiesListened >= 1 },
  { id: "first-game",    emoji: "🎮", en: "First Game",     earned: (p) => p.gamesPlayed >= 1 },
  { id: "first-chat",    emoji: "💬", en: "First Chat",     earned: (p) => p.chatSessions >= 1 },
  // ── Streak Badges ─────────────────────────────────────────────────────────
  { id: "streak-3",      emoji: "🔥",    en: "3-Day Streak",  earned: (p) => p.streak >= 3 },
  { id: "streak-7",      emoji: "🔥🔥",  en: "7-Day Streak",  earned: (p) => p.streak >= 7 },
  { id: "streak-14",     emoji: "💥",    en: "2-Week Streak", earned: (p) => p.streak >= 14 },
  { id: "streak-30",     emoji: "👑",    en: "30-Day Streak", earned: (p) => p.streak >= 30 },
  { id: "streak-60",     emoji: "🌟",    en: "60-Day Legend", earned: (p) => p.streak >= 60 },
  // ── Lesson Milestones ─────────────────────────────────────────────────────
  { id: "lessons-5",     emoji: "📗", en: "5 Lessons",      earned: (p) => p.lessonsCompleted >= 5 },
  { id: "lessons-10",    emoji: "📘", en: "10 Lessons",     earned: (p) => p.lessonsCompleted >= 10 },
  { id: "lessons-25",    emoji: "📙", en: "25 Lessons",     earned: (p) => p.lessonsCompleted >= 25 },
  { id: "lessons-50",    emoji: "🎓", en: "50 Lessons",     earned: (p) => p.lessonsCompleted >= 50 },
  // ── Language Badges ───────────────────────────────────────────────────────
  { id: "english-star",  emoji: "🌟",  en: "English Star",  earned: (p) => p.englishLessons >= 3 },
  { id: "english-master",emoji: "🇬🇧", en: "English Master", earned: (p) => p.englishLessons >= 10 },
  { id: "word-hero",     emoji: "🦸",  en: "Word Hero",     earned: (p) => p.englishLessons >= 20 },
  // ── Game Achievements ─────────────────────────────────────────────────────
  { id: "math-master",   emoji: "🧮", en: "Math Master",   earned: (p) => p.gamesPlayed >= 5 },
  { id: "game-champion", emoji: "🏆", en: "Game Champion", earned: (p) => p.gamesPlayed >= 10 },
  { id: "game-legend",   emoji: "🎯", en: "Game Legend",   earned: (p) => p.gamesPlayed >= 25 },
  { id: "game-master",   emoji: "⚡", en: "Game Master",   earned: (p) => p.gamesPlayed >= 50 },
  // ── Story Badges ──────────────────────────────────────────────────────────
  { id: "story-lover",   emoji: "📖", en: "Story Lover",   earned: (p) => p.storiesListened >= 5 },
  { id: "bookworm",      emoji: "🐛", en: "Bookworm",      earned: (p) => p.storiesListened >= 10 },
  { id: "story-master",  emoji: "🌠", en: "Story Master",  earned: (p) => p.storiesListened >= 20 },
  // ── Chat & Homework ───────────────────────────────────────────────────────
  { id: "homework-hero", emoji: "🦸", en: "Homework Hero", earned: (p) => p.chatSessions >= 5 },
  { id: "helping-hand",  emoji: "🤝", en: "Helping Hand",  earned: (p) => p.chatSessions >= 20 },
  { id: "scholar",       emoji: "🎓", en: "Young Scholar", earned: (p) => p.chatSessions >= 50 },
  // ── Combo Achievements ────────────────────────────────────────────────────
  { id: "perfect-week",  emoji: "💯", en: "Perfect Week",  earned: (p) => p.streak >= 7 && p.lessonsCompleted >= 5 },
  { id: "speed-learner", emoji: "⚡", en: "Speed Learner", earned: (p) => p.lessonsCompleted >= 10 },
  { id: "all-rounder",   emoji: "🌈", en: "All-Rounder",   earned: (p) => p.lessonsCompleted >= 5 && p.gamesPlayed >= 5 && p.storiesListened >= 3 && p.chatSessions >= 3 },
  { id: "super-learner", emoji: "🚀", en: "Super Learner", earned: (p) => p.lessonsCompleted >= 20 && p.streak >= 14 },
  // ── Points Milestones ─────────────────────────────────────────────────────
  { id: "pts-100",       emoji: "💰", en: "100 Points",    earned: (p) => (p.pointsTotal ?? 0) >= 100 },
  { id: "pts-500",       emoji: "💵", en: "500 Points",    earned: (p) => (p.pointsTotal ?? 0) >= 500 },
  { id: "pts-1000",      emoji: "💎", en: "1,000 Points",  earned: (p) => (p.pointsTotal ?? 0) >= 1000 },
  { id: "pts-5000",      emoji: "🏦", en: "5,000 Points",  earned: (p) => (p.pointsTotal ?? 0) >= 5000 },
  // ── Special / Fun ─────────────────────────────────────────────────────────
  { id: "night-owl",     emoji: "🦉", en: "Night Owl",     earned: (p) => p.storiesListened >= 3 && p.streak >= 3 },
  { id: "unstoppable",   emoji: "🛸", en: "Unstoppable",   earned: (p) => p.streak >= 30 && p.lessonsCompleted >= 30 },
];

export function badgeName(b: Badge): string {
  return b.en;
}
