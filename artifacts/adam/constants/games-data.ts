import type { Lang } from "./i18n";

// Word Puzzle words by language
export const puzzleWords: Record<
  Lang,
  Array<{ emoji: string; word: string }>
> = {
  en: [
    { emoji: "🐱", word: "CAT" },
    { emoji: "🐶", word: "DOG" },
    { emoji: "☀️", word: "SUN" },
    { emoji: "🚗", word: "CAR" },
    { emoji: "🍎", word: "APPLE" },
    { emoji: "🏠", word: "HOUSE" },
    { emoji: "📖", word: "BOOK" },
    { emoji: "🌈", word: "RAINBOW" },
    { emoji: "🐠", word: "FISH" },
    { emoji: "⭐", word: "STAR" },
  ],
  ar: [
    { emoji: "🐱", word: "قطة" },
    { emoji: "🐶", word: "كلب" },
    { emoji: "☀️", word: "شمس" },
    { emoji: "🚗", word: "سيارة" },
    { emoji: "🍎", word: "تفاح" },
    { emoji: "🏠", word: "بيت" },
    { emoji: "📖", word: "كتاب" },
    { emoji: "⭐", word: "نجمة" },
  ],
};

// Letter match cards
export const letterMatchPairs: Record<
  Lang,
  Array<{ letter: string; emoji: string; word: string }>
> = {
  en: [
    { letter: "A", emoji: "🍎", word: "Apple" },
    { letter: "B", emoji: "🐝", word: "Bee" },
    { letter: "C", emoji: "🐱", word: "Cat" },
    { letter: "D", emoji: "🐶", word: "Dog" },
    { letter: "E", emoji: "🐘", word: "Elephant" },
    { letter: "F", emoji: "🐟", word: "Fish" },
    { letter: "S", emoji: "☀️", word: "Sun" },
    { letter: "M", emoji: "🌙", word: "Moon" },
  ],
  ar: [
    { letter: "أ", emoji: "🦆", word: "بطة" },
    { letter: "ب", emoji: "🦆", word: "بطة" },
    { letter: "ت", emoji: "🍎", word: "تفاحة" },
    { letter: "ج", emoji: "🐫", word: "جمل" },
    { letter: "ح", emoji: "🐎", word: "حصان" },
    { letter: "د", emoji: "🐻", word: "دب" },
    { letter: "ر", emoji: "🍇", word: "رمان" },
    { letter: "ش", emoji: "☀️", word: "شمس" },
  ],
};

// Jigsaw images list (use emoji thumbnails — full image rendered as gradient)
export const jigsawImages = [
  { id: "solar", emojiCenter: "🪐", titleEn: "Solar System", titleAr: "النظام الشمسي", funEn: "Did you know Jupiter is SO big that 1,300 Earths could fit inside it? CRAZY right?! 🪐", funAr: "هل تعلم أن المشتري ضخم لدرجة أن ١٣٠٠ كرة أرضية ممكن تنحط جواه؟! 🪐" },
  { id: "world", emojiCenter: "🌍", titleEn: "World Map", titleAr: "خريطة العالم", funEn: "Earth is moving 107,000 km/h around the sun right now! 🚀", funAr: "الأرض عم تتحرك ١٠٧ ألف كم/ساعة حول الشمس هلق! 🚀" },
  { id: "abc", emojiCenter: "🔠", titleEn: "Alphabet", titleAr: "الحروف", funEn: "There are 26 English letters and 28 Arabic letters! 🔠", funAr: "في ٢٦ حرف إنجليزي و ٢٨ حرف عربي! 🔠" },
];
