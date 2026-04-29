/**
 * Admin routes — pre-generate lesson audio (6A) and story audio (6B)
 * POST /api/admin/generate-lesson-audio  → SSE stream
 * POST /api/admin/generate-stories       → SSE stream
 * GET  /api/admin/status                 → {lessonsAudioGenerated, storiesGenerated}
 *
 * Uses Google WaveNet TTS (same API as /tts route).
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { createHash } from "crypto";
import { supabase } from "../lib/supabase";
import { openaiChat } from "../lib/openai-chat";

const router: IRouter = Router();

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

// ── Voices ────────────────────────────────────────────────────────────────────
// "en" → Wavenet-F (female English kid-friendly), "ar" → Wavenet-A (female Arabic)
type LangCode = "en" | "ar";
const LESSON_LANG_EN: LangCode = "en";
const LESSON_LANG_AR: LangCode = "ar";
const STORY_LANG_EN: LangCode  = "en";

// Story voice params: Neural2-F for EN (warm, natural) | Wavenet-A for AR (warm, natural Arabic female)
const STORY_VOICE_EN = { languageCode: "en-US", name: "en-US-Neural2-F", ssmlGender: "FEMALE" as const };
const STORY_VOICE_AR = { languageCode: "ar-XA", name: "ar-XA-Wavenet-A", ssmlGender: "FEMALE" as const };

// ── Google WaveNet synthesis ──────────────────────────────────────────────────
function rateToSpeakingRate(rate: string): number {
  const m = rate.match(/([+-]?\d+(?:\.\d+)?)%/);
  if (!m) return 1.0;
  const pct = parseFloat(m[1]!);
  return Math.max(0.5, Math.min(4.0, 1.0 + pct / 100));
}

function pitchToSemitones(pitch: string): number {
  const m = pitch.match(/([+-]?\d+(?:\.\d+)?)st/);
  if (m) return parseFloat(m[1]!);
  return 0;
}

async function synthesizeWavenet(
  text: string,
  lang: LangCode,
  rate = "+0%",
  pitch = "+0Hz",
  timeoutMs = 20000,
): Promise<Buffer> {
  const apiKey = process.env["GOOGLE_TTS_API_KEY"];
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY not set");

  const female = true; // always female for lesson/story audio (warm, kid-friendly)
  const voiceParams = lang === "ar"
    ? { languageCode: "ar-XA", name: "ar-XA-Wavenet-A", ssmlGender: "FEMALE" as const }
    : { languageCode: "en-US", name: "en-US-Wavenet-F", ssmlGender: "FEMALE" as const };

  const speakingRate = rateToSpeakingRate(rate);
  const pitchVal = pitchToSemitones(pitch);

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: voiceParams,
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate,
          pitch: pitchVal,
        },
      }),
      signal: ctrl.signal,
    });
    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`WaveNet ${response.status}: ${err}`);
    }
    const data = await response.json() as { audioContent?: string };
    if (!data.audioContent) throw new Error("WaveNet: no audioContent");
    return Buffer.from(data.audioContent, "base64");
  } finally {
    clearTimeout(tid);
  }
}

// ── Number-to-words helpers ───────────────────────────────────────────────────
const EN_ONES = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const EN_TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

function numToEnWords(n: number): string {
  if (n < 20) return EN_ONES[n]!;
  if (n < 100) return EN_TENS[Math.floor(n / 10)]! + (n % 10 ? " " + EN_ONES[n % 10]! : "");
  return "one hundred";
}

const AR_ONES = ["صفر","واحد","اثنان","ثلاثة","أربعة","خمسة","ستة","سبعة","ثمانية","تسعة","عشرة","أحد عشر","اثنا عشر","ثلاثة عشر","أربعة عشر","خمسة عشر","ستة عشر","سبعة عشر","ثمانية عشر","تسعة عشر"];
const AR_TENS = ["","","عشرون","ثلاثون","أربعون","خمسون","ستون","سبعون","ثمانون","تسعون"];

function numToArWords(n: number): string {
  if (n < 20) return AR_ONES[n]!;
  if (n < 100) return AR_TENS[Math.floor(n / 10)]! + (n % 10 ? " و" + AR_ONES[n % 10]! : "");
  return "مئة";
}

// ── Lesson curriculum data ────────────────────────────────────────────────────
type WordItem = { lessonId: string; wordIndex: number; en: string; ar: string };

const LESSON_WORDS: WordItem[] = [
  // en-u1-l1 Colors
  { lessonId:"en-u1-l1", wordIndex:0, en:"Red", ar:"أحمر" },
  { lessonId:"en-u1-l1", wordIndex:1, en:"Blue", ar:"أزرق" },
  { lessonId:"en-u1-l1", wordIndex:2, en:"Green", ar:"أخضر" },
  { lessonId:"en-u1-l1", wordIndex:3, en:"Yellow", ar:"أصفر" },
  { lessonId:"en-u1-l1", wordIndex:4, en:"Purple", ar:"بنفسجي" },
  { lessonId:"en-u1-l1", wordIndex:5, en:"Orange", ar:"برتقالي" },
  { lessonId:"en-u1-l1", wordIndex:6, en:"Pink", ar:"وردي" },
  { lessonId:"en-u1-l1", wordIndex:7, en:"White", ar:"أبيض" },
  { lessonId:"en-u1-l1", wordIndex:8, en:"Black", ar:"أسود" },
  // en-u1-l2 Numbers
  { lessonId:"en-u1-l2", wordIndex:0, en:"One", ar:"واحد" },
  { lessonId:"en-u1-l2", wordIndex:1, en:"Two", ar:"اثنان" },
  { lessonId:"en-u1-l2", wordIndex:2, en:"Three", ar:"ثلاثة" },
  { lessonId:"en-u1-l2", wordIndex:3, en:"Four", ar:"أربعة" },
  { lessonId:"en-u1-l2", wordIndex:4, en:"Five", ar:"خمسة" },
  { lessonId:"en-u1-l2", wordIndex:5, en:"Six", ar:"ستة" },
  { lessonId:"en-u1-l2", wordIndex:6, en:"Seven", ar:"سبعة" },
  { lessonId:"en-u1-l2", wordIndex:7, en:"Eight", ar:"ثمانية" },
  { lessonId:"en-u1-l2", wordIndex:8, en:"Nine", ar:"تسعة" },
  { lessonId:"en-u1-l2", wordIndex:9, en:"Ten", ar:"عشرة" },
  // en-u1-l3 Animals
  { lessonId:"en-u1-l3", wordIndex:0, en:"Cat", ar:"قطة" },
  { lessonId:"en-u1-l3", wordIndex:1, en:"Dog", ar:"كلب" },
  { lessonId:"en-u1-l3", wordIndex:2, en:"Elephant", ar:"فيل" },
  { lessonId:"en-u1-l3", wordIndex:3, en:"Lion", ar:"أسد" },
  { lessonId:"en-u1-l3", wordIndex:4, en:"Bird", ar:"طائر" },
  { lessonId:"en-u1-l3", wordIndex:5, en:"Fish", ar:"سمكة" },
  { lessonId:"en-u1-l3", wordIndex:6, en:"Rabbit", ar:"أرنب" },
  { lessonId:"en-u1-l3", wordIndex:7, en:"Horse", ar:"حصان" },
  // en-u1-l4 My Body
  { lessonId:"en-u1-l4", wordIndex:0, en:"Head", ar:"رأس" },
  { lessonId:"en-u1-l4", wordIndex:1, en:"Eyes", ar:"عيون" },
  { lessonId:"en-u1-l4", wordIndex:2, en:"Nose", ar:"أنف" },
  { lessonId:"en-u1-l4", wordIndex:3, en:"Mouth", ar:"فم" },
  { lessonId:"en-u1-l4", wordIndex:4, en:"Ears", ar:"أذنان" },
  { lessonId:"en-u1-l4", wordIndex:5, en:"Hands", ar:"يدان" },
  { lessonId:"en-u1-l4", wordIndex:6, en:"Feet", ar:"قدمان" },
  // en-u1-l5 Family
  { lessonId:"en-u1-l5", wordIndex:0, en:"Mom", ar:"ماما" },
  { lessonId:"en-u1-l5", wordIndex:1, en:"Dad", ar:"بابا" },
  { lessonId:"en-u1-l5", wordIndex:2, en:"Brother", ar:"أخ" },
  { lessonId:"en-u1-l5", wordIndex:3, en:"Sister", ar:"أخت" },
  { lessonId:"en-u1-l5", wordIndex:4, en:"Grandma", ar:"تيتا" },
  { lessonId:"en-u1-l5", wordIndex:5, en:"Grandpa", ar:"جدو" },
  // en-u2-l6 Morning Routine
  { lessonId:"en-u2-l6", wordIndex:0, en:"Wake up", ar:"أستيقظ" },
  { lessonId:"en-u2-l6", wordIndex:1, en:"Brush teeth", ar:"أنظف أسناني" },
  { lessonId:"en-u2-l6", wordIndex:2, en:"Breakfast", ar:"أتناول الفطور" },
  { lessonId:"en-u2-l6", wordIndex:3, en:"Go to school", ar:"أذهب للمدرسة" },
  // en-u2-l7 Food & Drinks
  { lessonId:"en-u2-l7", wordIndex:0, en:"Bread", ar:"خبز" },
  { lessonId:"en-u2-l7", wordIndex:1, en:"Milk", ar:"حليب" },
  { lessonId:"en-u2-l7", wordIndex:2, en:"Apple", ar:"تفاحة" },
  { lessonId:"en-u2-l7", wordIndex:3, en:"Rice", ar:"أرز" },
  { lessonId:"en-u2-l7", wordIndex:4, en:"Water", ar:"ماء" },
  { lessonId:"en-u2-l7", wordIndex:5, en:"Juice", ar:"عصير" },
  { lessonId:"en-u2-l7", wordIndex:6, en:"Egg", ar:"بيضة" },
  { lessonId:"en-u2-l7", wordIndex:7, en:"Cheese", ar:"جبنة" },
  // en-u2-l8 Places
  { lessonId:"en-u2-l8", wordIndex:0, en:"School", ar:"مدرسة" },
  { lessonId:"en-u2-l8", wordIndex:1, en:"Home", ar:"بيت" },
  { lessonId:"en-u2-l8", wordIndex:2, en:"Park", ar:"حديقة" },
  { lessonId:"en-u2-l8", wordIndex:3, en:"Hospital", ar:"مستشفى" },
  { lessonId:"en-u2-l8", wordIndex:4, en:"Market", ar:"سوق" },
  { lessonId:"en-u2-l8", wordIndex:5, en:"Mosque", ar:"مسجد" },
  // en-u2-l9 Feelings
  { lessonId:"en-u2-l9", wordIndex:0, en:"Happy", ar:"سعيد" },
  { lessonId:"en-u2-l9", wordIndex:1, en:"Sad", ar:"حزين" },
  { lessonId:"en-u2-l9", wordIndex:2, en:"Angry", ar:"غاضب" },
  { lessonId:"en-u2-l9", wordIndex:3, en:"Scared", ar:"خائف" },
  { lessonId:"en-u2-l9", wordIndex:4, en:"Excited", ar:"متحمس" },
  { lessonId:"en-u2-l9", wordIndex:5, en:"Tired", ar:"متعب" },
  { lessonId:"en-u2-l9", wordIndex:6, en:"Surprised", ar:"متفاجئ" },
  // en-u2-l10 Weather
  { lessonId:"en-u2-l10", wordIndex:0, en:"Sunny", ar:"مشمس" },
  { lessonId:"en-u2-l10", wordIndex:1, en:"Rainy", ar:"ممطر" },
  { lessonId:"en-u2-l10", wordIndex:2, en:"Cloudy", ar:"غائم" },
  { lessonId:"en-u2-l10", wordIndex:3, en:"Windy", ar:"عاصف" },
  { lessonId:"en-u2-l10", wordIndex:4, en:"Snowy", ar:"ثلجي" },
  { lessonId:"en-u2-l10", wordIndex:5, en:"Hot", ar:"حار" },
  { lessonId:"en-u2-l10", wordIndex:6, en:"Cold", ar:"بارد" },
  // en-u3-l11 Greetings
  { lessonId:"en-u3-l11", wordIndex:0, en:"Hello", ar:"مرحبا" },
  { lessonId:"en-u3-l11", wordIndex:1, en:"Good morning", ar:"صباح الخير" },
  { lessonId:"en-u3-l11", wordIndex:2, en:"Good night", ar:"تصبح على خير" },
  { lessonId:"en-u3-l11", wordIndex:3, en:"See you", ar:"إلى اللقاء" },
  { lessonId:"en-u3-l11", wordIndex:4, en:"Goodbye", ar:"وداعاً" },
  { lessonId:"en-u3-l11", wordIndex:5, en:"Nice to meet you", ar:"تشرفنا" },
  // en-u3-l12 Action Words
  { lessonId:"en-u3-l12", wordIndex:0, en:"Run", ar:"يركض" },
  { lessonId:"en-u3-l12", wordIndex:1, en:"Jump", ar:"يقفز" },
  { lessonId:"en-u3-l12", wordIndex:2, en:"Eat", ar:"يأكل" },
  { lessonId:"en-u3-l12", wordIndex:3, en:"Sleep", ar:"ينام" },
  { lessonId:"en-u3-l12", wordIndex:4, en:"Read", ar:"يقرأ" },
  { lessonId:"en-u3-l12", wordIndex:5, en:"Write", ar:"يكتب" },
  { lessonId:"en-u3-l12", wordIndex:6, en:"Play", ar:"يلعب" },
  { lessonId:"en-u3-l12", wordIndex:7, en:"Laugh", ar:"يضحك" },
  // ar-u1-l1 Letters Alif-Baa
  { lessonId:"ar-u1-l1", wordIndex:0, en:"Alif", ar:"أ" },
  { lessonId:"ar-u1-l1", wordIndex:1, en:"Baa", ar:"ب" },
  { lessonId:"ar-u1-l1", wordIndex:2, en:"Taa", ar:"ت" },
  { lessonId:"ar-u1-l1", wordIndex:3, en:"Thaa", ar:"ث" },
  // ar-u1-l2 Letters Jeem-Thal
  { lessonId:"ar-u1-l2", wordIndex:0, en:"Jeem", ar:"ج" },
  { lessonId:"ar-u1-l2", wordIndex:1, en:"Haa", ar:"ح" },
  { lessonId:"ar-u1-l2", wordIndex:2, en:"Khaa", ar:"خ" },
  { lessonId:"ar-u1-l2", wordIndex:3, en:"Daal", ar:"د" },
  { lessonId:"ar-u1-l2", wordIndex:4, en:"Thaal", ar:"ذ" },
  // ar-u1-l3 Letters Raa-Sheen
  { lessonId:"ar-u1-l3", wordIndex:0, en:"Raa", ar:"ر" },
  { lessonId:"ar-u1-l3", wordIndex:1, en:"Zay", ar:"ز" },
  { lessonId:"ar-u1-l3", wordIndex:2, en:"Seen", ar:"س" },
  { lessonId:"ar-u1-l3", wordIndex:3, en:"Sheen", ar:"ش" },
  // ar-u1-l4 Strong Letters
  { lessonId:"ar-u1-l4", wordIndex:0, en:"Saad", ar:"ص" },
  { lessonId:"ar-u1-l4", wordIndex:1, en:"Daad", ar:"ض" },
  { lessonId:"ar-u1-l4", wordIndex:2, en:"Taa heavy", ar:"ط" },
  { lessonId:"ar-u1-l4", wordIndex:3, en:"Zaa heavy", ar:"ظ" },
  // ar-u2-l5 Colors AR
  { lessonId:"ar-u2-l5", wordIndex:0, en:"Red", ar:"أحمر" },
  { lessonId:"ar-u2-l5", wordIndex:1, en:"Blue", ar:"أزرق" },
  { lessonId:"ar-u2-l5", wordIndex:2, en:"Green", ar:"أخضر" },
  { lessonId:"ar-u2-l5", wordIndex:3, en:"Yellow", ar:"أصفر" },
  { lessonId:"ar-u2-l5", wordIndex:4, en:"Purple", ar:"بنفسجي" },
  { lessonId:"ar-u2-l5", wordIndex:5, en:"Orange", ar:"برتقالي" },
  // ar-u2-l6 Numbers AR
  { lessonId:"ar-u2-l6", wordIndex:0, en:"One", ar:"واحد" },
  { lessonId:"ar-u2-l6", wordIndex:1, en:"Two", ar:"اثنان" },
  { lessonId:"ar-u2-l6", wordIndex:2, en:"Three", ar:"ثلاثة" },
  { lessonId:"ar-u2-l6", wordIndex:3, en:"Four", ar:"أربعة" },
  { lessonId:"ar-u2-l6", wordIndex:4, en:"Five", ar:"خمسة" },
  { lessonId:"ar-u2-l6", wordIndex:5, en:"Six", ar:"ستة" },
  { lessonId:"ar-u2-l6", wordIndex:6, en:"Seven", ar:"سبعة" },
  { lessonId:"ar-u2-l6", wordIndex:7, en:"Eight", ar:"ثمانية" },
  { lessonId:"ar-u2-l6", wordIndex:8, en:"Nine", ar:"تسعة" },
  { lessonId:"ar-u2-l6", wordIndex:9, en:"Ten", ar:"عشرة" },
  // ar-u2-l7 Animals AR
  { lessonId:"ar-u2-l7", wordIndex:0, en:"Lion", ar:"أسد" },
  { lessonId:"ar-u2-l7", wordIndex:1, en:"Cat", ar:"قطة" },
  { lessonId:"ar-u2-l7", wordIndex:2, en:"Dog", ar:"كلب" },
  { lessonId:"ar-u2-l7", wordIndex:3, en:"Elephant", ar:"فيل" },
  { lessonId:"ar-u2-l7", wordIndex:4, en:"Bird", ar:"طير" },
  { lessonId:"ar-u2-l7", wordIndex:5, en:"Fish", ar:"سمكة" },
  // ar-u2-l8 Body AR
  { lessonId:"ar-u2-l8", wordIndex:0, en:"Head", ar:"رأس" },
  { lessonId:"ar-u2-l8", wordIndex:1, en:"Eyes", ar:"عيون" },
  { lessonId:"ar-u2-l8", wordIndex:2, en:"Nose", ar:"أنف" },
  { lessonId:"ar-u2-l8", wordIndex:3, en:"Mouth", ar:"فم" },
  { lessonId:"ar-u2-l8", wordIndex:4, en:"Hands", ar:"يدان" },
  { lessonId:"ar-u2-l8", wordIndex:5, en:"Feet", ar:"قدمان" },
  // ar-u2-l9 Family AR
  { lessonId:"ar-u2-l9", wordIndex:0, en:"Mom", ar:"ماما" },
  { lessonId:"ar-u2-l9", wordIndex:1, en:"Dad", ar:"بابا" },
  { lessonId:"ar-u2-l9", wordIndex:2, en:"Brother", ar:"أخ" },
  { lessonId:"ar-u2-l9", wordIndex:3, en:"Sister", ar:"أخت" },
  { lessonId:"ar-u2-l9", wordIndex:4, en:"Grandma", ar:"تيتا" },
  { lessonId:"ar-u2-l9", wordIndex:5, en:"Grandpa", ar:"جدو" },
  // ar-u3-l10 Greetings AR
  { lessonId:"ar-u3-l10", wordIndex:0, en:"Salaam", ar:"السلام عليكم" },
  { lessonId:"ar-u3-l10", wordIndex:1, en:"Hello", ar:"مرحبا" },
  { lessonId:"ar-u3-l10", wordIndex:2, en:"Good morning", ar:"صباح الخير" },
  { lessonId:"ar-u3-l10", wordIndex:3, en:"Good evening", ar:"مساء الخير" },
  { lessonId:"ar-u3-l10", wordIndex:4, en:"How are you", ar:"كيفك" },
  { lessonId:"ar-u3-l10", wordIndex:5, en:"Good night", ar:"تصبح على خير" },
  // ar-u3-l11 School AR
  { lessonId:"ar-u3-l11", wordIndex:0, en:"Teacher", ar:"معلم" },
  { lessonId:"ar-u3-l11", wordIndex:1, en:"Classroom", ar:"صف" },
  { lessonId:"ar-u3-l11", wordIndex:2, en:"Book", ar:"كتاب" },
  { lessonId:"ar-u3-l11", wordIndex:3, en:"Pencil", ar:"قلم" },
  { lessonId:"ar-u3-l11", wordIndex:4, en:"Homework", ar:"واجب" },
  { lessonId:"ar-u3-l11", wordIndex:5, en:"Exam", ar:"امتحان" },
  { lessonId:"ar-u3-l11", wordIndex:6, en:"Friend", ar:"صديق" },
  // ar-u3-l12 Verbs AR
  { lessonId:"ar-u3-l12", wordIndex:0, en:"Run", ar:"يركض" },
  { lessonId:"ar-u3-l12", wordIndex:1, en:"Jump", ar:"يقفز" },
  { lessonId:"ar-u3-l12", wordIndex:2, en:"Eat", ar:"يأكل" },
  { lessonId:"ar-u3-l12", wordIndex:3, en:"Sleep", ar:"ينام" },
  { lessonId:"ar-u3-l12", wordIndex:4, en:"Read", ar:"يقرأ" },
  { lessonId:"ar-u3-l12", wordIndex:5, en:"Write", ar:"يكتب" },
  { lessonId:"ar-u3-l12", wordIndex:6, en:"Play", ar:"يلعب" },
  { lessonId:"ar-u3-l12", wordIndex:7, en:"Laugh", ar:"يضحك" },
];

// ── Story sentences ───────────────────────────────────────────────────────────
type StorySentence = { storyId: string; index: number; text: string; lang: LangCode; rate: string; pitch: string };

const STORY_SENTENCES: StorySentence[] = [
  // Story 1 — English: The Girl Who Never Stopped Trying
  ...([
    "Layla was eight years old, and she had one big dream: to make a light bulb glow using only a lemon from her grandmother's garden.",
    "Every afternoon after school, she spread her notebook on the kitchen table, lined up her copper clips and wires, and placed three lemons in a row.",
    "Her first experiment failed completely. The bulb stayed cold and dark no matter how many times she checked.",
    "She wrote in her notebook: Experiment one — did not work. The wire was too thin. Tomorrow I will try something thicker.",
    "Her second try failed. So did her third and her fourth.",
    "Her older brother came in and said: Give up, Layla. Lemons are for lemonade, not for science!",
    "Layla looked at her notes calmly and said: Thomas Edison failed more than a thousand times before he made the light bulb. I have only failed four times.",
    "On her seventh experiment, she pressed a copper coin and a zinc clip into the lemon, connected the wires very carefully, and held her breath.",
    "A tiny, soft golden light blinked on.",
    "Layla sat very still for a long moment — then laughed so loudly that her mother came running from the next room.",
    "Her mother held Layla's face gently and said: You did not succeed because you were clever. You succeeded because you refused to stop.",
    "That night, Layla wrote on the very last page of her notebook in the biggest letters she could: Every mistake is a step closer to your answer.",
    "She kept learning — about batteries, circuits, and solar energy. She won three science competitions.",
    "Many years later, Layla led a team of engineers who brought electricity to twelve villages in the desert, where children finally did their homework under electric light — and on her desk, she always kept that small lemon notebook to remind herself that great things never come easy, but everything worth doing is worth trying one more time.",
  ].map((text, index) => ({ storyId: "1", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 2 — English: The Boy Who Talked to Trees
  ...([
    "Idris was ten years old and had a habit that made his classmates laugh: he talked to trees.",
    "Every morning on his way to school, he stopped at the oldest oak in the neighborhood, placed his hand on its bark, and said: Good morning. Are you growing today?",
    "His friends thought it was silly. Trees cannot hear you, they said.",
    "But Idris had read that plants respond to sound and vibration, and he believed that listening — even to something that cannot speak back — was a form of respect.",
    "One spring, the city decided to cut down the old oak tree to widen the road.",
    "Idris felt something break inside him. That tree had stood in that spot for more than sixty years.",
    "He did not shout or cry. Instead, he went home and wrote a careful letter to the city council, full of facts about how trees clean the air, cool streets, and protect neighborhoods from floods.",
    "He collected forty-three signatures from neighbors and asked his teacher to help him present the letter at a local meeting.",
    "The council listened carefully. They decided to reroute the road and spare the tree.",
    "The old oak still stands today, with a small sign beside it that reads: Protected by the community.",
    "Idris's mother asked him: How did you know what to do?",
    "He said: I learned it from the tree. It stood there for sixty years, quietly giving shade and clean air to everyone, without ever asking for anything. I just tried to do the same.",
    "And that day, Idris understood something he would carry his whole life: the earth is always listening — and it is up to us to listen back.",
  ].map((text, index) => ({ storyId: "2", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 3 — English: Two Seeds in the Same Garden
  ...([
    "Maya and Rowan were neighbors and best friends, but they argued about one thing: whose garden vegetables grew better.",
    "Maya's family planted tomatoes, and Rowan's family planted cucumbers, and every summer both families competed to grow the most beautiful harvest.",
    "One summer, a long dry spell hit their neighborhood. The sun beat down without mercy, and the wells ran low.",
    "Maya's tomato plants began to wilt. Rowan's cucumber plants also struggled to survive.",
    "One afternoon, both children sat at the fence between their gardens, feeling defeated.",
    "Rowan said: My cucumbers need shade. The sun is burning them.",
    "Maya said: My tomatoes need more water. The soil dries out too fast.",
    "They looked at each other — and then, at exactly the same time, they both had the same idea.",
    "What if the cucumber vines climbed Maya's fence and gave shade to the tomatoes? And what if the tomato roots broke up the soil so water could reach the cucumbers more easily?",
    "They tried it together. They moved soil, repositioned plants, and shared what little water they had equally.",
    "By the end of summer, both gardens were the most productive they had ever been.",
    "Their parents stood looking at the harvest in amazement. Maya's mother said quietly: They did better together than we ever did apart.",
    "Maya and Rowan smiled at each other across the fence and understood what the garden had been showing them all along: when you help someone else grow, you always grow too.",
  ].map((text, index) => ({ storyId: "3", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 4 — English: The Star Keeper's Question
  ...([
    "Nora could not sleep. Every night she lay in bed staring at the ceiling, full of questions she could not stop thinking about.",
    "One night her father found her at the window with her face pressed against the glass, looking up at the sky.",
    "What are you looking at? he asked.",
    "The stars, she said. I want to know how far away they are. And whether there are people on them. And what is beyond the very last star.",
    "Her father sat beside her and said: Those are very good questions. Even the best scientists in the world have not answered all of them yet.",
    "Nora frowned and said: But scientists know so many things already. Like that light takes eight minutes to travel from the sun to Earth. And that the universe is fourteen billion years old.",
    "Yes, said her father. And all of that started with someone exactly like you, sitting in the dark, looking up, and asking: I wonder why. I wonder how.",
    "Nora thought about that for a long, quiet moment.",
    "Then she asked: So my questions are not silly?",
    "Her father said gently: Your questions are exactly the right size. Questions are the beginning of every great discovery.",
    "That night, Nora started a notebook. On the first page she wrote: Things I want to understand. And she filled the first page completely before she fell asleep.",
    "She grew up to become a scientist who studied distant galaxies. On her first published paper, she wrote in the dedication: To every child who ever stared at the sky and wondered.",
    "And every single night before sleep, she still asked one more question — because she knew that was exactly where everything important begins.",
  ].map((text, index) => ({ storyId: "4", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 5 — English: The Last Bee
  ...([
    "One warm spring morning, Amira noticed that the apple tree in her grandfather's orchard had not bloomed for two years in a row.",
    "Her grandfather said with a sad voice: There are no more bees here, Amira. Without bees, the flowers cannot become fruit.",
    "Where did they go? she asked.",
    "He sighed. When people use too many chemicals, when wildflowers disappear, when there is no safe place left for bees to nest — they leave. Or they die.",
    "Amira stood very still, thinking. Then she said quietly: We have to bring them back.",
    "She went to the library and researched what bees need: wildflowers, clean water, and small patches of bare earth to nest in. No chemicals. Just nature.",
    "She asked her grandfather to let her plant one corner of the orchard with lavender, clover, and sunflowers. He agreed.",
    "She also built two small bee hotels from bamboo sticks and pinecones, exactly the way a library book had shown her.",
    "She watered the flowers carefully every day through a dry spring and a long, hot summer.",
    "In late summer, the first bee arrived. Then three more. Then a small colony discovered the corner of the orchard and decided to stay.",
    "The following spring, for the first time in two years, the apple tree burst into white blossoms, beautiful and full.",
    "Her grandfather stood under the blossoming tree with tears in his eyes. You brought it back, he said softly.",
    "Amira watched the bees moving busily from flower to flower and understood something she would never forget: every living creature holds the world together — and every single one deserves a place to belong.",
  ].map((text, index) => ({ storyId: "5", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 6 — English: The Boy Who Never Stopped
  ...([
    "Yusuf was eight years old and loved inventing things from old wood and broken wires.",
    "His biggest dream was to build a small fan that worked without electricity.",
    "Every day after school, he sat in the garden with a box of materials: wood pieces, spools of thread, and empty bottles.",
    "The first attempt failed. So did the second. And the third. And the fourth.",
    "His friends told him once: This is impossible, Yusuf. Just give up!",
    "But Yusuf smiled and said: Every time I fail, I learn something new that I did not know before.",
    "On his ninth attempt, he changed the shape of the blades and added a small weight in the center.",
    "When he held it up and released it into the air, it spun slowly — then faster — then flew!",
    "Yusuf shouted with joy so loudly that the neighbors heard, and his father ran into the garden to see what had happened.",
    "His father said proudly: You did not succeed on the first try. You succeeded on the ninth. That is the real value of patience.",
    "That night, Yusuf wrote in his notebook in the biggest letters he could: Patience opens every locked door.",
    "When he grew up, he became an engineer who invented things that helped thousands of children in his country.",
    "And every invention in his life started the same way: an idea, a failure, and a return to try again.",
  ].map((text, index) => ({ storyId: "6", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 7 — English: The Seed of Hope
  ...([
    "On a very hot day, Sara found a tiny seed in the heart of a dry and barren patch of land.",
    "Her older sister said: This ground is dead, Sara. Nothing will grow here.",
    "But Sara carefully carried the seed and planted it with her small hands near an old stream.",
    "Every morning, before school, she brought a cup of water and quietly gave the seed a drink.",
    "Three full weeks passed with no sign of growth.",
    "Sara cried for just one day — then said: Maybe the seed just needs more time.",
    "In the fourth week, something small and green pushed gently through the soil.",
    "Each day it grew more, until it became a small bush casting a gentle shadow over the ground.",
    "The birds came first. Then the butterflies. Then the children, sitting in its shade.",
    "Her older sister said in amazement: I was completely wrong, Sara.",
    "Sara smiled and said: The ground was not dead. It was just waiting for someone who believed in it.",
    "And Sara learned that day a lesson she never forgot:",
    "Every great thing in this world began as something very small — and a heart that refuses to give up.",
  ].map((text, index) => ({ storyId: "7", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 8 — English: The Village Without Rain
  ...([
    "For three summers in a row, no rain fell on the small mountain village of Briar.",
    "The well ran dry. The gardens turned to dust. And the people grew worried and quiet.",
    "A young girl named Elara decided she would not wait for rain. She would find water.",
    "She climbed the rocky hills every day for a week, following the path of dry river beds and cracked earth.",
    "High up in the hills, behind a wall of stone, she discovered a hidden spring — cold, clear, and full.",
    "But the spring was too far for the villagers to carry water every day.",
    "Elara thought carefully. She built a small channel from stones and clay — just a tiny one, barely as wide as her hand.",
    "She worked every morning for two weeks, adding stones, sealing gaps, guiding the water down the hillside.",
    "The first trickle reached the village on a Tuesday afternoon.",
    "By the end of the week, a steady stream flowed into the dry well, and it began slowly to fill.",
    "The villagers gathered around in silence — and then erupted in cheering so loud the birds flew from the trees.",
    "The elder held Elara's hands and asked: How did you do this?",
    "She said simply: I did not do it alone. The hill had the spring. The stones made the path. I just believed the water wanted to reach us.",
    "And that year, the gardens of Briar bloomed more beautifully than anyone could remember.",
  ].map((text, index) => ({ storyId: "8", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 9 — English: The Library That No One Used
  ...([
    "At the end of a small street stood a library that no one visited anymore.",
    "The shelves were full of books. The lights still worked. But the chairs were always empty.",
    "A boy named Finn walked past it every day and always looked away — books seemed boring and old.",
    "One rainy afternoon, with nowhere else to go, he pushed open the heavy door and stepped inside.",
    "The librarian looked up from behind a tall stack of books and said: Welcome. What do you love?",
    "Finn shrugged. Nothing, he said.",
    "The librarian was quiet for a moment. Then she walked across the room and placed a single book in his hands.",
    "This one, she said. Just read the first page.",
    "Finn read the first page. Then the second. Then he sat down without noticing he was sitting.",
    "Two hours later, he was still reading — in a story about a boy who discovered a secret island full of animals that could speak.",
    "When he finally looked up, the rain had stopped, the sun was low, and the library was about to close.",
    "He borrowed the book and came back the next day — and the day after that.",
    "By the end of the year, Finn had read thirty-one books. He started a reading club at his school.",
    "Twelve children joined. Then twenty-five. The library chairs were never empty again.",
    "Finn learned that a reader lives a hundred lives — and a person who never reads lives only one.",
  ].map((text, index) => ({ storyId: "9", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 10 — English: The Youngest Inventor
  ...([
    "At just nine years old, Zara decided she was going to invent something that would help people.",
    "She did not know what yet. She just knew she had to try.",
    "She started carrying a notebook everywhere — to school, to the park, to the dinner table.",
    "Whenever she saw a problem, she wrote it down. A broken streetlight. A slippery ramp at the library. A garden hose that kept kinking.",
    "Her list grew to fifty-three problems before she found the one that felt right.",
    "The problem: her grandmother's arthritis made it painful to open medicine bottles every morning.",
    "Zara spent four months designing a simple handle that could be attached to any bottle cap, making it easier to grip and turn.",
    "She used cardboard, then rubber, then a combination of both — testing and failing and adjusting every week.",
    "She entered her invention in the school science fair — the youngest participant by three years.",
    "The judges asked her: How did a nine-year-old come up with this?",
    "She said: My grandmother needed it. That was enough reason.",
    "Zara did not win first place. She won second. But she was already working on version two of her design before she got home.",
    "Her grandmother wore the handle every morning and said: You solved the hardest part of my day.",
    "And Zara understood at last what she had suspected all along: age is never a reason not to try.",
  ].map((text, index) => ({ storyId: "10", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
];

// ── Concurrency queue ─────────────────────────────────────────────────────────
async function runConcurrent<T>(items: T[], maxConcurrent: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: maxConcurrent }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) await fn(item).catch(() => {});
    }
  });
  await Promise.all(workers);
}

// ── Storage helpers ───────────────────────────────────────────────────────────
async function fileExists(bucket: string, path: string): Promise<boolean> {
  try {
    const { data } = await supabase.storage.from(bucket).list(path.split("/").slice(0, -1).join("/"), {
      search: path.split("/").pop(),
    });
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

async function uploadAudio(bucket: string, path: string, buffer: Buffer): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).upload(`${path}.mp3`, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    return !error;
  } catch {
    return false;
  }
}

async function generateAndStore(
  bucket: string,
  path: string,
  text: string,
  lang: LangCode,
  rate = "+0%",
  pitch = "+0Hz",
  skipIfExists = true,
): Promise<boolean> {
  if (skipIfExists) {
    const exists = await fileExists(bucket, `${path}.mp3`);
    if (exists) return true;
  }
  try {
    const buffer = await synthesizeWavenet(text, lang, rate, pitch, 20000);
    return await uploadAudio(bucket, path, buffer);
  } catch {
    return false;
  }
}

/**
 * High-quality story synthesis using Google Neural2 (EN) / WaveNet-A (AR).
 * Warm, calm, slow — ideal for bedtime storytelling. Completely non-robotic.
 */
