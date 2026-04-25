import type { Lang } from "./i18n";

export type LessonStep =
  | {
      kind: "hook";
      titleEn: string;
      titleAr: string;
      bodyEn: string;
      bodyAr: string;
    }
  | {
      kind: "introduce";
      wordEn: string;
      wordAr: string;
      emoji: string;
    }
  | {
      kind: "repeat";
      wordEn: string;
      wordAr: string;
      emoji: string;
    }
  | {
      kind: "challenge";
      promptEn: string;
      promptAr: string;
      options: Array<{ emoji: string; en: string; ar: string }>;
      correctIndex: number;
    }
  | { kind: "celebrate" };

export type Lesson = {
  id: string;
  unit: string;
  unitTitleEn: string;
  unitTitleAr: string;
  titleEn: string;
  titleAr: string;
  emoji: string;
  // Words shown as a list of {emoji, en, ar}
  words: Array<{ emoji: string; en: string; ar: string }>;
  funFactEn: string;
  funFactAr: string;
};

const englishLessons: Lesson[] = [
  {
    id: "en-u1-l1",
    unit: "u1",
    unitTitleEn: "My World",
    unitTitleAr: "عالمي",
    titleEn: "Colors",
    titleAr: "الألوان",
    emoji: "🎨",
    words: [
      { emoji: "🟥", en: "Red", ar: "أحمر" },
      { emoji: "🟦", en: "Blue", ar: "أزرق" },
      { emoji: "🟩", en: "Green", ar: "أخضر" },
      { emoji: "🟨", en: "Yellow", ar: "أصفر" },
      { emoji: "🟪", en: "Purple", ar: "بنفسجي" },
      { emoji: "🟧", en: "Orange", ar: "برتقالي" },
      { emoji: "🩷", en: "Pink", ar: "وردي" },
      { emoji: "⬜", en: "White", ar: "أبيض" },
      { emoji: "⬛", en: "Black", ar: "أسود" },
    ],
    funFactEn: "Did you know rainbows have 7 colors? 🌈",
    funFactAr: "هل تعلم أن قوس قزح فيه ٧ ألوان؟ 🌈",
  },
  {
    id: "en-u1-l2",
    unit: "u1",
    unitTitleEn: "My World",
    unitTitleAr: "عالمي",
    titleEn: "Numbers 1–10",
    titleAr: "الأرقام ١–١٠",
    emoji: "🔢",
    words: [
      { emoji: "1️⃣", en: "One", ar: "واحد" },
      { emoji: "2️⃣", en: "Two", ar: "اثنان" },
      { emoji: "3️⃣", en: "Three", ar: "ثلاثة" },
      { emoji: "4️⃣", en: "Four", ar: "أربعة" },
      { emoji: "5️⃣", en: "Five", ar: "خمسة" },
      { emoji: "6️⃣", en: "Six", ar: "ستة" },
      { emoji: "7️⃣", en: "Seven", ar: "سبعة" },
      { emoji: "8️⃣", en: "Eight", ar: "ثمانية" },
      { emoji: "9️⃣", en: "Nine", ar: "تسعة" },
      { emoji: "🔟", en: "Ten", ar: "عشرة" },
    ],
    funFactEn: "Counting helps astronauts launch rockets! 🚀",
    funFactAr: "العد ساعد رواد الفضاء يطلقوا الصواريخ! 🚀",
  },
  {
    id: "en-u1-l3",
    unit: "u1",
    unitTitleEn: "My World",
    unitTitleAr: "عالمي",
    titleEn: "Animals",
    titleAr: "الحيوانات",
    emoji: "🐾",
    words: [
      { emoji: "🐱", en: "Cat", ar: "قطة" },
      { emoji: "🐶", en: "Dog", ar: "كلب" },
      { emoji: "🐘", en: "Elephant", ar: "فيل" },
      { emoji: "🦁", en: "Lion", ar: "أسد" },
      { emoji: "🐦", en: "Bird", ar: "طائر" },
      { emoji: "🐟", en: "Fish", ar: "سمكة" },
      { emoji: "🐰", en: "Rabbit", ar: "أرنب" },
      { emoji: "🐴", en: "Horse", ar: "حصان" },
    ],
    funFactEn: "Lions sleep 20 hours a day — lazier than your cat! 😄",
    funFactAr: "الأسد بينام ٢٠ ساعة باليوم — أكسل من قطتك! 😄",
  },
  {
    id: "en-u1-l4",
    unit: "u1",
    unitTitleEn: "My World",
    unitTitleAr: "عالمي",
    titleEn: "My Body",
    titleAr: "جسمي",
    emoji: "🧒",
    words: [
      { emoji: "👤", en: "Head", ar: "رأس" },
      { emoji: "👀", en: "Eyes", ar: "عيون" },
      { emoji: "👃", en: "Nose", ar: "أنف" },
      { emoji: "👄", en: "Mouth", ar: "فم" },
      { emoji: "👂", en: "Ears", ar: "أذنان" },
      { emoji: "✋", en: "Hands", ar: "يدان" },
      { emoji: "🦶", en: "Feet", ar: "قدمان" },
    ],
    funFactEn: "Your eye blinks 15,000 times every day! 👀",
    funFactAr: "عينك ترمش ١٥,٠٠٠ مرة كل يوم! 👀",
  },
  {
    id: "en-u1-l5",
    unit: "u1",
    unitTitleEn: "My World",
    unitTitleAr: "عالمي",
    titleEn: "Family",
    titleAr: "العائلة",
    emoji: "👨‍👩‍👧‍👦",
    words: [
      { emoji: "👩", en: "Mom", ar: "ماما" },
      { emoji: "👨", en: "Dad", ar: "بابا" },
      { emoji: "👦", en: "Brother", ar: "أخ" },
      { emoji: "👧", en: "Sister", ar: "أخت" },
      { emoji: "👵", en: "Grandma", ar: "تيتا" },
      { emoji: "👴", en: "Grandpa", ar: "جدو" },
    ],
    funFactEn: "Family is your first team — the best team ever! ❤️",
    funFactAr: "العائلة هي فريقك الأول — أحلى فريق! ❤️",
  },
  {
    id: "en-u2-l6",
    unit: "u2",
    unitTitleEn: "My Day",
    unitTitleAr: "يومي",
    titleEn: "Morning Routine",
    titleAr: "روتين الصباح",
    emoji: "🌅",
    words: [
      { emoji: "⏰", en: "Wake up", ar: "أستيقظ" },
      { emoji: "🪥", en: "Brush teeth", ar: "أنظف أسناني" },
      { emoji: "🥣", en: "Breakfast", ar: "أتناول الفطور" },
      { emoji: "🎒", en: "Go to school", ar: "أذهب للمدرسة" },
    ],
    funFactEn: "A great day starts with a great morning! ☀️",
    funFactAr: "اليوم الحلو بيبدأ من الصباح! ☀️",
  },
  {
    id: "en-u2-l7",
    unit: "u2",
    unitTitleEn: "My Day",
    unitTitleAr: "يومي",
    titleEn: "Food & Drinks",
    titleAr: "الطعام والشراب",
    emoji: "🍎",
    words: [
      { emoji: "🍞", en: "Bread", ar: "خبز" },
      { emoji: "🥛", en: "Milk", ar: "حليب" },
      { emoji: "🍎", en: "Apple", ar: "تفاحة" },
      { emoji: "🍚", en: "Rice", ar: "أرز" },
      { emoji: "💧", en: "Water", ar: "ماء" },
      { emoji: "🧃", en: "Juice", ar: "عصير" },
      { emoji: "🥚", en: "Egg", ar: "بيضة" },
      { emoji: "🧀", en: "Cheese", ar: "جبنة" },
    ],
    funFactEn: "Bananas are berries but strawberries are not! 🍓",
    funFactAr: "الموز يعتبر توت بس الفراولة لأ! 🍓",
  },
  {
    id: "en-u2-l8",
    unit: "u2",
    unitTitleEn: "My Day",
    unitTitleAr: "يومي",
    titleEn: "Places",
    titleAr: "الأماكن",
    emoji: "🏫",
    words: [
      { emoji: "🏫", en: "School", ar: "مدرسة" },
      { emoji: "🏠", en: "Home", ar: "بيت" },
      { emoji: "🏞️", en: "Park", ar: "حديقة" },
      { emoji: "🏥", en: "Hospital", ar: "مستشفى" },
      { emoji: "🛒", en: "Market", ar: "سوق" },
      { emoji: "🕌", en: "Mosque", ar: "مسجد" },
    ],
    funFactEn: "There are over 4 million schools in the world! 🌍",
    funFactAr: "في أكثر من ٤ مليون مدرسة بالعالم! 🌍",
  },
  {
    id: "en-u2-l9",
    unit: "u2",
    unitTitleEn: "My Day",
    unitTitleAr: "يومي",
    titleEn: "Feelings",
    titleAr: "المشاعر",
    emoji: "😊",
    words: [
      { emoji: "😊", en: "Happy", ar: "سعيد" },
      { emoji: "😢", en: "Sad", ar: "حزين" },
      { emoji: "😡", en: "Angry", ar: "غاضب" },
      { emoji: "😨", en: "Scared", ar: "خائف" },
      { emoji: "🤩", en: "Excited", ar: "متحمس" },
      { emoji: "😴", en: "Tired", ar: "متعب" },
      { emoji: "😲", en: "Surprised", ar: "متفاجئ" },
    ],
    funFactEn: "Smiling can actually make you feel happier! 😊",
    funFactAr: "الابتسامة فعلاً بتخليك أسعد! 😊",
  },
  {
    id: "en-u2-l10",
    unit: "u2",
    unitTitleEn: "My Day",
    unitTitleAr: "يومي",
    titleEn: "Weather",
    titleAr: "الطقس",
    emoji: "🌦️",
    words: [
      { emoji: "☀️", en: "Sunny", ar: "مشمس" },
      { emoji: "🌧️", en: "Rainy", ar: "ممطر" },
      { emoji: "☁️", en: "Cloudy", ar: "غائم" },
      { emoji: "💨", en: "Windy", ar: "عاصف" },
      { emoji: "❄️", en: "Snowy", ar: "ثلجي" },
      { emoji: "🥵", en: "Hot", ar: "حار" },
      { emoji: "🥶", en: "Cold", ar: "بارد" },
    ],
    funFactEn: "The biggest snowflake ever was 38 cm wide! ❄️",
    funFactAr: "أكبر ندفة ثلج بالتاريخ كان عرضها ٣٨ سم! ❄️",
  },
  {
    id: "en-u3-l11",
    unit: "u3",
    unitTitleEn: "Let's Talk",
    unitTitleAr: "هيا نتكلم",
    titleEn: "Greetings",
    titleAr: "التحيات",
    emoji: "👋",
    words: [
      { emoji: "👋", en: "Hello", ar: "مرحبا" },
      { emoji: "🌅", en: "Good morning", ar: "صباح الخير" },
      { emoji: "🌙", en: "Good night", ar: "تصبح على خير" },
      { emoji: "✋", en: "See you", ar: "إلى اللقاء" },
      { emoji: "👋", en: "Goodbye", ar: "وداعاً" },
      { emoji: "🤝", en: "Nice to meet you", ar: "تشرفنا" },
    ],
    funFactEn: "There are over 7,000 languages in the world! 🌍",
    funFactAr: "في أكثر من ٧٠٠٠ لغة بالعالم! 🌍",
  },
  {
    id: "en-u3-l12",
    unit: "u3",
    unitTitleEn: "Let's Talk",
    unitTitleAr: "هيا نتكلم",
    titleEn: "Action Words",
    titleAr: "أفعال الحركة",
    emoji: "🏃",
    words: [
      { emoji: "🏃", en: "Run", ar: "يركض" },
      { emoji: "🤸", en: "Jump", ar: "يقفز" },
      { emoji: "🍽️", en: "Eat", ar: "يأكل" },
      { emoji: "😴", en: "Sleep", ar: "ينام" },
      { emoji: "📖", en: "Read", ar: "يقرأ" },
      { emoji: "✏️", en: "Write", ar: "يكتب" },
      { emoji: "⚽", en: "Play", ar: "يلعب" },
      { emoji: "😄", en: "Laugh", ar: "يضحك" },
    ],
    funFactEn: "Action words are called verbs — they make sentences move! ⚡",
    funFactAr: "أفعال الحركة اسمها أفعال — هي اللي بتحرك الجملة! ⚡",
  },
];

