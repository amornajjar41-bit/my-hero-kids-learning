export type Story = {
  id: string;
  lang: "en" | "ar";
  titleEn: string;
  titleAr: string;
  emoji: string;
  moral: { en: string; ar: string };
  sentences: string[];
};

export const STORIES: Story[] = [
  {
    id: "1",
    lang: "ar",
    titleEn: "The Brave Little Lion",
    titleAr: "الأسد الصغير الشجاع",
    emoji: "🦁",
    moral: { en: "Courage is doing the right thing even when afraid.", ar: "الشجاعة هي فعل الشيء الصحيح حتى وأنت خائف." },
    sentences: [
      "في غابة بعيدة... كان يعيش أسد صغير اسمه ليو.",
      "كان ليو يحب اللعب... لكنه كان خائفاً من الظلام.",
      "سمع صوت بكاء عصفور سقط من عشه.",
      "قال... أنا خائف... لكن العصفور يحتاجني.",
      "خطا نحو الظلام ووجد العصفور.",
      "أدرك أن الشجاعة هي فعل الشيء الصحيح حتى وأنت خائف.",
    ],
  },
  {
    id: "2",
    lang: "ar",
    titleEn: "The Rain Star",
    titleAr: "نجمة المطر",
    emoji: "⭐",
    moral: { en: "Your tears can become gifts to the world.", ar: "دموعك يمكن أن تصبح هديةً للعالم." },
    sentences: [
      "نجمة اسمها لمى بكت من الحنان على الأرض الجافة.",
      "دموعها صارت مطراً فازهرت الأزهار وضحك الأطفال.",
      "دموعها لم تكن ضعفاً... كانت هديتها للعالم.",
    ],
  },
  {
    id: "3",
    lang: "ar",
    titleEn: "The Elephant Who Forgot",
    titleAr: "الفيل الذي نسي",
    emoji: "🐘",
    moral: { en: "The heart never forgets what truly matters.", ar: "القلب لا ينسى ما يهم حقاً." },
    sentences: [
      "فيلو ينسى كل شيء.",
      "جدته قالت: الذاكرة في القلب لا تنسى أبداً.",
      "هل نسيت أن تحب أصدقاءك؟ لا أبداً.",
      "إذن أنت لا تنسى ما يهم.",
    ],
  },
  {
    id: "4",
    lang: "ar",
    titleEn: "The Boy Who Planted a Moon",
    titleAr: "الولد الذي زرع قمراً",
    emoji: "🌙",
    moral: { en: "Beautiful things need time, love, and patience.", ar: "كل شيء جميل يحتاج وقتاً ومحبة وصبراً." },
    sentences: [
      "سامي وجد بذرة تلمع.",
      "سقاها كل ليلة.",
      "ضحك الجميع... لكنه لم يتوقف.",
      "نبت ضوء أضاء القرية.",
      "كل شيء جميل يحتاج وقتاً ومحبة وصبراً.",
    ],
  },
  {
    id: "5",
    lang: "ar",
    titleEn: "The Library Secret",
    titleAr: "سر المكتبة",
    emoji: "📚",
    moral: { en: "Books take you on journeys without leaving home.", ar: "الكتب تأخذك في رحلات دون أن تغادر البيت." },
    sentences: [
      "ليلى كرهت القراءة.",
      "دخلت مكتبة وحيدة.",
      "الكتب أخذتها في رحلات لعوالم مختلفة.",
      "صباحاً كانت تمسك كتاباً ولا تستطيع التوقف.",
    ],
  },
  {
    id: "6",
    lang: "en",
    titleEn: "The Cloud Who Was Different",
    titleAr: "السحابة المختلفة",
    emoji: "❄️",
    moral: { en: "Being different is not something to fix. It is something to share.", ar: "أن تكون مختلفاً ليس شيئاً يجب إصلاحه. هو شيء يجب مشاركته." },
    sentences: [
      "Pip the cloud could only make snowflakes.",
      "Others laughed.",
      "But on a hot day children danced with joy catching snowflakes.",
      "Being different was not something to fix. It was something to share.",
    ],
  },
  {
    id: "7",
    lang: "en",
    titleEn: "The Lighthouse Cat",
    titleAr: "قطة المنارة",
    emoji: "🐱",
    moral: { en: "Love is always bigger than fear.", ar: "الحب دائماً أكبر من الخوف." },
    sentences: [
      "Mia the cat feared water.",
      "But on a stormy night she woke keeper Tom to save a ship.",
      "Love is always bigger than fear.",
    ],
  },
  {
    id: "8",
    lang: "en",
    titleEn: "The Boy Who Collected Sunsets",
    titleAr: "الولد الذي جمع الغروب",
    emoji: "🌅",
    moral: { en: "Art captures how moments feel, not just how they look.", ar: "الفن يلتقط شعور اللحظات لا شكلها فقط." },
    sentences: [
      "Omar drew every sunset.",
      "People said it was a waste.",
      "A famous artist saw his wall and said he captured what no camera could.",
      "How each day felt when it ended.",
    ],
  },
  {
    id: "9",
    lang: "en",
    titleEn: "The Giant Who Was Lonely",
    titleAr: "العملاق الوحيد",
    emoji: "🌟",
    moral: { en: "One wave can change everything.", ar: "موجة واحدة يمكن أن تغير كل شيء." },
    sentences: [
      "Everyone feared giant Boru except Nadia who waved every day.",
      "He slowly waved back.",
      "What they feared was just lonely.",
      "One wave can change everything.",
    ],
  },
  {
    id: "10",
    lang: "en",
    titleEn: "The Last Cookie",
    titleAr: "آخر بسكويتة",
    emoji: "🍪",
    moral: { en: "Some arguments end with nobody winning. That is perfectly fine.", ar: "بعض الخلافات تنتهي دون أن يفوز أحد. وهذا جيد تماماً." },
    sentences: [
      "Zara and Max argued all day over the last cookie.",
      "They fell asleep exhausted.",
      "Mother ate it with tea.",
      "Both children laughed in the morning.",
      "Some arguments end with nobody winning. That is perfectly fine.",
    ],
  },
];