async function synthesizeStoryGoogle(
  text: string,
  lang: "en" | "ar",
  timeoutMs = 22000,
): Promise<Buffer> {
  const apiKey = process.env["GOOGLE_TTS_API_KEY"];
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY not set");

  const voiceParams = lang === "ar" ? STORY_VOICE_AR : STORY_VOICE_EN;
  const speakingRate = lang === "ar" ? 0.9 : 0.88;   // natural storytelling pace
  const pitch        = 0.0;                           // neutral — no artificial pitch shift

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: voiceParams,
        audioConfig: { audioEncoding: "MP3", speakingRate, pitch },
      }),
      signal: ctrl.signal,
    });
    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`Story TTS ${response.status}: ${err}`);
    }
    const data = await response.json() as { audioContent?: string };
    if (!data.audioContent) throw new Error("Story TTS: no audioContent");
    return Buffer.from(data.audioContent, "base64");
  } finally {
    clearTimeout(tid);
  }
}

/** Store pre-generated story audio using Google Neural2 — runs once via admin panel */
async function generateAndStoreStory(
  path: string,
  text: string,
  lang: "en" | "ar",
  skipIfExists = true,
): Promise<boolean> {
  if (skipIfExists) {
    const exists = await fileExists("stories-audio", `${path}.mp3`);
    if (exists) return true;
  }
  try {
    const buffer = await synthesizeStoryGoogle(text, lang);
    return await uploadAudio("stories-audio", path, buffer);
  } catch {
    return false;
  }
}