const arabicLessons: Lesson[] = [
  {
    id: "ar-u1-l1",
    unit: "u1",
    unitTitleEn: "Letters & Sounds",
    unitTitleAr: "الحروف والأصوات",
    titleEn: "Letters Alif-Baa-Taa-Thaa",
    titleAr: "حروف أ ب ت ث",
    emoji: "🔠",
    words: [
      { emoji: "🍎", en: "Alif", ar: "أ" },
      { emoji: "🦆", en: "Baa", ar: "ب" },
      { emoji: "🍎", en: "Taa", ar: "ت" },
      { emoji: "🦊", en: "Thaa", ar: "ث" },
    ],
    funFactEn: "Arabic has 28 letters and they connect like a chain! 🔗",
    funFactAr: "الأبجدية العربية فيها ٢٨ حرف وبتتصل ببعض زي السلسلة! 🔗",
  },
  {
    id: "ar-u1-l2",
    unit: "u1",
    unitTitleEn: "Letters & Sounds",
    unitTitleAr: "الحروف والأصوات",
    titleEn: "Letters Jeem to Thal",
    titleAr: "حروف ج ح خ د ذ",
    emoji: "🔤",
    words: [
      { emoji: "🐫", en: "Jeem", ar: "ج" },
      { emoji: "🐎", en: "Haa", ar: "ح" },
      { emoji: "🍞", en: "Khaa", ar: "خ" },
      { emoji: "🐻", en: "Daal", ar: "د" },
      { emoji: "🐺", en: "Thaal", ar: "ذ" },
    ],
    funFactEn: "Letter ح sounds like warm breath on your hand 😄",
    funFactAr: "حرف الحاء زي صوت لما تتنفس على إيدك عشان تدفيها! 😄",
  },
  {
    id: "ar-u1-l3",
    unit: "u1",
    unitTitleEn: "Letters & Sounds",
    unitTitleAr: "الحروف والأصوات",
    titleEn: "Letters Raa to Sheen",
    titleAr: "حروف ر ز س ش",
    emoji: "🔤",
    words: [
      { emoji: "🍇", en: "Raa", ar: "ر" },
      { emoji: "🦒", en: "Zay", ar: "ز" },
      { emoji: "🐟", en: "Seen", ar: "س" },
      { emoji: "☀️", en: "Sheen", ar: "ش" },
    ],
    funFactEn: "Try a tongue twister: شمس شمس شمس! ☀️",
    funFactAr: "جرب: شمس شمس شمس! ☀️",
  },
  {
    id: "ar-u1-l4",
    unit: "u1",
    unitTitleEn: "Letters & Sounds",
    unitTitleAr: "الحروف والأصوات",
    titleEn: "Strong letters",
    titleAr: "حروف قوية ص ض ط ظ",
    emoji: "💪",
    words: [
      { emoji: "🪨", en: "Saad", ar: "ص" },
      { emoji: "🌑", en: "Daad", ar: "ض" },
      { emoji: "🍅", en: "Taa heavy", ar: "ط" },
      { emoji: "🌒", en: "Zaa heavy", ar: "ظ" },
    ],
    funFactEn: "These are the secret letters of Arabic — and YOU can do them! 💪",
    funFactAr: "هدول الحروف سرّ العربية! بس انت بتقدر تتعلمها 💪",
  },
  {
    id: "ar-u2-l5",
    unit: "u2",
    unitTitleEn: "My First Words",
    unitTitleAr: "كلماتي الأولى",
    titleEn: "Colors",
    titleAr: "الألوان",
    emoji: "🎨",
    words: [
      { emoji: "🟥", en: "Red", ar: "أحمر" },
      { emoji: "🟦", en: "Blue", ar: "أزرق" },
      { emoji: "🟩", en: "Green", ar: "أخضر" },
      { emoji: "🟨", en: "Yellow", ar: "أصفر" },
      { emoji: "🟪", en: "Purple", ar: "بنفسجي" },
      { emoji: "🟧", en: "Orange", ar: "برتقالي" },
    ],
    funFactEn: "The Arabic word for color is لون!",
    funFactAr: "كلمة لون في العربية حلوة! 🎨",
  },
  {
    id: "ar-u2-l6",
    unit: "u2",
    unitTitleEn: "My First Words",
    unitTitleAr: "كلماتي الأولى",
    titleEn: "Numbers 1-10",
    titleAr: "الأرقام ١-١٠",
    emoji: "🔢",
    words: [
      { emoji: "١", en: "One", ar: "واحد" },
      { emoji: "٢", en: "Two", ar: "اثنان" },
      { emoji: "٣", en: "Three", ar: "ثلاثة" },
      { emoji: "٤", en: "Four", ar: "أربعة" },
      { emoji: "٥", en: "Five", ar: "خمسة" },
      { emoji: "٦", en: "Six", ar: "ستة" },
      { emoji: "٧", en: "Seven", ar: "سبعة" },
      { emoji: "٨", en: "Eight", ar: "ثمانية" },
      { emoji: "٩", en: "Nine", ar: "تسعة" },
      { emoji: "١٠", en: "Ten", ar: "عشرة" },
    ],
    funFactEn: "Arabic numbers travel the world — 1, 2, 3 came from them! 🌍",
    funFactAr: "الأرقام بالعالم كلها أصلها عربي! 🌍",
  },
  {
    id: "ar-u2-l7",
    unit: "u2",
    unitTitleEn: "My First Words",
    unitTitleAr: "كلماتي الأولى",
    titleEn: "Animals",
    titleAr: "الحيوانات",
    emoji: "🐾",
    words: [
      { emoji: "🦁", en: "Lion", ar: "أسد" },
      { emoji: "🐱", en: "Cat", ar: "قطة" },
      { emoji: "🐶", en: "Dog", ar: "كلب" },
      { emoji: "🐘", en: "Elephant", ar: "فيل" },
      { emoji: "🐦", en: "Bird", ar: "طير" },
      { emoji: "🐟", en: "Fish", ar: "سمكة" },
    ],
    funFactEn: "أسد means king of the jungle! 🦁",
    funFactAr: "الأسد ملك الغابة! 🦁",
  },
  {
    id: "ar-u2-l8",
    unit: "u2",
    unitTitleEn: "My First Words",
    unitTitleAr: "كلماتي الأولى",
    titleEn: "My Body",
    titleAr: "جسمي",
    emoji: "🧒",
    words: [
      { emoji: "👤", en: "Head", ar: "رأس" },
      { emoji: "👀", en: "Eyes", ar: "عيون" },
      { emoji: "👃", en: "Nose", ar: "أنف" },
      { emoji: "👄", en: "Mouth", ar: "فم" },
      { emoji: "✋", en: "Hands", ar: "يدان" },
      { emoji: "🦶", en: "Feet", ar: "قدمان" },
    ],
    funFactEn: "Your body has over 200 bones! 🦴",
    funFactAr: "في جسمك أكثر من ٢٠٠ عظمة! 🦴",
  },
  {
    id: "ar-u2-l9",
    unit: "u2",
    unitTitleEn: "My First Words",
    unitTitleAr: "كلماتي الأولى",
    titleEn: "Family",
    titleAr: "عائلتي",
    emoji: "👨‍👩‍👧‍👦",
    words: [
      { emoji: "👩", en: "Mom", ar: "ماما" },
      { emoji: "👨", en: "Dad", ar: "بابا" },
      { emoji: "👦", en: "Brother", ar: "أخ" },
      { emoji: "👧", en: "Sister", ar: "أخت" },
      { emoji: "👵", en: "Grandma", ar: "تيتا" },
      { emoji: "👴", en: "Grandpa", ar: "جدو" },
    ],
    funFactEn: "Family is everything! ❤️",
    funFactAr: "العيلة هي كل شي! ❤️",
  },
  {
    id: "ar-u3-l10",
    unit: "u3",
    unitTitleEn: "I Speak Arabic",
    unitTitleAr: "أتكلم عربي",
    titleEn: "Greetings",
    titleAr: "تحياتي",
    emoji: "👋",
    words: [
      { emoji: "🤝", en: "Salaam", ar: "السلام عليكم" },
      { emoji: "👋", en: "Hello", ar: "مرحبا" },
      { emoji: "🌅", en: "Good morning", ar: "صباح الخير" },
      { emoji: "🌙", en: "Good evening", ar: "مساء الخير" },
      { emoji: "❤️", en: "How are you", ar: "كيفك" },
      { emoji: "😴", en: "Good night", ar: "تصبح على خير" },
    ],
    funFactEn: "السلام عليكم means 'peace be upon you' 🕊️",
    funFactAr: "السلام عليكم معناها سلام عليك! 🕊️",
  },
  {
    id: "ar-u3-l11",
    unit: "u3",
    unitTitleEn: "I Speak Arabic",
    unitTitleAr: "أتكلم عربي",
    titleEn: "School",
    titleAr: "في المدرسة",
    emoji: "🏫",
    words: [
      { emoji: "🧑‍🏫", en: "Teacher", ar: "معلم" },
      { emoji: "🏫", en: "Classroom", ar: "صف" },
      { emoji: "📚", en: "Book", ar: "كتاب" },
      { emoji: "✏️", en: "Pencil", ar: "قلم" },
      { emoji: "📝", en: "Homework", ar: "واجب" },
      { emoji: "📋", en: "Exam", ar: "امتحان" },
      { emoji: "🧑‍🤝‍🧑", en: "Friend", ar: "صديق" },
    ],
    funFactEn: "School is where heroes are made! 🦸",
    funFactAr: "المدرسة هي مكان الأبطال! 🦸",
  },
  {
    id: "ar-u3-l12",
    unit: "u3",
    unitTitleEn: "I Speak Arabic",
    unitTitleAr: "أتكلم عربي",
    titleEn: "Verbs",
    titleAr: "أفعالي",
    emoji: "🏃",
    words: [
      { emoji: "🏃", en: "Run", ar: "يركض" },
      { emoji: "🤸", en: "Jump", ar: "يقفز" },
      { emoji: "🍽️", en: "Eat", ar: "يأكل" },
      { emoji: "😴", en: "Sleep", ar: "ينام" },
      { emoji: "📖", en: "Read", ar: "يقرأ" },
      { emoji: "✏️", en: "Write", ar: "يكتب" },
      { emoji: "⚽", en: "Play", ar: "يلعب" },
      { emoji: "😄", en: "Laugh", ar: "يضحك" },
    ],
    funFactEn: "Arabic verbs all start with ي for 'he does' something!",
    funFactAr: "كل الأفعال بالعربي بتبدأ بـ ي يعني هو يعمل! ⚡",
  },
];

export const curriculum: Record<"english" | "arabic", Lesson[]> = {
  english: englishLessons,
  arabic: arabicLessons,
};

export function lessonTitle(lesson: Lesson, lang: Lang): string {
  return lang === "ar" ? lesson.titleAr : lesson.titleEn;
}
export function unitTitle(lesson: Lesson, lang: Lang): string {
  return lang === "ar" ? lesson.unitTitleAr : lesson.unitTitleEn;
}
