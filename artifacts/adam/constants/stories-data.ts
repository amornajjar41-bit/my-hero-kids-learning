export type StoryLang = "ar" | "en";
export type AgeRange = "4-6" | "4-7" | "4-8" | "5-9" | "6-10" | "7-10" | "7-11";

export type StoryScene = {
  emoji: string;
  bg: [string, string];
  startSec: number; // when to switch to this scene
};

export type Story = {
  id: string;
  lang: StoryLang;
  titleEn: string;
  titleAr: string;
  durationMin: number;
  ageRange: AgeRange;
  cardEmoji: string;
  cardBg: [string, string];
  tone: string;
  scenes: StoryScene[];
  textEn: string;
  textAr: string;
};

export const STORIES: Story[] = [
  {
    id: "brave-lion",
    lang: "ar",
    titleEn: "The Brave Little Lion",
    titleAr: "الأسد الصغير الشجاع",
    durationMin: 5,
    ageRange: "4-8",
    cardEmoji: "🦁",
    cardBg: ["#7C3AED", "#C4B5FD"],
    tone: "warm, slow, calm",
    scenes: [
      { emoji: "🦁", bg: ["#1e1b4b", "#312e81"], startSec: 0 },
      { emoji: "🌲", bg: ["#064e3b", "#065f46"], startSec: 60 },
      { emoji: "🐦", bg: ["#1d4ed8", "#1e40af"], startSec: 120 },
      { emoji: "⭐", bg: ["#1e1b4b", "#4c1d95"], startSec: 220 },
    ],
    textEn: `Once upon a time, in a forest filled with moonlight and gentle breezes, lived a little lion named Leo. Leo had a fluffy golden mane and bright amber eyes — but every night, when darkness fell between the tall trees, Leo trembled with fear.\n\n"The forest at night is too dark," Leo would whisper to himself, pulling his blanket tighter.\n\nOne evening, Leo heard a tiny sound — a soft chirping from high in a tree.\n\n"Help! I'm lost!" cried a little bird with bright blue feathers. "I flew too far and I can't find my nest!"\n\nLeo looked at the dark forest path. His heart beat fast — boom, boom, boom. He was scared. Very scared. But the little bird needed him.\n\n"Being brave doesn't mean you're not scared," Leo remembered his mother saying. "It means you do something even when you ARE scared."\n\nSo Leo tried a new way. One paw forward. Then another. He walked through the dark forest, guided by the stars above, until he found the little bird's nest nestled in a warm oak tree.\n\nThe little bird fluttered home with a joyful tweet.\n\nThat night, Leo lay under the open stars, his heart warm and proud. The forest didn't feel so dark anymore. It felt like home.\n\nAnd as the crickets sang their gentle lullaby, and the wind rocked the trees softly… Leo closed his eyes, smiled, and fell into the most peaceful sleep he had ever known.\n\nGoodnight, little lion. Goodnight.`,
    textAr: `كان يا ما كان، في غابة مليئة بضوء القمر ونسيم عليل، كان يسكن أسد صغير اسمه ليو. كان ليو يملك لبدة ذهبية ناعمة وعيونًا عسلية براقة — ولكن كل ليلة، حين يحل الظلام بين الأشجار الطويلة، كان ليو يرتجف من الخوف.\n\n"الغابة في الليل مظلمة جداً" كان يهمس لنفسه، وهو يشد بطانيته أكثر.\n\nفي إحدى الأمسيات، سمع ليو صوتاً خفيفاً — زقزقة صغيرة من أعلى شجرة.\n\n"النجدة! أنا ضايع!" صرخ عصفور صغير ذو ريش أزرق ساطع. "طرت بعيداً ولا أستطيع إيجاد عشي!"\n\nنظر ليو إلى درب الغابة المظلم. قلبه كان يدق بسرعة — بوم، بوم، بوم. كان خائفاً. خائفاً جداً. لكن العصفور الصغير احتاجه.\n\n"الشجاعة لا تعني أنك لست خائفاً" تذكر ليو كلام أمه. "تعني أنك تفعل الشيء حتى وأنت خائف."\n\nجرّب ليو طريقة جديدة. خطوة أمام. ثم أخرى. مشى في الغابة المظلمة، تحت هداية النجوم فوقه، حتى وجد عش العصفور الصغير في شجرة بلوط دافئة.\n\nرفرف العصفور الصغير إلى بيته بتغريدة مفرحة.\n\nفي تلك الليلة، استلقى ليو تحت النجوم المفتوحة، وقلبه دافئ ومفتخر. لم تعد الغابة تبدو مظلمة كثيراً. بدت مثل البيت.\n\nومع أغنية الجنادب اللطيفة، وتأرجح الأشجار برفق مع الريح… أغمض ليو عينيه، ابتسم، وغفا في أهدأ نوم عرفه على الإطلاق.\n\nتصبح على خير أيها الأسد الصغير. تصبح على خير.`,
  },
  {
    id: "rain-star",
    lang: "ar",
    titleEn: "The Rain Star",
    titleAr: "نجمة المطر",
    durationMin: 6,
    ageRange: "4-8",
    cardEmoji: "⭐",
    cardBg: ["#1d4ed8", "#6d28d9"],
    tone: "dreamy, magical",
    scenes: [
      { emoji: "⭐", bg: ["#0f0c29", "#302b63"], startSec: 0 },
      { emoji: "🌧️", bg: ["#1a1a2e", "#16213e"], startSec: 80 },
      { emoji: "🌸", bg: ["#134e4a", "#065f46"], startSec: 160 },
      { emoji: "😊", bg: ["#312e81", "#4c1d95"], startSec: 290 },
    ],
    textEn: `High above the clouds, where the air is cold and sparkly, lived a little star named Nora.\n\nEvery night she watched the earth below — dry and dusty, cracked and thirsty.\n\n"I wish I could help," she whispered to the darkness.\n\nOne night, Nora felt something strange — a warm feeling in her chest, rising and rising until… her eyes filled with tears. Silver, shimmering star tears.\n\n"Don't cry!" said the other stars. "Stars don't cry!"\n\nBut Nora couldn't stop. And as her tears fell, they turned into something magical — tiny silver droplets that cooled as they fell, becoming gentle rain.\n\nThe dry earth drank greedily. Seeds cracked open. Green shoots pushed through the soil. Flowers bloomed in every color of the rainbow.\n\nAnd the children! Oh, the children ran outside, laughing and spinning in the silver rain, their faces turned up to the sky.\n\nHigh above, Nora watched and smiled through her tears.\n\nThe other stars were quiet now. Then, one by one, they began to cry too — beautiful, gentle rain tears for the earth below.\n\nNora understood then: her tears weren't a weakness. They were her superpower.\n\nShe shone brighter than she ever had before.\n\nAnd the rain fell soft and steady, like a lullaby from the sky. Sleep now, little one. The stars are crying beautiful tears just for you. Goodnight.`,
    textAr: `في مكان عالٍ فوق السحاب، حيث الهواء بارد ومتلألئ، كانت تسكن نجمة صغيرة اسمها نورة.\n\nكل ليلة كانت تراقب الأرض من تحتها — جافة وغابرة، متشققة وعطشى.\n\n"أتمنى لو أستطيع المساعدة" كانت تهمس في الظلام.\n\nفي إحدى الليالي، شعرت نورة بشيء غريب — إحساس دافئ في صدرها، يرتفع ويرتفع حتى… امتلأت عيناها بالدموع. دموع فضية متلألئة.\n\n"لا تبكي!" قالت النجوم الأخرى. "النجوم لا تبكي!"\n\nلكن نورة لم تستطع التوقف. وحين سقطت دموعها، تحولت إلى شيء سحري — قطرات فضية صغيرة تبردت وهي تسقط، لتصبح مطراً لطيفاً.\n\nشربت الأرض الجافة بشراهة. انشقت البذور. تسللت براعم خضراء عبر التراب. تفتحت زهور بكل ألوان قوس قزح.\n\nوالأطفال! آه، ركض الأطفال إلى الخارج، يضحكون ويدورون في المطر الفضي، ووجوههم مرفوعة نحو السماء.\n\nفي الأعالي، نظرت نورة وابتسمت من خلال دموعها.\n\nصمتت النجوم الأخرى. ثم، واحدة تلو الأخرى، بدأت هي أيضاً تبكي — دموع مطر جميلة لطيفة على الأرض من تحتها.\n\nفهمت نورة حينها: دموعها ليست ضعفاً. إنها قوتها الخارقة.\n\nأضاءت أكثر مما أضاءت من قبل.\n\nوسقط المطر ناعماً منتظماً، مثل تهويدة من السماء. نم الآن يا صغيري. النجوم تبكي دموعاً جميلة خصيصاً لك. تصبح على خير.`,
  },
  {
    id: "filo-elephant",
    lang: "ar",
    titleEn: "The Elephant Who Forgot",
    titleAr: "الفيل الذي نسي",
    durationMin: 7,
    ageRange: "5-9",
    cardEmoji: "🐘",
    cardBg: ["#7c3aed", "#a78bfa"],
    tone: "playful then tender",
    scenes: [
      { emoji: "🐘", bg: ["#1e1b4b", "#2e1065"], startSec: 0 },
      { emoji: "😅", bg: ["#164e63", "#0c4a6e"], startSec: 90 },
      { emoji: "👵", bg: ["#451a03", "#78350f"], startSec: 250 },
      { emoji: "💙", bg: ["#0f172a", "#1e293b"], startSec: 360 },
    ],
    textEn: `Filo the elephant had a problem. He kept forgetting things.\n\nHe forgot where he put his favorite leaf hat. He forgot what he was saying in the middle of sentences. He even forgot his best friend's name — three times in one morning!\n\n"Oh Filo!" his friends would say, trying not to laugh.\n\nFilo felt sad. "What's wrong with me?" he wondered.\n\nOne evening, he went to visit his grandmother — wise old Nana — who sat under the oldest baobab tree in the whole savanna.\n\n"Nana," Filo sighed, sitting beside her. "I forget everything. I think my brain is broken."\n\nNana looked at him with kind, wrinkled eyes. She was quiet for a long, peaceful moment.\n\nThen she said, "Tell me, little one — do you forget how much you love your mother?"\n\n"No!" said Filo.\n\n"Do you forget that the sunset is beautiful?"\n\n"No!"\n\n"Do you forget the feeling of splashing in the cool river on a hot day?"\n\n"Never!" Filo laughed.\n\nNana smiled warmly. "The most important things," she said softly, "are never kept in the mind, Filo. They live here." She touched her heart gently.\n\nFilo sat very still. Then slowly, he smiled.\n\nThat night, he lay under the stars, not worrying about what he might forget tomorrow. Because the things that truly mattered? Those he would never, ever forget.\n\nHis heart knew them by heart.\n\nGoodnight, little one. Rest your big, beautiful heart. Goodnight.`,
    textAr: `فيلو الفيل كان لديه مشكلة. كان ينسى الأشياء دائماً.\n\nنسي أين وضع قبعة الأوراق المفضلة لديه. نسي ماذا كان يقول في منتصف الجمل. حتى أنه نسي اسم صديقه المفضل — ثلاث مرات في صباح واحد!\n\n"يا فيلو!" كان أصدقاؤه يقولون، محاولين عدم الضحك.\n\nشعر فيلو بالحزن. "ما الذي بي؟" تساءل.\n\nفي إحدى الأمسيات، ذهب لزيارة جدته — نانا الحكيمة — التي كانت تجلس تحت أقدم شجرة بوهيبا في السافانا كلها.\n\n"نانا" تنهد فيلو، جالساً بجانبها. "أنا أنسى كل شيء. أعتقد أن عقلي معطل."\n\nنظرت إليه نانا بعيون لطيفة متجعدة. صمتت لحظة طويلة هادئة.\n\nثم قالت، "قل لي يا صغيري — هل تنسى مدى حبك لأمك؟"\n\n"لا!" قال فيلو.\n\n"هل تنسى أن الغروب جميل؟"\n\n"لا!"\n\n"هل تنسى شعور التلاعب في النهر البارد في يوم حار؟"\n\n"أبداً!" ضحك فيلو.\n\nابتسمت نانا بدفء. "أهم الأشياء" قالت بهدوء، "لا تُحفظ أبداً في العقل يا فيلو. تعيش هنا." لمست قلبها برفق.\n\nجلس فيلو ساكناً تماماً. ثم ببطء، ابتسم.\n\nتلك الليلة، استلقى تحت النجوم، دون أن يقلق على ما قد ينساه غداً. لأن الأشياء التي تهم فعلاً؟ تلك لن ينساها أبداً، أبداً.\n\nقلبه يحفظها عن ظهر قلب.\n\nتصبح على خير يا صغيري. أرح قلبك الكبير الجميل. تصبح على خير.`,
  },
  {
    id: "moon-seed",
    lang: "ar",
    titleEn: "The Boy Who Planted a Moon",
    titleAr: "الولد الذي زرع قمراً",
    durationMin: 8,
    ageRange: "6-10",
    cardEmoji: "🌙",
    cardBg: ["#0f0c29", "#302b63"],
    tone: "magical, poetic, slow",
    scenes: [
      { emoji: "🌙", bg: ["#0f0c29", "#302b63"], startSec: 0 },
      { emoji: "🌱", bg: ["#064e3b", "#065f46"], startSec: 100 },
      { emoji: "😂", bg: ["#451a03", "#78350f"], startSec: 220 },
      { emoji: "✨", bg: ["#1e1b4b", "#4c1d95"], startSec: 380 },
    ],
    textEn: `One evening, a boy named Karim found something strange in an old market stall — a tiny seed that glowed like captured moonlight.\n\n"What does it grow into?" he asked the old merchant.\n\nThe merchant smiled a slow, mysterious smile. "Water it with patience. Talk to it with kindness. And wait."\n\nKarim planted the seed in his small backyard garden. Every night, he watered it gently and sat beside it, telling it about his day.\n\nThe neighbors laughed. "A glowing seed! Ridiculous!" they said.\n\nHis friends giggled. "What are you growing, Karim? Moonbeams?"\n\nBut Karim kept watering. Kept talking. Kept believing.\n\nDays passed. Weeks passed. Months passed.\n\nThen one night — a night like any other — Karim heard something.\n\nA soft, warm hum from the garden.\n\nHe crept outside. And there — rising slowly from the dark earth — grew a tiny, perfect moon. It floated up, gentle and glowing, until it hung over the whole village, bathing every rooftop, every window, every sleeping face in pure silver light.\n\nThe neighbors came out of their homes, mouths open, eyes wide.\n\nKarim just smiled. He had learned something no one could take away: the greatest things grow slowly — watered by patience, talked to with love.\n\nHe lay on the cool grass and looked up at his moon, shining just for him.\n\nAnd as the whole village fell asleep in that beautiful silver glow… so did Karim.\n\nGoodnight. Keep planting your impossible seeds. Goodnight.`,
    textAr: `في إحدى الأمسيات، وجد فتى اسمه كريم شيئاً غريباً في بسطة قديمة في السوق — بذرة صغيرة تتوهج مثل ضوء القمر المحبوس.\n\n"ماذا تُنبت؟" سأل التاجر العجوز.\n\nابتسم التاجر ابتسامة بطيئة غامضة. "اسقها بالصبر. حدثها باللطف. وانتظر."\n\nزرع كريم البذرة في حديقة بيته الصغيرة. كل ليلة كان يسقيها برفق ويجلس بجانبها، يحكي لها عن يومه.\n\nضحك الجيران. "بذرة متوهجة! سخيف!" قالوا.\n\nتضاحك أصدقاؤه. "ماذا تزرع يا كريم؟ أشعة قمر؟"\n\nلكن كريم استمر في السقي. استمر في الحديث. استمر في التصديق.\n\nمضت أيام. مضت أسابيع. مضت أشهر.\n\nثم في إحدى الليالي — ليلة كأي ليلة — سمع كريم شيئاً.\n\nدندنة ناعمة دافئة من الحديقة.\n\nتسلل إلى الخارج. وهناك — يرتفع ببطء من الأرض المظلمة — قمر صغير كامل. حلّق لأعلى، لطيفاً ومتوهجاً، حتى تعلق فوق القرية كلها، يغمر كل سطح، كل نافذة، كل وجه نائم بضوء فضي نقي.\n\nخرج الجيران من منازلهم، أفواههم مفتوحة، عيونهم واسعة.\n\nاكتفى كريم بالابتسام. لقد تعلم شيئاً لا يستطيع أحد انتزاعه: أعظم الأشياء تنمو ببطء — تُسقى بالصبر، وتُحدَّث بالمحبة.\n\nاستلقى على العشب البارد ونظر إلى قمره، يضيء خصيصاً لأجله.\n\nومع نوم القرية كلها في ذلك البريق الفضي الجميل… نام كريم أيضاً.\n\nتصبح على خير. استمر في زراعة بذورك المستحيلة. تصبح على خير.`,
  },
  {
    id: "library-secret",
    lang: "ar",
    titleEn: "The Secret of the Library",
    titleAr: "سر المكتبة",
    durationMin: 6,
    ageRange: "7-11",
    cardEmoji: "📚",
    cardBg: ["#7c2d12", "#92400e"],
    tone: "exciting then warm",
    scenes: [
      { emoji: "📚", bg: ["#1c1917", "#292524"], startSec: 0 },
      { emoji: "🌊", bg: ["#0c4a6e", "#075985"], startSec: 80 },
      { emoji: "🏰", bg: ["#4c1d95", "#5b21b6"], startSec: 180 },
      { emoji: "💛", bg: ["#431407", "#7c2d12"], startSec: 310 },
    ],
    textEn: `Layla hated reading. It was slow. It was boring. The words just sat there on the page, doing nothing exciting at all.\n\nSo when she got accidentally locked in the school library after closing time, she was furious.\n\n"Great," she muttered. "Stuck with a million boring books."\n\nThen the books started to glow.\n\nOne by one — a soft, warm light from their spines. Then a blue adventure novel on the top shelf cracked open on its own, and a wave of real ocean water came rushing out, stopping just at Layla's feet.\n\nA pirate ship appeared on that ocean. A captain with laughing eyes reached down. "Coming?" she asked.\n\nLayla found herself saying yes before she even decided.\n\nShe sailed through a storm. She mapped hidden islands. She discovered a treasure that wasn't gold — it was a library, deep underwater, where fish read books.\n\nThen a purple history book opened — and she stood in ancient Egypt, watching the pyramids rise stone by stone.\n\nThen a green science book — and she floated in space, touching a comet with her bare hand.\n\nFive worlds. Five adventures. All between two covers.\n\nWhen the library lights came on and the caretaker found her, Layla was sitting on the floor surrounded by open books, reading.\n\nReally, truly reading. And loving every word.\n\nShe never hated reading again.\n\nGoodnight, little reader. Every book is a door. Which one will you open tomorrow? Goodnight.`,
    textAr: `لين كانت تكره القراءة. كانت بطيئة. كانت مملة. الكلمات كانت تجلس على الصفحة هكذا، دون أي شيء مثير على الإطلاق.\n\nلذا حين أُقفلت بالصدفة في مكتبة المدرسة بعد ساعة الإغلاق، كانت غاضبة.\n\n"رائع" تمتمت. "محبوسة مع مليون كتاب ممل."\n\nثم بدأت الكتب تتوهج.\n\nواحداً تلو الآخر — ضوء ناعم دافئ من أغلفتها. ثم انفتح كتاب مغامرة أزرق على الرف الأعلى من تلقاء نفسه، وانهمرت موجة ماء بحر حقيقية، توقفت عند قدمَي لين.\n\nظهرت سفينة قرصان على ذلك البحر. ربانة ذات عيون ضاحكة مدّت يدها. "قادمة؟" سألت.\n\nوجدت لين نفسها تقول نعم قبل أن تحسم أمرها.\n\nأبحرت خلال عاصفة. رسمت خرائط جزر خفية. اكتشفت كنزاً لم يكن ذهباً — بل مكتبة في أعماق البحر، حيث تقرأ الأسماك الكتب.\n\nثم انفتح كتاب تاريخ بنفسجي — ووقفت في مصر القديمة، ترى الأهرامات ترتفع حجراً فحجراً.\n\nثم كتاب علوم أخضر — وطافت في الفضاء، تلمس مذنباً بيدها الحرة.\n\nخمسة عوالم. خمس مغامرات. كلها بين غلافين.\n\nحين أُضيئت مصابيح المكتبة وجدها الحارس جالسة على الأرض محاطة بكتب مفتوحة، تقرأ.\n\nتقرأ فعلاً، حقاً. وتحب كل كلمة.\n\nلم تكره القراءة بعدها أبداً.\n\nتصبحين على خير أيتها القارئة الصغيرة. كل كتاب هو باب. أيٌّ منها ستفتحين غداً؟ تصبحين على خير.`,
  },
  {
    id: "different-cloud",
    lang: "en",
    titleEn: "The Cloud Who Was Different",
    titleAr: "السحابة المختلفة",
    durationMin: 5,
    ageRange: "4-8",
    cardEmoji: "☁️",
    cardBg: ["#0369a1", "#0ea5e9"],
    tone: "gentle, whimsical",
    scenes: [
      { emoji: "☁️", bg: ["#0c4a6e", "#075985"], startSec: 0 },
      { emoji: "❄️", bg: ["#1e3a5f", "#1e40af"], startSec: 70 },
      { emoji: "🌞", bg: ["#78350f", "#92400e"], startSec: 170 },
      { emoji: "🎉", bg: ["#14532d", "#15803d"], startSec: 260 },
    ],
    textEn: `High in the summer sky, where all the clouds made warm, lazy rain, there was one cloud who was different.\n\nHis name was Nimbus, and he could only make snowflakes.\n\nIn summer.\n\nThe other clouds laughed. "Snowflakes in summer? How ridiculous!"\n\nThey floated away, chuckling. Nimbus drifted alone, watching the earth bake in the heat below.\n\nOne sweltering afternoon, a group of children ran out to play — but the sun was too hot. They sat in the shade, wilting like flowers.\n\n"I wish it would snow," sighed a little girl, fanning herself.\n\nNimbus heard her.\n\nHe tried a new way — and let go.\n\nOne snowflake. Then two. Then a thousand — beautiful, glittering, impossible summer snowflakes drifting down like tiny frozen stars.\n\nThe children looked up, mouths open in wonder.\n\nThen a laugh. Then another. Soon all the children were dancing, spinning, catching snowflakes on their tongues, on their warm summer skin.\n\n"It's MAGIC!" they shouted.\n\nNimbus beamed. He had never felt so right.\n\nBeing different, he learned, isn't something to hide. Sometimes it's the most important gift of all.\n\nGoodnight, little one. You are different in the most wonderful way. Goodnight.`,
    textAr: `في سماء الصيف العالية، حيث تصنع كل السحب مطراً دافئاً كسولاً، كانت هناك سحابة واحدة مختلفة.\n\nاسمه نيمبس، ولم يكن يستطيع صنع إلا رقاقات الثلج.\n\nفي الصيف.\n\nضحكت السحب الأخرى. "ثلج في الصيف؟ يا للسخافة!"\n\nابتعدت وهي تضحك. انجرف نيمبس وحيداً، يراقب الأرض تشوى من الحر تحته.\n\nفي ظهيرة قائظة، ركض مجموعة من الأطفال للخارج للعب — لكن الشمس كانت شديدة الحرارة. جلسوا في الظل، ذابلين كالزهور.\n\n"أتمنى لو يثلج" تنهدت فتاة صغيرة، ترفرف بيدها لتبريد وجهها.\n\nسمعها نيمبس.\n\nجرّب طريقة جديدة — وأطلق.\n\nرقاقة ثلج. ثم اثنتان. ثم ألف — رقاقات ثلج صيفية جميلة متلألئة مستحيلة تهبط كنجوم مثلجة صغيرة.\n\nنظر الأطفال لأعلى، أفواههم مفتوحة دهشةً.\n\nثم ضحكة. ثم أخرى. وسرعان ما كان الأطفال كلهم يرقصون، يدورون، يمسكون رقاقات الثلج بألسنتهم، على جلودهم الصيفية الدافئة.\n\n"إنه سحر!" صرخوا.\n\nتألق نيمبس. لم يشعر بهذا الصواب أبداً من قبل.\n\nأن تكون مختلفاً، تعلم، ليس شيئاً تخبئه. أحياناً يكون أهم هدية على الإطلاق.\n\nتصبح على خير يا صغيري. أنت مختلف بأجمل طريقة ممكنة. تصبح على خير.`,
  },
  {
    id: "lighthouse-cat",
    lang: "en",
    titleEn: "The Lighthouse Keeper's Cat",
    titleAr: "قطة حارس المنارة",
    durationMin: 6,
    ageRange: "5-9",
    cardEmoji: "🐱",
    cardBg: ["#134e4a", "#0f766e"],
    tone: "cozy and adventurous",
    scenes: [
      { emoji: "🐱", bg: ["#1e293b", "#0f172a"], startSec: 0 },
      { emoji: "⛈️", bg: ["#1c1917", "#292524"], startSec: 90 },
      { emoji: "🚢", bg: ["#0c4a6e", "#075985"], startSec: 210 },
      { emoji: "🌟", bg: ["#14532d", "#166534"], startSec: 330 },
    ],
    textEn: `In a cozy lighthouse on the edge of the sea lived a small orange cat named Cleo.\n\nCleo loved the lighthouse. She loved the warm lamp room. She loved the keeper's woolen sweater. She loved the smell of the sea.\n\nBut Cleo was terrified of the water.\n\nEvery time the waves crashed against the rocks, she retreated to the highest, driest corner, eyes wide, heart hammering.\n\n"Silly cat," the gulls would tease. "Scared of a little wave!"\n\nOne terrible night, a storm came — the worst in twenty years. Thunder shook the lighthouse walls. Waves leapt over the rocks. And in the flashing lightning, Cleo saw something awful: a ship, lost in the dark, heading straight for the rocks.\n\nThe keeper had fallen asleep. The signal mirror had blown out.\n\nCleo trembled.\n\nThen she looked at the mirror. She looked at the storm. She looked at the ship.\n\nAnd before she knew what she was doing — Cleo ran. Out into the rain. Onto the slippery rocks. She caught the fallen mirror in her teeth and dragged it to the highest point, turning it in the lightning's flash.\n\nSignal. Signal. Signal.\n\nThe ship turned. Just in time.\n\nThe storm passed. The sun rose. And the keeper, who never knew how close disaster had come, found Cleo curled up soaking wet and fast asleep — right next to the water's edge.\n\nShe never explained. She just purred.\n\nSometimes love makes us braver than we know. Goodnight, brave one. Goodnight.`,
    textAr: `في منارة مريحة على حافة البحر كانت تسكن قطة برتقالية صغيرة اسمها كليو.\n\nأحبت كليو المنارة. أحبت غرفة المصباح الدافئة. أحبت سترة الحارس الصوفية. أحبت رائحة البحر.\n\nلكن كليو كانت مرعوبة من الماء.\n\nفي كل مرة تتحطم فيها الأمواج على الصخور، كانت تتراجع إلى الزاوية الأعلى الأكثر جفافاً، عيونها واسعة، قلبها يدق بقوة.\n\n"قطة غبية" كانت النوارس تسخر. "خائفة من موجة صغيرة!"\n\nفي ليلة فظيعة، جاءت عاصفة — الأسوأ منذ عشرين عاماً. الرعد هز جدران المنارة. الأمواج قفزت فوق الصخور. وفي ضوء البرق الخاطف، رأت كليو شيئاً مروعاً: سفينة ضائعة في الظلام، تتجه مباشرة نحو الصخور.\n\nكان الحارس قد نام. مرآة الإشارة انطفأت.\n\nارتجفت كليو.\n\nثم نظرت إلى المرآة. نظرت إلى العاصفة. نظرت إلى السفينة.\n\nوقبل أن تعرف ما تفعله — ركضت كليو. إلى الخارج في المطر. على الصخور الزلقة. أمسكت المرآة الساقطة بأسنانها وجرتها إلى أعلى نقطة، وقلبتها في ضوء البرق.\n\nإشارة. إشارة. إشارة.\n\nدارت السفينة. في الوقت بالذات.\n\nمضت العاصفة. أشرقت الشمس. ووجد الحارس، الذي لم يعلم أبداً كم اقتربت الكارثة، كليو مجعدة ومبللة كلياً ونائمة بعمق — بجانب حافة الماء تماماً.\n\nلم تشرح أبداً. فقط أصدرت صوت خرخرة.\n\nأحياناً تجعلنا المحبة أكثر شجاعة مما نعرف. تصبح على خير أيها الشجاع. تصبح على خير.`,
  },
  {
    id: "sunset-boy",
    lang: "en",
    titleEn: "The Boy Who Collected Sunsets",
    titleAr: "الولد الذي جمع الغروب",
    durationMin: 7,
    ageRange: "6-10",
    cardEmoji: "🌅",
    cardBg: ["#7c2d12", "#ea580c"],
    tone: "slow, poetic, warm",
    scenes: [
      { emoji: "🌅", bg: ["#431407", "#7c2d12"], startSec: 0 },
      { emoji: "🎨", bg: ["#1c1917", "#292524"], startSec: 90 },
      { emoji: "😔", bg: ["#0c4a6e", "#0369a1"], startSec: 230 },
      { emoji: "✨", bg: ["#14532d", "#166534"], startSec: 380 },
    ],
    textEn: `Every evening, a boy named Theo climbed to the roof of his house with a sketchbook and colored pencils.\n\nAnd every evening, he drew the sunset.\n\nNot a photograph — a drawing. His hand, moving across the paper, trying to catch the exact moment when gold became orange became pink became the deepest violet before night.\n\n"It's a waste of time," said his uncle. "Sunsets are free. Draw something that matters."\n\n"You can just take a photo," said his friends.\n\nBut Theo kept climbing to the roof. Pages filled: Summer sunsets, winter sunsets, rainy sunsets where the clouds turned the sky into a painting of fire.\n\nYears passed.\n\nOne day, an old woman visited his town — a famous artist from the city. She was walking past when she saw Theo's sketchbook lying open on a park bench.\n\nShe stopped.\n\nShe sat down.\n\nShe looked for a very long time.\n\nWhen Theo came back, she looked up at him with bright, amazed eyes.\n\n"Where did you learn to do this?" she asked.\n\n"I just draw what I see," he said.\n\nShe shook her head slowly. "No. Any camera can capture what the eye sees. You captured what the HEART feels." She closed the book gently. "That is the rarest art in the world."\n\nThat night, Theo drew the most beautiful sunset of his life.\n\nNot because it was special. Because he finally understood that it always had been.\n\nGoodnight. Keep drawing what your heart sees. Goodnight.`,
    textAr: `كل مساء، كان فتى اسمه ثيو يتسلق إلى سطح منزله بكتاب رسومات وأقلام تلوين.\n\nوكل مساء، كان يرسم الغروب.\n\nليس صورة — بل رسمة. يده تتحرك عبر الورق، تحاول إمساك اللحظة الدقيقة حين يتحول الذهب إلى برتقالي يتحول إلى وردي يتحول إلى أعمق بنفسجي قبل الليل.\n\n"إنه مضيعة للوقت" قال عمه. "الغروب مجاني. ارسم شيئاً يستحق."\n\n"يمكنك أخذ صورة فقط" قال أصدقاؤه.\n\nلكن ثيو استمر في تسلق السطح. امتلأت الصفحات: غروبات صيفية، غروبات شتوية، غروبات ممطرة حيث حولت السحب السماء إلى لوحة من النار.\n\nمضت سنوات.\n\nيوماً ما، زارت بلدته امرأة عجوز — فنانة مشهورة من المدينة. كانت تمشي عابرة حين رأت كتاب رسومات ثيو ملقى مفتوحاً على مقعد حديقة.\n\nتوقفت.\n\nجلست.\n\nتأملت لوقت طويل جداً.\n\nحين عاد ثيو، نظرت إليه بعيون مضيئة مندهشة.\n\n"أين تعلمت هذا؟" سألت.\n\n"أنا فقط أرسم ما أراه" قال.\n\nهزت رأسها ببطء. "لا. أي كاميرا تستطيع التقاط ما تراه العين. أنت التقطت ما يشعر به القلب." أغلقت الكتاب برفق. "هذا هو أندر فن في العالم."\n\nتلك الليلة، رسم ثيو أجمل غروب في حياته.\n\nليس لأنه كان استثنائياً. بل لأنه فهم أخيراً أنه كان كذلك دائماً.\n\nتصبح على خير. استمر في رسم ما يراه قلبك. تصبح على خير.`,
  },
  {
    id: "lonely-giant",
    lang: "en",
    titleEn: "The Giant Who Was Lonely",
    titleAr: "العملاق الوحيد",
    durationMin: 6,
    ageRange: "4-8",
    cardEmoji: "🏔️",
    cardBg: ["#1e3a5f", "#1e40af"],
    tone: "tender, emotional",
    scenes: [
      { emoji: "🏔️", bg: ["#1c1917", "#292524"], startSec: 0 },
      { emoji: "👧", bg: ["#14532d", "#166534"], startSec: 80 },
      { emoji: "🤝", bg: ["#451a03", "#78350f"], startSec: 200 },
      { emoji: "🏘️", bg: ["#0f172a", "#1e293b"], startSec: 320 },
    ],
    textEn: `Beyond the village of Millbrook, in the shadow of the great mountain, lived a giant named Goro.\n\nEveryone in the village was afraid of Goro. When they saw his shadow fall across their fields, they shut their doors and windows. Children were told not to go near the mountain.\n\nBut Goro had never hurt anyone. He was just… big. And very, very lonely.\n\nEvery evening he sat on the mountain top and watched the warm lights of the village below, wishing he could be part of it.\n\nOne morning, a little girl named Mia wandered too far while chasing butterflies. She looked up and there was Goro — enormous, shaggy, and very sad looking.\n\nMia was a little scared. But she thought: he looks sad. And scared people don't like it when you run away from them.\n\nSo instead of running, she waved.\n\nGoro was so surprised, he sat down with a thud that shook the mountain.\n\nThe next morning, she waved again.\n\nAnd the morning after that.\n\nSlowly, very slowly, Goro started walking a little closer to the village. And Mia started walking a little closer to the mountain.\n\nUntil one day, they sat together in the meadow — a little girl and a giant — watching the clouds, not saying anything at all. Just being together.\n\nThe village saw. And slowly, they understood: what they had feared was just a very large, very gentle being who had wanted nothing but a friend.\n\nAnd the loneliest giant in the world finally wasn't lonely anymore.\n\nGoodnight. The things we fear most sometimes just need a wave. Goodnight.`,
    textAr: `وراء قرية ميلبروك، في ظل الجبل الكبير، كان يسكن عملاق اسمه غورو.\n\nكان أهل القرية كلهم خائفين من غورو. حين كانوا يرون ظله يسقط على حقولهم، يغلقون أبوابهم ونوافذهم. قيل للأطفال ألا يقتربوا من الجبل.\n\nلكن غورو لم يؤذِ أحداً قط. كان فقط… كبيراً. ووحيداً جداً، جداً.\n\nكل مساء كان يجلس على قمة الجبل ويراقب الأضواء الدافئة للقرية من تحته، متمنياً أن يكون جزءاً منها.\n\nفي إحدى الصباحات، ابتعدت فتاة صغيرة اسمها ميا كثيراً وهي تلاحق الفراشات. نظرت لأعلى وكان غورو هناك — ضخم، متشعث الشعر، ومبدو حزيناً جداً.\n\nخافت ميا قليلاً. لكنها فكرت: يبدو حزيناً. والخائفون لا يحبون حين تهرب منهم.\n\nلذا بدلاً من الركض، رفعت يدها ولوحت.\n\nفاجأ غورو هذا كثيراً لدرجة أنه جلس بارتطام هز الجبل.\n\nفي الصباح التالي، لوحت مرة أخرى.\n\nوبعده أيضاً.\n\nببطء، ببطء شديد، بدأ غورو يمشي أقرب قليلاً من القرية. وبدأت ميا تمشي أقرب قليلاً من الجبل.\n\nحتى يوماً ما، جلسا معاً في المرج — فتاة صغيرة وعملاق — يراقبان السحاب، دون أن يقولا أي شيء على الإطلاق. فقط يكونان معاً.\n\nرأت القرية. وببطء، فهمت: ما كانوا يخشونه كان مجرد كائن كبير جداً لطيف جداً لم يكن يريد شيئاً سوى صديق.\n\nوأوحد عملاق في العالم أخيراً لم يعد وحيداً.\n\nتصبح على خير. الأشياء التي نخشاها أكثر أحياناً تحتاج فقط لتحية. تصبح على خير.`,
  },
  {
    id: "last-cookie",
    lang: "en",
    titleEn: "The Last Cookie",
    titleAr: "الكوكي الأخير",
    durationMin: 5,
    ageRange: "4-7",
    cardEmoji: "🍪",
    cardBg: ["#78350f", "#92400e"],
    tone: "playful and funny",
    scenes: [
      { emoji: "🍪", bg: ["#431407", "#7c2d12"], startSec: 0 },
      { emoji: "😈", bg: ["#1e1b4b", "#312e81"], startSec: 70 },
      { emoji: "😴", bg: ["#0f172a", "#1e293b"], startSec: 200 },
      { emoji: "😂", bg: ["#14532d", "#166534"], startSec: 270 },
    ],
    textEn: `On the kitchen counter sat one perfect cookie.\n\nChocolate chip. Golden brown. Slightly warm.\n\nBoth Sam and Jamie saw it at the same time.\n\nBoth of them wanted it. Very much.\n\n"It's mine," said Sam. "I saw it first."\n\n"It's mine," said Jamie. "I thought of it first."\n\nSo began the Great Cookie War.\n\nSam hid the cookie under a hat. Jamie found it.\n\nJamie hid it inside a sock. Sam found it.\n\nSam put it in the freezer. Jamie put it on top of the refrigerator. Sam taped a "DO NOT TOUCH" sign on it. Jamie made an even bigger sign: "SAM CANNOT READ."\n\nThis went on all day.\n\nBy evening, both children were EXHAUSTED. They had chased each other around the house fourteen times, negotiated six peace treaties, and cried twice.\n\nThey fell asleep on the living room floor, still arguing in their sleep.\n\n"It's mine…" Sam murmured.\n\n"No, mine…" Jamie sighed.\n\nIn the kitchen, their mother looked at the cookie. She looked at her sleeping children.\n\nShe picked up the cookie.\n\nShe ate it.\n\nIt was delicious.\n\nIn the morning, the children looked at the empty plate. Then they looked at each other.\n\nThen they laughed so hard they fell off their chairs.\n\nGoodnight. Sometimes the things we fight over end up eaten by somebody else entirely. Goodnight!`,
    textAr: `على رف المطبخ كانت تجلس كعكة واحدة كاملة.\n\nرقائق شوكولاتة. ذهبية البني. دافئة قليلاً.\n\nرأها سام وجيمي في نفس الوقت.\n\nكلاهما أراداها. بشدة.\n\n"إنها لي" قال سام. "رأيتها أولاً."\n\n"إنها لي" قال جيمي. "فكرت بها أولاً."\n\nهكذا بدأت حرب الكعكة العظيمة.\n\nأخفى سام الكعكة تحت قبعة. وجدها جيمي.\n\nأخفاها جيمي داخل جورب. وجدها سام.\n\nوضعها سام في الفريزر. وضعها جيمي فوق الثلاجة. لصق سام لافتة "لا تلمس". صنع جيمي لافتة أكبر: "سام لا يستطيع القراءة."\n\nاستمر هذا طول اليوم.\n\nفي المساء، كان الطفلان مُنهكَين تماماً. ركضا خلف بعضهما في البيت أربع عشرة مرة، تفاوضا على ست معاهدات سلام، وبكيا مرتين.\n\nناما على أرض غرفة الجلوس، لا يزالان يتجادلان وهما نائمان.\n\n"إنها لي…" همهم سام.\n\n"لا، لي…" تنهد جيمي.\n\nفي المطبخ، نظرت أمهما إلى الكعكة. نظرت إلى أطفالها النائمين.\n\nرفعت الكعكة.\n\nأكلتها.\n\nكانت لذيذة.\n\nفي الصباح، نظر الطفلان إلى الطبق الفارغ. ثم نظرا إلى بعضهما.\n\nثم ضحكا بشدة حتى سقطا عن كراسيهما.\n\nتصبح على خير. أحياناً الأشياء التي نتشاجر عليها ينتهي بها الحال مأكولة من شخص آخر تماماً. تصبح على خير!`,
  },
];