// ── Build lesson audio items ──────────────────────────────────────────────────
type AudioItem = { bucket: string; path: string; text: string; lang: LangCode; rate: string; pitch: string; label: string };

function buildLessonItems(): AudioItem[] {
  const items: AudioItem[] = [];
  for (const w of LESSON_WORDS) {
    const isAr = w.lessonId.startsWith("ar-");

    items.push({
      bucket: "lessons-audio",
      path: `lesson/${w.lessonId}/${w.wordIndex}/pronunciation-en`,
      text: w.en, lang: LESSON_LANG_EN, rate: "-10%", pitch: "+0Hz",
      label: `${w.lessonId} word ${w.wordIndex} pronunciation EN`,
    });
    items.push({
      bucket: "lessons-audio",
      path: `lesson/${w.lessonId}/${w.wordIndex}/pronunciation-ar`,
      text: w.ar, lang: LESSON_LANG_AR, rate: "-10%", pitch: "+0Hz",
      label: `${w.lessonId} word ${w.wordIndex} pronunciation AR`,
    });
    items.push({
      bucket: "lessons-audio",
      path: `lesson/${w.lessonId}/${w.wordIndex}/hint-en`,
      text: `Can you find ${w.en}? Look carefully!`,
      lang: LESSON_LANG_EN, rate: "-10%", pitch: "+0Hz",
      label: `${w.lessonId} word ${w.wordIndex} hint EN`,
    });
    items.push({
      bucket: "lessons-audio",
      path: `lesson/${w.lessonId}/${w.wordIndex}/hint-ar`,
      text: `هل يمكنك إيجاد ${w.ar}؟ انظر بتأنٍّ!`,
      lang: LESSON_LANG_AR, rate: "-10%", pitch: "+0Hz",
      label: `${w.lessonId} word ${w.wordIndex} hint AR`,
    });
    items.push({
      bucket: "lessons-audio",
      path: `lesson/${w.lessonId}/${w.wordIndex}/reveal-en`,
      text: `Excellent! That is ${w.en}! Great job!`,
      lang: LESSON_LANG_EN, rate: "+0%", pitch: "+0Hz",
      label: `${w.lessonId} word ${w.wordIndex} reveal EN`,
    });
    items.push({
      bucket: "lessons-audio",
      path: `lesson/${w.lessonId}/${w.wordIndex}/reveal-ar`,
      text: `رائع! هذا هو ${w.ar}! أحسنت!`,
      lang: LESSON_LANG_AR, rate: "+0%", pitch: "+0Hz",
      label: `${w.lessonId} word ${w.wordIndex} reveal AR`,
    });
  }
  return items;
}

