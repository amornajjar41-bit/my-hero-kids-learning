// Word Puzzle — 50+ words
export const puzzleWords: Array<{ emoji: string; word: string }> = [
  { emoji: "🐱", word: "CAT" },
  { emoji: "🐶", word: "DOG" },
  { emoji: "☀️", word: "SUN" },
  { emoji: "🚗", word: "CAR" },
  { emoji: "🍎", word: "APPLE" },
  { emoji: "🏠", word: "HOUSE" },
  { emoji: "📖", word: "BOOK" },
  { emoji: "⭐", word: "STAR" },
  { emoji: "🐠", word: "FISH" },
  { emoji: "🌈", word: "RAINBOW" },
  { emoji: "🐰", word: "RABBIT" },
  { emoji: "🌙", word: "MOON" },
  { emoji: "🌊", word: "WAVE" },
  { emoji: "🍕", word: "PIZZA" },
  { emoji: "🎈", word: "BALLOON" },
  { emoji: "🦁", word: "LION" },
  { emoji: "🐘", word: "ELEPHANT" },
  { emoji: "🍓", word: "STRAWBERRY" },
  { emoji: "✈️", word: "PLANE" },
  { emoji: "🚂", word: "TRAIN" },
  { emoji: "⚽", word: "BALL" },
  { emoji: "🎵", word: "MUSIC" },
  { emoji: "🌺", word: "FLOWER" },
  { emoji: "🦋", word: "BUTTERFLY" },
  { emoji: "🐢", word: "TURTLE" },
  { emoji: "🍦", word: "ICECREAM" },
  { emoji: "🎨", word: "PAINT" },
  { emoji: "🏄", word: "SURF" },
  { emoji: "🌍", word: "EARTH" },
  { emoji: "🦊", word: "FOX" },
  { emoji: "🧁", word: "CUPCAKE" },
  { emoji: "🎯", word: "TARGET" },
  { emoji: "🦈", word: "SHARK" },
  { emoji: "🐬", word: "DOLPHIN" },
  { emoji: "🌵", word: "CACTUS" },
  { emoji: "🏔️", word: "MOUNTAIN" },
  { emoji: "🎸", word: "GUITAR" },
  { emoji: "🍊", word: "ORANGE" },
  { emoji: "🦜", word: "PARROT" },
  { emoji: "🐻", word: "BEAR" },
  { emoji: "🍇", word: "GRAPES" },
  { emoji: "🐙", word: "OCTOPUS" },
  { emoji: "🌻", word: "SUNFLOWER" },
  { emoji: "🦀", word: "CRAB" },
  { emoji: "🎃", word: "PUMPKIN" },
  { emoji: "🌮", word: "TACO" },
  { emoji: "🧩", word: "PUZZLE" },
  { emoji: "🎠", word: "CAROUSEL" },
  { emoji: "🦒", word: "GIRAFFE" },
  { emoji: "🐊", word: "CROCODILE" },
];

// Letter match — full English alphabet (A–Z)
export const letterMatchPairs: Array<{ letter: string; emoji: string; word: string }> = [
  { letter: "A", emoji: "🍎", word: "Apple" },
  { letter: "B", emoji: "🐝", word: "Bee" },
  { letter: "C", emoji: "🐱", word: "Cat" },
  { letter: "D", emoji: "🐶", word: "Dog" },
  { letter: "E", emoji: "🐘", word: "Elephant" },
  { letter: "F", emoji: "🐟", word: "Fish" },
  { letter: "G", emoji: "🦒", word: "Giraffe" },
  { letter: "H", emoji: "🏠", word: "House" },
  { letter: "I", emoji: "🍦", word: "Icecream" },
  { letter: "J", emoji: "🕹️", word: "Joystick" },
  { letter: "K", emoji: "🪁", word: "Kite" },
  { letter: "L", emoji: "🦁", word: "Lion" },
  { letter: "M", emoji: "🌙", word: "Moon" },
  { letter: "N", emoji: "🌙", word: "Night" },
  { letter: "O", emoji: "🐙", word: "Octopus" },
  { letter: "P", emoji: "🐧", word: "Penguin" },
  { letter: "Q", emoji: "👑", word: "Queen" },
  { letter: "R", emoji: "🌈", word: "Rainbow" },
  { letter: "S", emoji: "☀️", word: "Sun" },
  { letter: "T", emoji: "🐢", word: "Turtle" },
  { letter: "U", emoji: "☂️", word: "Umbrella" },
  { letter: "V", emoji: "🎻", word: "Violin" },
  { letter: "W", emoji: "🌊", word: "Wave" },
  { letter: "X", emoji: "🎸", word: "Xylophone" },
  { letter: "Y", emoji: "⛵", word: "Yacht" },
  { letter: "Z", emoji: "🦓", word: "Zebra" },
];

// Math Blast levels — 5 clear levels
export type MathLevel = {
  id: number;
  label: string;
  ops: ("+" | "-" | "×" | "÷")[];
  maxNum: number;
  questionsPerLevel: number;
};

export const mathLevels: MathLevel[] = [
  { id: 1, label: "Level 1 — Adding to 10",   ops: ["+"],          maxNum: 10, questionsPerLevel: 5 },
  { id: 2, label: "Level 2 — Adding to 20",   ops: ["+", "-"],     maxNum: 20, questionsPerLevel: 5 },
  { id: 3, label: "Level 3 — Subtraction",    ops: ["+", "-"],     maxNum: 30, questionsPerLevel: 6 },
  { id: 4, label: "Level 4 — Multiplication", ops: ["+", "-", "×"], maxNum: 12, questionsPerLevel: 6 },
  { id: 5, label: "Level 5 — Champion!",      ops: ["+", "-", "×"], maxNum: 20, questionsPerLevel: 8 },
];

// Jigsaw puzzles — 6 puzzles
export const jigsawImages = [
  { id: "solar",  emojiCenter: "🪐", title: "Solar System",    fun: "Did you know Jupiter is SO big 1,300 Earths could fit inside it?! 🪐" },
  { id: "world",  emojiCenter: "🌍", title: "World Map",       fun: "Earth is moving 107,000 km/h around the sun RIGHT NOW! 🚀" },
  { id: "abc",    emojiCenter: "🔠", title: "English Alphabet", fun: "There are 26 English letters — you know them all! 🔠" },
  { id: "ocean",  emojiCenter: "🌊", title: "Ocean Life",      fun: "The ocean covers 71% of the Earth's surface! 🌊" },
  { id: "jungle", emojiCenter: "🌴", title: "Jungle Animals",  fun: "There are more species in a jungle than anywhere on Earth! 🌴" },
  { id: "space",  emojiCenter: "🚀", title: "Space Adventure", fun: "It takes 8 minutes for sunlight to reach Earth! ☀️" },
];