function buildGameItems(): AudioItem[] {
  const items: AudioItem[] = [];

  // Math Blast — numbers 0-100 (EN + AR)
  for (let n = 0; n <= 100; n++) {
    items.push({ bucket: "lessons-audio", path: `games/math/num-${n}-en`, text: numToEnWords(n), lang: LESSON_LANG_EN, rate: "-10%", pitch: "+0Hz", label: `math number ${n} EN` });
    items.push({ bucket: "lessons-audio", path: `games/math/num-${n}-ar`, text: numToArWords(n), lang: LESSON_LANG_AR, rate: "-10%", pitch: "+0Hz", label: `math number ${n} AR` });
  }

  // Math Blast — operators
  const ops = [
    { key: "plus",   en: "plus",       ar: "زائد" },
    { key: "minus",  en: "minus",      ar: "ناقص" },
    { key: "times",  en: "times",      ar: "ضرب" },
    { key: "div",    en: "divided by", ar: "قسمة" },
    { key: "equals", en: "equals",     ar: "يساوي" },
  ];
  for (const op of ops) {
    items.push({ bucket: "lessons-audio", path: `games/math/op-${op.key}-en`, text: op.en, lang: LESSON_LANG_EN, rate: "-10%", pitch: "+0Hz", label: `math op ${op.key} EN` });
    items.push({ bucket: "lessons-audio", path: `games/math/op-${op.key}-ar`, text: op.ar, lang: LESSON_LANG_AR, rate: "-10%", pitch: "+0Hz", label: `math op ${op.key} AR` });
  }

  // Math Blast — correct confirmations (5 variations)
  const mathCorrectEn = ["Correct! Well done!", "Excellent!", "Amazing! You got it!", "Perfect answer!", "Brilliant!"];
  const mathCorrectAr = ["صحيح! أحسنت!", "ممتاز!", "رائع! أصبت!", "إجابة مثالية!", "عبقري!"];
  for (let i = 0; i < 5; i++) {
    items.push({ bucket: "lessons-audio", path: `games/math/correct-${i}-en`, text: mathCorrectEn[i]!, lang: LESSON_LANG_EN, rate: "+0%", pitch: "+0Hz", label: `math correct ${i} EN` });
    items.push({ bucket: "lessons-audio", path: `games/math/correct-${i}-ar`, text: mathCorrectAr[i]!, lang: LESSON_LANG_AR, rate: "+0%", pitch: "+0Hz", label: `math correct ${i} AR` });
  }

  // Letter Match — celebration phrases (5 variations)
  const letterCelebEn = ["Excellent! You matched it!", "Amazing work!", "You are so smart!", "Perfect match!", "Keep going, you are doing great!"];
  const letterCelebAr = ["ممتاز! وجدت التطابق!", "عمل رائع!", "أنت ذكي جداً!", "تطابق مثالي!", "هيا، أنت رائع!"];
  for (let i = 0; i < 5; i++) {
    items.push({ bucket: "lessons-audio", path: `games/letter/celebrate-${i}-en`, text: letterCelebEn[i]!, lang: LESSON_LANG_EN, rate: "+0%", pitch: "+0Hz", label: `letter celebrate ${i} EN` });
    items.push({ bucket: "lessons-audio", path: `games/letter/celebrate-${i}-ar`, text: letterCelebAr[i]!, lang: LESSON_LANG_AR, rate: "+0%", pitch: "+0Hz", label: `letter celebrate ${i} AR` });
  }

  // Jigsaw — fun facts per puzzle
  const jigsawFacts = [
    { id: "solar", en: "Did you know Jupiter is SO big, one thousand three hundred Earths could fit inside it!", ar: "هل تعلم أن المشتري ضخم لدرجة أن ألف وثلاثمائة كرة أرضية تنحط جواه!" },
    { id: "world", en: "Earth is moving one hundred and seven thousand kilometers per hour around the sun right now!", ar: "الأرض تتحرك مئة وسبعة آلاف كيلومتر في الساعة حول الشمس الآن!" },
    { id: "abc",   en: "There are twenty six English letters and twenty eight Arabic letters. You know them all!", ar: "في ستة وعشرون حرفاً إنجليزياً وثمانية وعشرون حرفاً عربياً! أنت تعرفها!" },
    { id: "ocean", en: "The ocean covers seventy one percent of the Earth's surface. It is huge!", ar: "المحيطات تغطي واحد وسبعين بالمئة من سطح الأرض. إنها ضخمة!" },
    { id: "jungle",en: "There are more species of animals in a jungle than anywhere else on Earth!", ar: "الغابة الاستوائية فيها أكثر أنواع حيوانات من أي مكان آخر على الأرض!" },
    { id: "space", en: "It takes eight minutes for sunlight to travel from the sun all the way to Earth!", ar: "يستغرق ضوء الشمس ثماني دقائق ليصل من الشمس إلى الأرض!" },
  ];
  for (const jf of jigsawFacts) {
    items.push({ bucket: "lessons-audio", path: `games/jigsaw/${jf.id}-en`, text: jf.en, lang: LESSON_LANG_EN, rate: "-10%", pitch: "+0Hz", label: `jigsaw ${jf.id} EN` });
    items.push({ bucket: "lessons-audio", path: `games/jigsaw/${jf.id}-ar`, text: jf.ar, lang: LESSON_LANG_AR, rate: "-10%", pitch: "+0Hz", label: `jigsaw ${jf.id} AR` });
  }

  return items;
}

// ── SSE helper ────────────────────────────────────────────────────────────────
function sseWrite(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Routes ────────────────────────────────────────────────────────────────────
router.get("/admin/status", async (_req, res) => {
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "lessons_audio_generated").maybeSingle();
    const { data: sd } = await supabase.from("app_settings").select("value").eq("key", "stories_generated").maybeSingle();
    return res.json({ lessonsAudioGenerated: data?.value === "true", storiesGenerated: sd?.value === "true" });
  } catch {
    return res.json({ lessonsAudioGenerated: false, storiesGenerated: false });
  }
});

router.post("/admin/generate-lesson-audio", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const lessonItems = buildLessonItems();
  const gameItems = buildGameItems();
  const allItems = [...lessonItems, ...gameItems];
  const total = allItems.length;
  let progress = 0;

  sseWrite(res, { progress: 0, total, message: `Starting generation of ${total} audio files...` });

  await runConcurrent(allItems, 3, async (item) => {
    await generateAndStore(item.bucket, item.path, item.text, item.lang, item.rate, item.pitch);
    progress++;
    if (progress % 10 === 0 || progress === total) {
      sseWrite(res, { progress, total, message: item.label, percent: Math.round((progress / total) * 100) });
    }
  });

  try {
    await supabase.from("app_settings").upsert({ key: "lessons_audio_generated", value: "true" }, { onConflict: "key" });
  } catch { /* best effort */ }

  sseWrite(res, { progress: total, total, done: true, message: "All lesson and game audio generated!" });
  res.end();
});

// ── PostgREST schema reload ───────────────────────────────────────────────────
// POST /api/admin/reload-schema
// Notifies PostgREST to reload its schema cache (needed after manual table creation).
router.post("/admin/reload-schema", async (_req, res) => {
  const { error } = await supabase.rpc("exec_sql", { sql: "SELECT pg_notify('pgrst', 'reload schema')" });
  if (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      instructions:
        "exec_sql RPC not found. Run this manually in Supabase SQL Editor:\n" +
        "  SELECT pg_notify('pgrst', 'reload schema');\n" +
        "Then click 'Restart Server' in the Replit workflow panel.",
    });
    return;
  }
  // Give PostgREST 3 s to reload
  await new Promise<void>((r) => setTimeout(r, 3000));
  res.json({ ok: true, message: "Schema cache reloaded — caching is now active." });
});

// ── DB connectivity test ──────────────────────────────────────────────────────
// GET /api/admin/db-test
router.get("/admin/db-test", async (_req, res) => {
  const results: Record<string, { read: boolean; write: boolean; error?: string }> = {};

  for (const table of ["ai_cache", "curriculum_cache", "app_settings", "users"] as const) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1);
      results[table] = { read: !error, write: false, error: error?.message };
    } catch (e: any) {
      results[table] = { read: false, write: false, error: e.message };
    }
  }

  const allOk = Object.values(results).every(r => r.read);
  res.json({ ok: allOk, mode: "supabase-rest", tables: results });
});

router.post("/admin/generate-stories", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const total = STORY_SENTENCES.length;
  let progress = 0;

  sseWrite(res, { progress: 0, total, message: `Starting generation of ${total} story audio segments...` });

  await runConcurrent(STORY_SENTENCES, 2, async (sentence) => {
    const path = `story-${sentence.storyId}/sentence-${sentence.index}`;
    await generateAndStoreStory(path, sentence.text, sentence.lang as "en" | "ar", false); // always regenerate
    progress++;
    sseWrite(res, { progress, total, message: `Story ${sentence.storyId} sentence ${sentence.index}`, percent: Math.round((progress / total) * 100) });
  });

  try {
    await supabase.from("app_settings").upsert({ key: "stories_generated", value: "true" }, { onConflict: "key" });
  } catch { /* best effort */ }

  sseWrite(res, { progress: total, total, done: true, message: "All story audio generated!" });
  res.end();
});

// ── Chat cache pre-warming ────────────────────────────────────────────────────
// POST /api/admin/prewarm-chat
// Pre-populates ai_cache with common educational Q&A so OpenAI is never called
// for these high-frequency questions.
router.post("/admin/prewarm-chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function normText(t: string): string {
    return t.toLowerCase().replace(/[^\w\s\u0600-\u06ff]/g, " ").replace(/\s+/g, " ").trim();
  }
  function makeHash(normalizedInput: string, language: string, ageGroup: string, gender: string): string {
    return createHash("sha256").update(`${normalizedInput}:${language}:${ageGroup}:${gender}`).digest("hex");
  }

  const SYSTEM_EN = `You are a super fun learning hero for children. Your name is Adam. Teaching best friend who explains clearly and makes learning exciting. Simple words, short sentences, emojis. Address boy as 'champ', girl as 'champion'. Always respond in English.`;
  const SYSTEM_AR = `أنت بطل تعلّم خارق ممتع للأطفال. اسمك آدم. صديق معلّم يشرح بوضوح ويجعل التعلم ممتعاً. كلمات بسيطة، جمل قصيرة، إيموجي. خاطب الولد بـ'يا بطل' والبنت بـ'يا بطلة'. تكلّم العربية دائماً.`;

  type PrewarmItem = { question: string; language: "en"; ageGroup: string; gender: "boy" | "girl" };

  // ── MATH ──────────────────────────────────────────────────────────────────
  const EN_MATH = [
    "what is 2 times 2", "what is 3 times 4", "what is 4 times 5",
    "what is 6 times 7", "what is 7 times 8", "what is 8 times 9",
    "what is 9 times 9", "what is 11 times 11", "what is 12 times 12",
    "what is 6 times 6", "what is 5 times 8", "what is 7 times 6",
    "what is 9 times 4", "what is 3 times 12", "what is 8 times 11",
    "what is 15 plus 28", "what is 47 plus 53", "what is 123 plus 456",
    "what is 100 minus 47", "what is 200 minus 85", "what is 1000 minus 376",
    "what is 36 divided by 6", "what is 48 divided by 8", "what is 144 divided by 12",
    "what is 56 divided by 7", "what is 81 divided by 9",
    "what is a fraction", "what is a numerator", "what is a denominator",
    "what is one half of 20", "what is one quarter of 40", "what is three quarters of 100",
    "how do you add fractions with the same denominator",
    "what is 75 percent of 100", "what is 50 percent of 80", "what is 25 percent of 60",
    "what is a prime number", "what are the first ten prime numbers",
    "what is an even number", "what is an odd number",
    "what is the order of operations in math",
    "what is algebra", "what is a variable in math", "what is x in algebra",
    "how do you solve x plus 5 equals 12",
    "how do you solve 2 times x equals 16",
    "what is a square root", "what is the square root of 25",
    "what is the square root of 64", "what is the square root of 144",
    "what is a square number", "what are the first five square numbers",
    "what is the area of a rectangle", "what is the perimeter of a shape",
    "what is the area of a triangle", "how do you find the perimeter of a square",
    "what is pi", "what is the area of a circle", "what is a right angle",
    "what is an acute angle", "what is an obtuse angle",
    "what is a parallel line", "what is a perpendicular line", "what is symmetry",
    "what is a decimal", "how do you convert a fraction to a decimal",
    "what is rounding a number", "what is a negative number",
    "what is the difference between mean median and mode",
    "how do you calculate the average of numbers",
  ];

  // ── SPACE & ASTRONOMY ──────────────────────────────────────────────────────
  const EN_SPACE = [
    "how many planets are in the solar system",
    "what is the largest planet", "what is the smallest planet",
    "what is the closest planet to the sun", "what is the farthest planet from the sun",
    "what planet do we live on", "what is Mars",
    "what is Venus", "what is Saturn", "what is Jupiter",
    "what is the moon made of", "how far is the moon from Earth",
    "why does the moon change shape every night",
    "what is a star", "how does the sun make energy",
    "how big is the sun compared to Earth",
    "what is a galaxy", "what is the Milky Way",
    "what is a black hole", "can anything escape a black hole",
    "what is a meteor", "what is a comet", "what is an asteroid",
    "what is a satellite", "how do rockets work",
    "who was the first person to walk on the moon",
    "what is gravity", "why do planets orbit the sun",
    "why do stars twinkle at night", "what is a light year",
    "what is an astronaut", "what is the International Space Station",
    "how do astronauts eat in space", "how do astronauts sleep in space",
    "what is a constellation", "what is the North Star",
    "what is a solar eclipse", "what is a lunar eclipse",
    "what is the difference between a star and a planet",
    "is there life on other planets",
    "what is a nebula", "how are stars born",
  ];

  // ── OCEAN & SEA LIFE ──────────────────────────────────────────────────────
  const EN_OCEAN = [
    "what is the biggest animal in the ocean",
    "how do fish breathe underwater",
    "what is a coral reef and why is it important",
    "why is the ocean salty",
    "how deep is the deepest part of the ocean",
    "what is a tsunami", "how do tides work",
    "what causes ocean waves",
    "what is a shark", "are sharks dangerous to humans",
    "do dolphins sleep", "how do dolphins communicate",
    "what is a whale", "how long can a whale hold its breath",
    "what is a blue whale",
    "what is an octopus", "how many arms does an octopus have",
    "how many arms does a starfish have",
    "what is plankton and why is it important",
    "what lives in the deep sea", "what is a jellyfish",
    "how do sea turtles find their way home",
    "what is a seahorse", "do seahorses have babies",
    "why do whales jump out of the water",
    "what is a clownfish", "what is an angler fish",
    "what is bioluminescence in the ocean",
    "how do crabs walk", "what is a squid",
    "how do oceans affect the weather",
    "what is a food chain in the ocean",
    "why are oceans important for the planet",
    "what is ocean pollution and why is it bad",
  ];

  // ── PHYSICS ──────────────────────────────────────────────────────────────
  const EN_PHYSICS = [
    "what is light", "how fast does light travel",
    "what is sound", "how does sound travel",
    "why do we hear an echo", "what is the speed of sound",
    "what is electricity", "how does a light bulb work",
    "how does a magnet work", "what is a magnetic field",
    "what is force", "what is friction",
    "what is gravity and how does it work",
    "what is energy", "what is heat",
    "why does ice melt when it gets warm",
    "how does a mirror work", "what is reflection",
    "what is refraction of light",
    "what is a rainbow and how does it form",
    "why do we have day and night",
    "what is kinetic energy", "what is potential energy",
    "what is the difference between kinetic and potential energy",
    "what are Newton's three laws of motion",
    "what is inertia",
    "why do things fall to the ground",
    "what is pressure", "what is buoyancy",
    "why do things float in water",
    "what is temperature", "what is the difference between heat and temperature",
    "how does a thermometer work",
    "what are the states of matter",
    "what happens when you heat a solid",
    "what is evaporation", "what is condensation",
    "what is static electricity",
    "how does a battery work",
  ];

  // ── GENERAL SCIENCE ───────────────────────────────────────────────────────
  const EN_SCIENCE = [
    "what is photosynthesis", "how do plants make food",
    "why do leaves change color in autumn",
    "what are cells", "what is DNA",
    "how many bones are in the human body",
    "how does the heart work", "how does blood travel in the body",
    "how do we breathe", "what do our lungs do",
    "what does the brain do", "why do we sleep",
    "how do muscles work", "what is digestion",
    "how do eyes see", "why do we have two ears",
    "what is a volcano", "how does a volcano erupt",
    "how do earthquakes happen", "what is a fault line",
    "what is an atom", "what is a molecule",
    "what are elements", "what is the periodic table",
    "what is water made of",
    "what is the difference between a solid liquid and gas",
    "what is hibernation", "how do birds fly",
    "what is metamorphosis", "how does a caterpillar become a butterfly",
    "what is a food chain", "what is an ecosystem",
    "what is photosynthesis", "why is the rainforest important",
    "what causes thunder and lightning",
    "how do clouds form", "what is the water cycle",
    "what is climate change",
    "how do we measure temperature",
    "what is an experiment in science",
    "what is the scientific method",
    "what is a mammal", "what is a reptile",
    "what is an amphibian", "what is an insect",
    "how do bees make honey",
    "what is the largest animal on land",
    "why do animals have different colors",
    "what is camouflage in animals",
  ];

  // ── HISTORY & FAMOUS PEOPLE ───────────────────────────────────────────────
  const EN_HISTORY = [
    "who was Albert Einstein", "what did Albert Einstein discover",
    "who was Isaac Newton", "what did Isaac Newton discover",
    "who was Marie Curie", "what did Marie Curie discover",
    "who was Thomas Edison", "what did Thomas Edison invent",
    "who was Abraham Lincoln", "what is the American Civil War",
    "who was Leonardo da Vinci", "what did Leonardo da Vinci create",
    "who was Cleopatra", "who were the ancient Egyptians",
    "what are the pyramids of Egypt", "why did ancient Egyptians build pyramids",
    "who were the ancient Greeks", "what is ancient Greece famous for",
    "who was Alexander the Great",
    "what was the Roman Empire", "who were the Romans",
    "what caused World War One", "what caused World War Two",
    "who was Neil Armstrong", "who was the first person in space",
    "who was Martin Luther King Jr", "what is the civil rights movement",
    "who was Nelson Mandela",
    "what was the Renaissance",
    "who invented the telephone", "who invented the airplane",
    "what is the Industrial Revolution",
    "what was the moon landing",
    "who was Charles Darwin", "what is the theory of evolution",
    "what is the magna carta",
    "who was William Shakespeare",
    "what was ancient China famous for", "what is the Great Wall of China",
    "what was the Viking age", "who were the Vikings",
    "what was the Ottoman Empire",
    "who was Galileo Galilei",
  ];

  // ── GEOGRAPHY & WORLD ─────────────────────────────────────────────────────
  const EN_GEOGRAPHY = [
    "how many continents are there", "what are the seven continents",
    "what is the largest continent", "what is the smallest continent",
    "what is the largest country in the world", "what is the smallest country in the world",
    "what is the longest river in the world", "what is the deepest lake in the world",
    "what is the highest mountain in the world", "what is Mount Everest",
    "what is the Sahara Desert", "what is the Amazon rainforest",
    "what are the North and South Poles",
    "what is the Arctic", "what is the Antarctic",
    "what is the equator", "what are the tropics",
    "what is the capital of France", "what is the capital of the United States",
    "what is the capital of Australia", "what is the capital of China",
    "what is the capital of Brazil", "what is the capital of Japan",
    "what is the capital of the United Kingdom",
    "what are the Great Barrier Reef", "where is the Amazon river",
    "what ocean is the largest", "how many oceans are there",
    "what is the difference between a country and a continent",
    "what is a desert", "what is a rainforest", "what is a savanna",
    "what is the tundra", "what is a glacier",
    "how does a river form", "what causes a waterfall",
    "what is the difference between a mountain and a hill",
    "what is a volcano island",
  ];

  // ── ANIMALS & WILDLIFE ────────────────────────────────────────────────────
  const EN_ANIMALS = [
    "what is the fastest animal on land",
    "what is the tallest animal in the world",
    "what is the heaviest animal on land",
    "what do tigers eat", "where do tigers live",
    "what do elephants eat", "how long do elephants live",
    "how do penguins survive in the cold",
    "why do giraffes have long necks",
    "how do chameleons change color",
    "what do bears eat", "do bears really hibernate",
    "how do bats see in the dark", "what is echolocation",
    "why do dogs wag their tails",
    "how do cats purr", "why do cats sleep so much",
    "what is the difference between a frog and a toad",
    "how do snakes move without legs",
    "what is the largest bird in the world",
    "why do birds migrate", "how do birds know which way to fly",
    "what do cheetahs eat", "how fast can a cheetah run",
    "what is a carnivore", "what is an herbivore", "what is an omnivore",
    "how do spiders make webs",
    "what is a predator", "what is prey",
    "what is an endangered animal", "why do animals go extinct",
    "how do ants work together", "why do bees make honey",
    "what is a mammal", "what makes mammals special",
    "how do kangaroos carry their babies",
    "what is a marsupial",
  ];

  // ── TECHNOLOGY & COMPUTING ────────────────────────────────────────────────
  const EN_TECHNOLOGY = [
    "what is a computer", "how does a computer work",
    "what is the internet", "how does the internet work",
    "what is a website", "what is an app",
    "what is artificial intelligence", "what can AI do",
    "what is coding", "why is coding important",
    "what is a robot", "how do robots help people",
    "what is a smartphone", "how does a touchscreen work",
    "what is electricity used for in everyday life",
    "how does a television work", "how does a camera work",
    "what is satellite technology", "how do GPS systems work",
    "what is social media", "how do search engines work",
    "what is virtual reality", "what is augmented reality",
    "how does a microwave oven work",
    "what is renewable energy technology",
    "what is a solar panel", "how do wind turbines work",
    "what is a password and why is it important",
    "how do planes stay in the air",
    "how do electric cars work",
    "what is a 3D printer",
  ];

  // ── HUMAN BODY & HEALTH ───────────────────────────────────────────────────
  const EN_HEALTH = [
    "why do we need to sleep", "how much sleep do kids need",
    "why do we need to drink water", "how much water should we drink every day",
    "why is exercise important for kids", "how does exercise help the brain",
    "what are vitamins and why do we need them",
    "what does the immune system do", "how do vaccines work",
    "why do we get sick", "what are germs",
    "what is a virus", "what is bacteria",
    "why do we wash our hands", "how does soap kill germs",
    "what happens when we eat food", "how long does digestion take",
    "why do we need to eat vegetables", "why is sugar bad in large amounts",
    "what is the largest organ in the human body",
    "how do we grow taller", "what makes bones strong",
    "why do muscles get sore after exercise",
    "how does the skin protect us",
    "what are the five senses", "how does the sense of smell work",
    "why do we sneeze and cough",
    "what is the difference between arteries and veins",
    "how many teeth do humans have",
    "why do we have two eyes instead of one",
    "what is a calorie",
  ];

  // ── ENGLISH LANGUAGE ──────────────────────────────────────────────────────
  const EN_LANGUAGE = [
    "what is a noun", "what is a verb", "what is an adjective",
    "what is an adverb", "what is a pronoun", "what is a preposition",
    "what is a sentence", "what makes a complete sentence",
    "what is a paragraph", "what is punctuation",
    "what is a comma used for", "when do we use a full stop",
    "what is a question mark", "what is an exclamation mark",
    "what is the difference between a simile and a metaphor",
    "what is alliteration", "what is rhyme",
    "what is a synonym", "what is an antonym",
    "what is a homophone", "can you give me examples of homophones",
    "what is a compound word", "what is a prefix", "what is a suffix",
    "what is the past tense", "what is the present tense", "what is the future tense",
    "what is a conjunction", "what is an article in grammar",
    "what is a capital letter used for",
    "what is the difference between fiction and non-fiction",
    "what is a story plot", "what is a story character",
    "what is poetry", "what makes a good essay introduction",
  ];

  // ── ENVIRONMENT & PLANET EARTH ────────────────────────────────────────────
  const EN_ENVIRONMENT = [
    "what is climate change and how does it happen",
    "what is global warming", "why is global warming a problem",
    "what is the greenhouse effect",
    "why are rainforests important for the planet",
    "what is deforestation and why is it harmful",
    "what is recycling", "why should we recycle",
    "what is pollution", "what are the types of pollution",
    "what is air pollution and how does it affect us",
    "what is water pollution", "how does plastic harm the ocean",
    "what are fossil fuels", "why are fossil fuels a problem",
    "what is renewable energy", "what is solar energy",
    "what is wind energy", "what is hydroelectric energy",
    "what is a carbon footprint", "how can kids help the environment",
    "what is an endangered species", "why do animals go extinct",
    "what is a habitat", "what does it mean when a habitat is destroyed",
    "what is the ozone layer", "why is the ozone layer important",
    "what is acid rain", "what causes acid rain",
    "what is sustainable living",
    "how does planting trees help the environment",
  ];

  const EN_QUESTIONS = [
    ...EN_MATH, ...EN_SPACE, ...EN_OCEAN, ...EN_PHYSICS, ...EN_SCIENCE,
    ...EN_HISTORY, ...EN_GEOGRAPHY, ...EN_ANIMALS, ...EN_TECHNOLOGY,
    ...EN_HEALTH, ...EN_LANGUAGE, ...EN_ENVIRONMENT,
  ];

  const items: PrewarmItem[] = [];
  for (const q of EN_QUESTIONS) {
    for (const ageGroup of ["5-6", "7-9", "10-12", "13-15"]) {
      for (const gender of ["boy", "girl"] as const) {
        items.push({ question: q, language: "en", ageGroup, gender });
      }
    }
  }

  const total = items.length;
  let done = 0;
  let skipped = 0;
  let saved = 0;

  sseWrite(res, { progress: 0, total, message: `Pre-warming ${total} chat cache entries...` });

  await runConcurrent(items, 4, async (item) => {
    const norm = normText(item.question);
    const hash = makeHash(norm, item.language, item.ageGroup, item.gender);

    // Skip if already cached
    const { data: existing } = await supabase.from("ai_cache")
      .select("id").eq("input_hash", hash).eq("language", item.language).eq("gender", item.gender).maybeSingle();
    if (existing) { done++; skipped++; return; }

    try {
      const systemPrompt = `${SYSTEM_EN}\n\nAge group: ${item.ageGroup}. Adapt vocabulary and complexity to this age.`;

      const completion = await openaiChat.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: item.question },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });
      const reply = completion.choices[0]?.message?.content?.trim() ?? "";
      if (!reply) { done++; return; }

      await supabase.from("ai_cache").upsert(
        { input_hash: hash, input_text: item.question, response_text: reply, language: item.language, gender: item.gender, hit_count: 0 },
        { onConflict: "input_hash,language" }
      );
      saved++;
    } catch { /* skip on API error */ }

    done++;
    if (done % 10 === 0 || done === total) {
      sseWrite(res, { progress: done, total, saved, skipped, percent: Math.round((done / total) * 100), message: `Cached: ${saved} new, ${skipped} already exist` });
    }
  });

  sseWrite(res, { progress: total, total, done: true, saved, skipped, message: `Done! ${saved} new responses cached, ${skipped} already existed.` });
  res.end();
});

export default router;
