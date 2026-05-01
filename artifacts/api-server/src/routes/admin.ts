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
import { supabase } from "../lib/supabase.js";
import { openaiChat } from "../lib/openai-chat.js";
import { clearCacheByPrefix } from "./audio.js";
import { sendEmail, weeklyReportHtml } from "../lib/email.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// Explicit fetch response shape — avoids express.Response vs globalThis.Response ambiguity
interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

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
    }) as unknown as HttpResponse;
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
  // en-u4-l13 Space
  { lessonId:"en-u4-l13", wordIndex:0, en:"Planet", ar:"كوكب" },
  { lessonId:"en-u4-l13", wordIndex:1, en:"Star", ar:"نجمة" },
  { lessonId:"en-u4-l13", wordIndex:2, en:"Moon", ar:"قمر" },
  { lessonId:"en-u4-l13", wordIndex:3, en:"Sun", ar:"شمس" },
  { lessonId:"en-u4-l13", wordIndex:4, en:"Comet", ar:"مذنب" },
  { lessonId:"en-u4-l13", wordIndex:5, en:"Galaxy", ar:"مجرة" },
  { lessonId:"en-u4-l13", wordIndex:6, en:"Rocket", ar:"صاروخ" },
  { lessonId:"en-u4-l13", wordIndex:7, en:"Astronaut", ar:"رائد فضاء" },
  // en-u4-l14 Ocean Life
  { lessonId:"en-u4-l14", wordIndex:0, en:"Ocean", ar:"محيط" },
  { lessonId:"en-u4-l14", wordIndex:1, en:"Wave", ar:"موجة" },
  { lessonId:"en-u4-l14", wordIndex:2, en:"Coral", ar:"مرجان" },
  { lessonId:"en-u4-l14", wordIndex:3, en:"Shark", ar:"قرش" },
  { lessonId:"en-u4-l14", wordIndex:4, en:"Dolphin", ar:"دلفين" },
  { lessonId:"en-u4-l14", wordIndex:5, en:"Whale", ar:"حوت" },
  { lessonId:"en-u4-l14", wordIndex:6, en:"Shell", ar:"صدفة" },
  { lessonId:"en-u4-l14", wordIndex:7, en:"Current", ar:"تيار" },
  // en-u4-l15 Plants & Nature
  { lessonId:"en-u4-l15", wordIndex:0, en:"Tree", ar:"شجرة" },
  { lessonId:"en-u4-l15", wordIndex:1, en:"Flower", ar:"زهرة" },
  { lessonId:"en-u4-l15", wordIndex:2, en:"Root", ar:"جذر" },
  { lessonId:"en-u4-l15", wordIndex:3, en:"Leaf", ar:"ورقة" },
  { lessonId:"en-u4-l15", wordIndex:4, en:"Seed", ar:"بذرة" },
  { lessonId:"en-u4-l15", wordIndex:5, en:"Forest", ar:"غابة" },
  { lessonId:"en-u4-l15", wordIndex:6, en:"Soil", ar:"تربة" },
  { lessonId:"en-u4-l15", wordIndex:7, en:"Bush", ar:"شجيرة" },
  // en-u4-l16 Inside My Body
  { lessonId:"en-u4-l16", wordIndex:0, en:"Brain", ar:"دماغ" },
  { lessonId:"en-u4-l16", wordIndex:1, en:"Heart", ar:"قلب" },
  { lessonId:"en-u4-l16", wordIndex:2, en:"Lung", ar:"رئة" },
  { lessonId:"en-u4-l16", wordIndex:3, en:"Stomach", ar:"معدة" },
  { lessonId:"en-u4-l16", wordIndex:4, en:"Bone", ar:"عظمة" },
  { lessonId:"en-u4-l16", wordIndex:5, en:"Muscle", ar:"عضلة" },
  { lessonId:"en-u4-l16", wordIndex:6, en:"Blood", ar:"دم" },
  { lessonId:"en-u4-l16", wordIndex:7, en:"Skin", ar:"جلد" },
  // en-u4-l17 Seasons
  { lessonId:"en-u4-l17", wordIndex:0, en:"Spring", ar:"ربيع" },
  { lessonId:"en-u4-l17", wordIndex:1, en:"Summer", ar:"صيف" },
  { lessonId:"en-u4-l17", wordIndex:2, en:"Autumn", ar:"خريف" },
  { lessonId:"en-u4-l17", wordIndex:3, en:"Winter", ar:"شتاء" },
  { lessonId:"en-u4-l17", wordIndex:4, en:"Rain", ar:"مطر" },
  { lessonId:"en-u4-l17", wordIndex:5, en:"Snow", ar:"ثلج" },
  { lessonId:"en-u4-l17", wordIndex:6, en:"Sunshine", ar:"أشعة الشمس" },
  { lessonId:"en-u4-l17", wordIndex:7, en:"Thunder", ar:"رعد" },
  // en-u5-l18 Transportation
  { lessonId:"en-u5-l18", wordIndex:0, en:"Car", ar:"سيارة" },
  { lessonId:"en-u5-l18", wordIndex:1, en:"Bus", ar:"حافلة" },
  { lessonId:"en-u5-l18", wordIndex:2, en:"Train", ar:"قطار" },
  { lessonId:"en-u5-l18", wordIndex:3, en:"Plane", ar:"طيارة" },
  { lessonId:"en-u5-l18", wordIndex:4, en:"Boat", ar:"قارب" },
  { lessonId:"en-u5-l18", wordIndex:5, en:"Bicycle", ar:"دراجة" },
  { lessonId:"en-u5-l18", wordIndex:6, en:"Rocket", ar:"صاروخ" },
  { lessonId:"en-u5-l18", wordIndex:7, en:"Helicopter", ar:"طائرة مروحية" },
  // en-u5-l19 Jobs & Careers
  { lessonId:"en-u5-l19", wordIndex:0, en:"Doctor", ar:"طبيب" },
  { lessonId:"en-u5-l19", wordIndex:1, en:"Teacher", ar:"معلم" },
  { lessonId:"en-u5-l19", wordIndex:2, en:"Scientist", ar:"عالم" },
  { lessonId:"en-u5-l19", wordIndex:3, en:"Artist", ar:"فنان" },
  { lessonId:"en-u5-l19", wordIndex:4, en:"Engineer", ar:"مهندس" },
  { lessonId:"en-u5-l19", wordIndex:5, en:"Chef", ar:"طاهٍ" },
  { lessonId:"en-u5-l19", wordIndex:6, en:"Pilot", ar:"طيار" },
  { lessonId:"en-u5-l19", wordIndex:7, en:"Farmer", ar:"مزارع" },
  // en-u5-l20 Technology
  { lessonId:"en-u5-l20", wordIndex:0, en:"Computer", ar:"كمبيوتر" },
  { lessonId:"en-u5-l20", wordIndex:1, en:"Phone", ar:"هاتف" },
  { lessonId:"en-u5-l20", wordIndex:2, en:"Robot", ar:"روبوت" },
  { lessonId:"en-u5-l20", wordIndex:3, en:"Camera", ar:"كاميرا" },
  { lessonId:"en-u5-l20", wordIndex:4, en:"Battery", ar:"بطارية" },
  { lessonId:"en-u5-l20", wordIndex:5, en:"Internet", ar:"إنترنت" },
  { lessonId:"en-u5-l20", wordIndex:6, en:"Satellite", ar:"قمر صناعي" },
  { lessonId:"en-u5-l20", wordIndex:7, en:"Code", ar:"شيفرة" },
  // en-u5-l21 Sports & Hobbies
  { lessonId:"en-u5-l21", wordIndex:0, en:"Football", ar:"كرة القدم" },
  { lessonId:"en-u5-l21", wordIndex:1, en:"Swimming", ar:"سباحة" },
  { lessonId:"en-u5-l21", wordIndex:2, en:"Running", ar:"جري" },
  { lessonId:"en-u5-l21", wordIndex:3, en:"Drawing", ar:"رسم" },
  { lessonId:"en-u5-l21", wordIndex:4, en:"Reading", ar:"قراءة" },
  { lessonId:"en-u5-l21", wordIndex:5, en:"Cooking", ar:"طبخ" },
  { lessonId:"en-u5-l21", wordIndex:6, en:"Music", ar:"موسيقى" },
  { lessonId:"en-u5-l21", wordIndex:7, en:"Dance", ar:"رقص" },
  // en-u5-l22 Healthy Habits
  { lessonId:"en-u5-l22", wordIndex:0, en:"Exercise", ar:"تمرين" },
  { lessonId:"en-u5-l22", wordIndex:1, en:"Sleep", ar:"نوم" },
  { lessonId:"en-u5-l22", wordIndex:2, en:"Vegetables", ar:"خضروات" },
  { lessonId:"en-u5-l22", wordIndex:3, en:"Water", ar:"ماء" },
  { lessonId:"en-u5-l22", wordIndex:4, en:"Brushing teeth", ar:"تنظيف الأسنان" },
  { lessonId:"en-u5-l22", wordIndex:5, en:"Rest", ar:"راحة" },
  { lessonId:"en-u5-l22", wordIndex:6, en:"Smile", ar:"ابتسامة" },
  { lessonId:"en-u5-l22", wordIndex:7, en:"Sunshine", ar:"شمس" },
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
  // Story 11 — English: The Robot Who Learned to Cry
  ...([
    "Sana was ten years old and loved building things more than anything in the world.",
    "One summer, she built a small robot from an old tin box, two clock gears, and a blinking blue LED for an eye.",
    "She called him Nour, which means light, because he lit up whenever she walked into the room.",
    "Nour could not talk or walk, but he could beep — once for yes, twice for no — and Sana understood him perfectly.",
    "One afternoon, Sana's grandmother came to visit. She had been very ill, and she looked tired and thin.",
    "Nour's blue LED flickered three times in a slow, strange rhythm that Sana had never seen before.",
    "She watched him carefully. His light dimmed, then blinked again — slowly, like someone trying very hard not to cry.",
    "Sana sat on the floor beside him and said quietly: I know, Nour. I am sad too.",
    "She had programmed him to blink faster when something good happened and slower when something did not.",
    "But this was the first time she realized: the machine had learned to notice sadness from watching her.",
    "Her grandmother leaned down and touched the little robot gently. She said: He has your heart, Sana.",
    "Sana smiled through her own tears and understood something she would never forget: when you build with love, love finds a way to live in what you make.",
  ].map((text, index) => ({ storyId: "11", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 12 — English: The Compass That Never Lied
  ...([
    "Malik was nine years old when his grandfather gave him a small brass compass with a cracked glass face.",
    "It belonged to your great-great-grandfather, said his grandfather. He carried it across three deserts. It never lied.",
    "Malik looked at the needle. It always pointed north — steady and still, no matter how he turned the compass.",
    "One winter afternoon, Malik and his grandfather hiked into the hills behind their town and got turned around in the fog.",
    "His grandfather said: Look at the compass. Tell me which way is north.",
    "Malik squinted at the needle. North is that way, he said — pointing toward a path that looked like it went deeper into the hills.",
    "His grandfather looked worried. Are you sure? The road to town should be the other way.",
    "Malik looked again. He did not change his answer. I am sure. The compass says north, and our town is south of these hills.",
    "His grandfather nodded slowly. Then let us trust it.",
    "They walked south for twenty minutes — and there was the road, exactly where the compass had promised.",
    "Walking home in the warm lamplight, his grandfather said: The compass is like honesty. When everything around you is foggy and confusing, it always tells you exactly where you are.",
    "Malik held the compass tightly and understood: honesty is never the easy direction — but it is always the right one.",
  ].map((text, index) => ({ storyId: "12", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 13 — English: The Dragon Who Was Afraid of the Dark
  ...([
    "Everyone knew that dragons breathe fire — but what no one knew was that Ember, the smallest dragon on the mountain, was terrified of the dark.",
    "Every night when the other dragons put out their flames and slept, Ember kept his burning very low so the others thought he was just cold.",
    "One evening, a great storm came and blew out every flame on the mountain — including Ember's.",
    "He sat in the dark, trembling, wings wrapped tightly around himself.",
    "From somewhere nearby, a small voice said: Me too.",
    "Ember looked around. Beside him sat a fox kit, shaking just as hard.",
    "They stayed there together through the long storm — neither able to see much, both afraid, but neither quite as afraid as they had been alone.",
    "When the storm finally passed and the morning light came creeping in, Ember lit his flame again and warmed them both.",
    "The fox said: How did you do that? You were scared too.",
    "Ember said: I was scared. But you were scared too, and that made me feel brave enough to try.",
    "And from that night on, Ember understood something no one had ever taught him in dragon school: everyone has fears, and the bravest thing you can ever do is face them side by side with someone who feels the same.",
  ].map((text, index) => ({ storyId: "13", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 14 — English: The Boy Who Asked a Million Questions
  ...([
    "Omar asked questions the way other children breathed — constantly, without thinking, and impossible to stop.",
    "Why is the sky blue? Why do cats purr? What is inside a second? Where does a thought come from?",
    "His teachers answered the first hundred questions patiently.",
    "By question three hundred and forty-one, some of them began to look a little tired.",
    "But one teacher, who had white hair and ink-stained fingers, always smiled and said: That is the most important question you have asked yet.",
    "One day Omar asked: Why do bridges stay up?",
    "Together, he and the teacher spent an hour drawing arches and looking at photos of ancient Roman bridges still standing after two thousand years.",
    "Omar went home and built a small bridge from popsicle sticks. He tested it with a pile of books. It held seventeen.",
    "He wrote in his notebook: A bridge holds up because the weight is shared. Like a good team.",
    "The white-haired teacher found that notebook years later, when Omar had grown up and was designing real bridges for a living.",
    "She read the first page and smiled: curiosity is not a problem to be managed — it is an engine waiting for fuel.",
    "And Omar, who had asked a million questions, built things that would last a hundred years — each one beginning with the simplest question of all: Why?",
  ].map((text, index) => ({ storyId: "14", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 15 — English: The Painter Who Mixed Colors
  ...([
    "Lena lived in a town where everyone believed that the most beautiful color was white — pure, clean, and simple.",
    "Every wall in town was white. Every door, every fence, every flower pot — white.",
    "Lena was a painter who had been given one gift she did not ask for: she could see every color, more colors than most people even have names for.",
    "She did not show anyone what she painted, because she worried it was too much — too bright, too mixed, too different.",
    "One winter, a long storm left the town grey and heavy for seven days straight.",
    "On the eighth day, Lena could not stand it anymore. She went out with all her paints and started painting the wall of the empty bakery.",
    "She mixed purple into orange. She layered yellow over green. She drew spirals of blue beside warm rose.",
    "By evening, the whole wall was a garden of impossible, joyful colors.",
    "People gathered slowly. Some were unsure. Some gasped. A small boy pressed his hand flat against the wall and said: It feels warm.",
    "Lena smiled and told him the secret she had kept for years: every color you see here was made by mixing two colors that people once thought could not go together.",
    "And every single one became more beautiful because of it.",
  ].map((text, index) => ({ storyId: "15", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 16 — English: The Smallest Library
  ...([
    "Tariq lived on a street where the closest library was three bus rides away — which meant most children on his street never went.",
    "He had twenty-three books of his own and had read every single one of them at least twice.",
    "One afternoon, he put a wooden crate outside his front door with a handwritten sign: Take a book. Leave a book.",
    "No one took anything on the first day.",
    "On the second day, a girl named Rosa took a book about penguins and left one about volcanoes.",
    "By the end of the week, twelve books had moved in and twelve had moved out.",
    "By the end of the month, neighbors were leaving chairs outside. Then a rug. Then someone brought a lamp.",
    "By summer, it had become something between a library and a living room — open to everyone on the street, day or evening.",
    "A journalist came and took a photo. She asked Tariq: How did you build all this?",
    "He said honestly: I did not build it. I just left a crate outside my door.",
    "She shook her head and said: You started something. And starting is always the hardest part.",
    "Tariq looked at the shelves built by his neighbors from old wooden pallets and understood: when you share what you know, the world around you grows — and so do you.",
  ].map((text, index) => ({ storyId: "16", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 17 — English: One Step at a Time
  ...([
    "At the edge of Mira's village stood a mountain so tall that no one from her village had ever reached the top.",
    "People said it was too steep, too cold, too far.",
    "Mira was eleven years old, and she said simply: I am going to climb it.",
    "Her uncle laughed kindly. That mountain is too much for you, little one.",
    "Mira did not argue. She put on her boots and started walking.",
    "On the first day, she reached the forest at the base. That was enough for that day.",
    "On the second, she reached the first rocky slope. She sat, breathed the cool air, and came back down.",
    "Each day she went a little further. Each day the mountain gave her a little more.",
    "On the fourteenth day, she reached the very top.",
    "The view was everything she had imagined and more: her village, small and golden below her, the whole valley spread out like a painting.",
    "She sat at the summit and wrote three words in the thin frost with her finger: One step today.",
    "Then she stood up and began the long walk home — already planning what she would climb next.",
  ].map((text, index) => ({ storyId: "17", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 18 — English: The Echo in the Valley
  ...([
    "High in the mountains lived a boy named Casim, who had a strange habit that his family found amusing.",
    "Every morning, he walked to the edge of the valley and shouted something — and then stood very still to listen to the echo.",
    "On angry days, he shouted: The world is unfair! And it rolled back: unfair… unfair… unfair…",
    "On good days, he shouted: Today is going to be amazing! And it came back: amazing… amazing… amazing…",
    "One spring morning, his little sister followed him to the valley edge and asked: Why do you always shout things out here?",
    "Casim said: To remind myself that what I put out always comes back.",
    "She frowned. That is just how sound works.",
    "He smiled. Yes. And it is how people work too.",
    "She thought about that for a long, quiet time.",
    "That afternoon, she did something she had been putting off: she apologized to a friend she had argued with.",
    "When her friend smiled back warmly and said: I missed you, she understood exactly what her brother had meant — not the sound, but the feeling.",
    "Whatever you send out into the world, in one form or another, finds its way back to you.",
  ].map((text, index) => ({ storyId: "18", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 19 — English: The Scientist Who Failed for Forty Years
  ...([
    "Professor Anya had spent forty years trying to grow a rose that bloomed in winter.",
    "Every year she planted. Every year the frost came and the petals fell.",
    "Her students asked her once: Professor, why do you keep trying? You have failed every year for forty years.",
    "She said quietly: I have not failed forty times. I have discovered forty things that do not work. That is very different.",
    "In her forty-first year, she made one small change: she added a layer of volcanic mineral to the soil before the frost arrived.",
    "In January, on a morning so cold that ice covered every window, she walked into her greenhouse.",
    "One rose had bloomed — a single deep red flower, perfect and completely still.",
    "She stood looking at it for a long, quiet moment without moving.",
    "Her assistant came in and said breathlessly: Professor. You did it.",
    "She nodded slowly and said: We did it. The forty years of failure taught me everything I needed to know to finally get it right.",
    "She called the rose Winter's Answer — and it became one of the most studied flowers in the history of botany.",
    "And in every class she taught from that day forward, she began with the same sentence: Before you show me your successes, show me your beautiful failures.",
  ].map((text, index) => ({ storyId: "19", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
  // Story 20 — English: The Child Who Fixed the Clock
  ...([
    "Rena was twelve years old when her grandfather's old clock stopped working.",
    "She opened the back of it very carefully and found hundreds of tiny gears, springs, and pins — a whole world of moving pieces, all balanced and counting.",
    "She asked her grandfather: What does a clock actually do?",
    "He said: It measures the only thing that never comes back.",
    "Rena spent three weeks taking the clock apart, drawing every piece in a notebook, and slowly putting it back together.",
    "On the eighteenth day, she wound the spring — and the clock began to tick again.",
    "The sound of it filled the quiet room. Her grandfather pressed his hand gently to his heart.",
    "Rena asked him: What were you thinking just now?",
    "He said: About all the hours in that clock that I wasted being afraid, or angry, or waiting for things to be different. Time you cannot get back.",
    "Rena held the clock carefully and thought about all the things she still wanted to do, make, learn, and become.",
    "From that day on, she never let a good hour pass without purpose — not every hour had to be busy, but every hour was chosen.",
    "Because she had learned that time is the only clock that cannot be rewound.",
  ].map((text, index) => ({ storyId: "20", index, text, lang: STORY_LANG_EN, rate: "-18%", pitch: "-1st" }))),
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
  const { error } = await supabase.storage.from(bucket).upload(`${path}.mp3`, buffer, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (error) {
    logger.warn({ bucket, path, err: error.message }, "[admin] Supabase upload failed");
    return false;
  }
  return true;
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
    }) as unknown as HttpResponse;
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
  // Let errors propagate so the SSE caller can log and report them
  const buffer = await synthesizeStoryGoogle(text, lang);
  const ok = await uploadAudio("stories-audio", path, buffer);
  if (!ok) throw new Error(`Supabase upload failed for ${path}`);
  return true;
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

  // Clear server-side audio cache for all story paths so fresh audio is served
  clearCacheByPrefix("story-");

  const total = STORY_SENTENCES.length;
  let progress = 0;
  let succeeded = 0;
  let failed = 0;
  const failures: { path: string; error: string }[] = [];

  sseWrite(res, { progress: 0, total, message: `Starting generation of ${total} story audio segments...` });

  await runConcurrent(STORY_SENTENCES, 2, async (sentence) => {
    const path = `story-${sentence.storyId}/sentence-${sentence.index}`;
    try {
      await generateAndStoreStory(path, sentence.text, sentence.lang as "en" | "ar", false);
      succeeded++;
    } catch (e: any) {
      const errMsg = String(e?.message ?? e ?? "unknown error");
      failed++;
      failures.push({ path, error: errMsg });
      logger.warn({ path, err: errMsg }, "[admin] Story audio generation failed");
    }
    progress++;
    sseWrite(res, {
      progress,
      total,
      succeeded,
      failed,
      message: `[${progress}/${total}] story-${sentence.storyId}/sentence-${sentence.index}`,
      percent: Math.round((progress / total) * 100),
    });
  });

  try {
    if (succeeded > 0) {
      await supabase.from("app_settings").upsert({ key: "stories_generated", value: "true" }, { onConflict: "key" });
    }
  } catch { /* best effort */ }

  sseWrite(res, {
    progress: total,
    total,
    done: true,
    succeeded,
    failed,
    failures: failures.slice(0, 30),
    message: `Done! ✅ ${succeeded} succeeded  ❌ ${failed} failed`,
  });
  res.end();
});

// ── Storage + TTS diagnostics ─────────────────────────────────────────────────
// GET /api/admin/check-storage
router.get("/admin/check-storage", async (_req, res) => {
  const result: Record<string, unknown> = {};

  // Test Google TTS key with a minimal real synthesis
  try {
    const apiKey = process.env["GOOGLE_TTS_API_KEY"];
    if (!apiKey) {
      result["tts"] = { ok: false, error: "GOOGLE_TTS_API_KEY not set" };
    } else {
      const buf = await synthesizeWavenet("hello", "en", "+0%", "+0Hz", 8000);
      result["tts"] = { ok: buf.length > 100, bytes: buf.length };
    }
  } catch (e: any) {
    result["tts"] = { ok: false, error: String(e?.message ?? e) };
  }

  // Test each Supabase storage bucket
  for (const bucket of ["stories-audio", "lessons-audio"] as const) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list("", { limit: 5 });
      result[bucket] = {
        ok: !error,
        error: error?.message,
        fileCount: data?.length ?? 0,
        sample: data?.map((f) => f.name).slice(0, 3),
      };
    } catch (e: any) {
      result[bucket] = { ok: false, error: String(e?.message ?? e) };
    }
  }

  res.json(result);
});

// ── On-demand single story sentence generation ────────────────────────────────
// POST /api/admin/generate-story-sentence
// Used by the story reader when pre-generated audio is missing for a sentence.
router.post("/admin/generate-story-sentence", async (req, res) => {
  const { storyId, sentenceIndex, text, lang = "en" } = req.body as {
    storyId?: string;
    sentenceIndex?: number;
    text?: string;
    lang?: string;
  };
  if (!storyId || sentenceIndex == null || !text) {
    return res.status(400).json({ ok: false, error: "storyId, sentenceIndex, and text are required" });
  }

  const path = `story-${storyId}/sentence-${sentenceIndex}`;

  // Check Supabase first — might already be there from a previous generation run
  try {
    const { data: existing, error: dlErr } = await supabase.storage.from("stories-audio").download(`${path}.mp3`);
    if (!dlErr && existing) {
      const ab = await existing.arrayBuffer();
      const base64 = Buffer.from(ab).toString("base64");
      return res.json({ ok: true, audioBase64: base64, source: "cache" });
    }
  } catch { /* will generate */ }

  try {
    const buffer = await synthesizeStoryGoogle(text, lang as "en" | "ar");
    // Best-effort upload so next request hits the cache
    uploadAudio("stories-audio", path, buffer).catch((e: unknown) => {
      logger.warn({ path, err: String(e) }, "[admin] background upload failed");
    });
    const base64 = buffer.toString("base64");
    return res.json({ ok: true, audioBase64: base64, source: "generated" });
  } catch (e: any) {
    logger.warn({ path, err: String(e?.message ?? e) }, "[admin] generate-story-sentence failed");
    return res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
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
    // Tech curriculum expansion — AI, coding, cybersecurity, future tech
    "what is machine learning", "how does machine learning work",
    "what is a neural network", "what is deep learning",
    "what is an algorithm", "what is a programming language",
    "what is Python used for", "what is JavaScript used for",
    "what is a loop in coding", "what is an if-then statement in coding",
    "what is cybersecurity", "how do hackers steal information",
    "what makes a strong password", "what is two-factor authentication",
    "what is encryption", "what is phishing",
    "how does WiFi work", "how does GPS work in phones",
    "what is a self-driving car", "how do self-driving cars work",
    "what is LIDAR", "what is a sensor in technology",
    "what is big data", "how do companies use our data",
    "what is data privacy", "who owns my data online",
    "how does Google search work", "what is a web crawler",
    "what is an index in search engines", "what is PageRank",
    "how does YouTube recommend videos", "what is AI bias",
    "what is facial recognition", "how does face recognition work",
    "what is quantum computing", "how is quantum computing different from regular computing",
    "what is a qubit", "what is augmented reality used for",
    "what are brain-computer interfaces", "what is Neuralink",
    "how does AI help doctors", "can AI diagnose diseases",
    "what is AlphaFold", "how does AI find new medicines",
    "what is a surgical robot", "what is the da Vinci robot",
    "what is AI ethics", "can AI be biased",
    "what is the black box problem in AI", "what is explainable AI",
    "what is a data packet", "how does email work",
    "what is a router", "what is a server",
    "what is cloud computing", "what does cloud storage mean",
    "what is an operating system", "what is software",
    "what is hardware", "what is a processor",
    "what is RAM in a computer", "what is a hard drive",
    "how many bytes are in a megabyte", "what is a terabyte",
    "what is an API", "what is open source software",
    "what is a bug in coding", "what is debugging",
    "what is version control", "what is GitHub",
    "how do apps get made", "what does a software developer do",
    "what is UI design", "what is UX design",
    "what is a front-end developer", "what is a back-end developer",
    "how much do programmers earn", "is coding a good career",
    "what jobs involve artificial intelligence",
    "what is the future of technology",
    "what is a self-driving car level 2", "what is Tesla Autopilot",
    "how does autocorrect work", "how does voice recognition work",
    "what is Siri", "what is Google Assistant",
    "how does ChatGPT work", "what is a large language model",
    "what is generative AI", "what is DALL-E",
    "how does Spotify recommend music", "what is a recommendation algorithm",
    "what is cyberbullying", "how to stay safe online",
    "what should I never share online", "why is screen time important to manage",
    "what is an internet cable under the ocean",
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

// ─── Weekly Report Cron ────────────────────────────────────────────────────────
// Called by Vercel Cron every Sunday at 09:00 UTC.
// Sends a personalised progress email to every registered parent.

router.post("/admin/weekly-report", async (req, res) => {
  try {
    const { data: users } = await supabase
      .from("users")
      .select("id, email, parent_name, language");

    if (!users || users.length === 0) {
      return res.json({ sent: 0, message: "No users found" });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let sent = 0;

    for (const user of users) {
      if (!user.email) continue;

      const { data: child } = await supabase
        .from("children")
        .select("id, child_name, streak_days, total_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!child) continue;

      const [{ data: lessons }, { data: msgs }, { data: alerts }] = await Promise.all([
        supabase.from("lesson_progress").select("id, lesson_id")
          .eq("child_id", child.id).eq("completed", true).gte("completed_at", weekAgo),
        supabase.from("messages").select("content_text")
          .eq("child_id", child.id).eq("role", "user").gte("created_at", weekAgo).limit(200),
        supabase.from("safety_alerts").select("id, category")
          .eq("child_id", child.id).gte("timestamp", weekAgo),
      ]);

      // Derive top topics from message content
      const topicCounts: Record<string, number> = {};
      for (const m of (msgs ?? [])) {
        const text = (m.content_text ?? "").toLowerCase();
        for (const topic of ["math", "science", "reading", "writing", "history", "geography", "animals", "space", "coding", "music"]) {
          if (text.includes(topic)) topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
        }
      }
      const topTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([t]) => t.charAt(0).toUpperCase() + t.slice(1));

      const safetyOk = (alerts?.length ?? 0) === 0;
      const html = weeklyReportHtml({
        childName: child.child_name ?? "your child",
        parentName: user.parent_name ?? "",
        streak: child.streak_days ?? 0,
        wordsLearned: (lessons?.length ?? 0) * 5,
        lessonsCompleted: lessons?.length ?? 0,
        storiesListened: 0,
        topTopics: topTopics.length > 0 ? topTopics : ["Learning", "Discovery"],
        homeworkSolved: msgs?.length ?? 0,
        badgesEarned: 0,
        safetyOk,
        safetyNote: !safetyOk ? `${alerts!.length} safety alert${alerts!.length !== 1 ? "s" : ""} flagged` : undefined,
      });

      const ok = await sendEmail({
        to: user.email,
        subject: `🦸 ${child.child_name}'s Weekly Learning Report`,
        html,
      });
      if (ok) sent++;
    }

    req.log.info({ sent, total: users.length }, "Weekly reports sent");
    return res.json({ sent, total: users.length });
  } catch (err) {
    req.log.error({ err }, "weekly-report error");
    return res.status(500).json({ error: "failed" });
  }
});

// POST /api/admin/prewarm-tech-audio
// Generates TTS audio for all 18 tech lesson slides and stores in lessons-audio bucket.
// Slide text extraction: hook→body, story→body, fact→fact, quiz→question+explanation, celebrate→message
router.post("/admin/prewarm-tech-audio", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Compact tech lesson slide texts: [lessonId, ...slideTexts]
  // Each entry maps directly to path tech/{lessonId}/slide-{index}-en
  const TECH_SLIDES: { id: string; slides: string[] }[] = [
    { id: "tech-1", slides: [
      "Ready to discover the most amazing machine ever invented? Computers are everywhere — and today you'll learn exactly how they work! Let's go!",
      "A computer is a super-smart machine that follows your instructions! It can play music, show movies, help you draw, and even talk to you. Computers do exactly what you tell them — not one bit more, not one bit less!",
      "Every computer has four key parts! The SCREEN shows you everything. The KEYBOARD lets you type. The MOUSE lets you click. And the BRAIN inside — called the processor — does all the thinking at lightning speed!",
      "Guess what? Computers are hiding EVERYWHERE! Your TV has one inside. Your tablet IS one. Traffic lights, ATMs, even some refrigerators have tiny computers! Once you know this, you'll see them all around you.",
      "Here's a wild secret — computers only understand TWO numbers: 0 and 1. That's it! Zero means OFF, and One means ON — like a light switch. Everything you see, hear, or do on a computer is made of millions of these tiny on-and-off signals!",
      "The very first computer was so BIG it filled an entire room — as large as a house! It weighed 30 tonnes. Today, your smartphone is a MILLION times more powerful than those giant machines!",
      "What is a computer? A computer is a smart machine that follows instructions! It processes information and can do many tasks.",
      "What are the TWO things a computer understands? Computers only understand 0 (OFF) and 1 (ON)! Everything — music, videos, games — is made of billions of these tiny signals!",
      "Which of these also has a computer inside? Traffic lights have tiny computers that control when to switch between red, yellow, and green!",
      "Amazing! You're officially a Computer Explorer! You know what computers are, how they work, and where they hide!",
    ]},
    { id: "tech-2", slides: [
      "Robots can vacuum your floor, explore other planets, and even perform surgery! Today we'll discover what robots really are and how they help people every single day. Let's meet them!",
      "A robot is a machine that can SENSE the world around it, THINK about what to do, and then ACT! It uses sensors like eyes, a computer brain, and motors like muscles to move and do tasks. Real robots are way cooler than cartoons!",
      "Have you seen a robot vacuum cleaner? It drives around your floor, senses walls and furniture, and cleans without anyone telling it where to go! Some people even have robots that mow the lawn or deliver packages to their door!",
      "NASA sent a robot called Curiosity to Mars — a planet 225 million kilometers away! Curiosity drives around Mars, takes photos, and studies rocks. No human could survive there yet, so robots go first as our brave explorers!",
      "Some robots help surgeons perform operations! The robot's tiny arms can make cuts smaller than a human hand ever could. This means patients heal faster and feel less pain. Robots save lives every single day!",
      "Robots don't think on their own — humans program them! A programmer writes special instructions called code that tells the robot every move to make. Without a human's program, a robot just sits there doing nothing!",
      "The fastest robot in the world can run at 45 kilometers per hour — almost as fast as a cheetah! And the deepest-diving robot has explored 11 kilometers beneath the ocean surface where no human can survive!",
      "What three things does a robot do? Every robot Senses its environment, Thinks using its computer brain, then Acts by moving or doing something!",
      "Which robot explored the planet Mars? NASA's Curiosity rover is a real robot on Mars right now, studying rocks and taking photos of the red planet!",
      "Who tells a robot what to do? Humans write programs — sets of instructions called code — that tell the robot exactly what to do!",
      "Incredible work! You now know all about robots! From space explorers to surgery helpers — robots are changing the world!",
    ]},
    { id: "tech-3", slides: [
      "Imagine being able to talk to someone in Japan, watch a video from Brazil, and learn from a teacher in Canada — all in one second! That's what the internet does. Let's discover how this magical network really works!",
      "The internet is a GIGANTIC network of computers all connected together around the world! Think of it like a massive spider web — millions of threads connecting billions of computers, phones, and tablets. When you send a message, it zips across this web in milliseconds!",
      "When you send a message, it gets chopped into tiny pieces called DATA PACKETS. Each packet travels through cables, satellites, and routers — sometimes going halfway around the world — then they reassemble at your friend's screen. All this happens in less than a second!",
      "Here's something wild — most of the internet travels through cables on the OCEAN FLOOR! These cables are about as thick as your arm and stretch for thousands of kilometers under the sea. They carry billions of messages every second between continents!",
      "WiFi is radio waves that carry internet data through the air — just like how a radio station broadcasts music! Your router at home sends out these invisible waves, and your phone or tablet catches them. You're literally swimming in invisible internet waves right now!",
      "The internet is amazing but you need to stay safe! Never share your real name, address, or school with strangers online. Use strong passwords — mix letters, numbers, and symbols. And always tell a trusted adult if something online makes you feel uncomfortable. Your safety comes first!",
      "Every single minute on the internet: people send 200 MILLION emails, watch 500 hours of YouTube videos, and make 5 million Google searches! The internet never sleeps and never slows down — it runs 24 hours a day, 7 days a week!",
      "What does the internet connect? The internet is a global network connecting billions of computers, phones, and devices all around the world!",
      "What are data packets? Your messages and videos are broken into tiny data packets that travel separately and reassemble at the destination!",
      "How does WiFi work? WiFi uses radio waves — invisible signals in the air — to carry internet data to your devices wirelessly!",
      "You're an Internet Explorer! You now understand how the world's biggest network connects everyone on Earth!",
    ]},
    { id: "tech-4", slides: [
      "What if a computer could LEARN — just like you do? That's exactly what Artificial Intelligence, or AI, is! It's not magic — it's clever math and millions of examples. Ready to understand how AI actually thinks? Let's go!",
      "Artificial Intelligence — AI for short — is when computers learn to do tasks that normally need human intelligence! Like understanding what you say, recognizing your face, or translating languages. AI isn't one program — it's a whole field of amazing techniques!",
      "Imagine you want to teach a computer to recognize cats. You show it ONE MILLION photos labeled cat and not cat. The AI finds patterns — pointy ears, whiskers, fur — and builds rules. After enough examples, it can recognize ANY cat it's never seen before!",
      "Think of AI as a student who never gets tired! You the programmer are the teacher. You give the AI thousands of examples, it makes mistakes, you correct it, it gets better. After millions of corrections, it becomes really, really good — sometimes even better than humans!",
      "AI is hungry for DATA — information! The more data it has, the smarter it becomes. YouTube's AI watched billions of videos to learn what you like. Spotify's AI listened to millions of songs to know your taste. Data is food for AI!",
      "AI is amazing at finding patterns in huge amounts of data — it can read X-rays, translate 100 languages, and beat chess champions! But AI can't feel emotions, be truly creative, or understand life like humans do. AI is a tool — a very powerful one — built by people!",
      "AlphaGo, an AI made by Google, became the world champion of Go — an ancient board game with more possible moves than atoms in the universe! It learned by playing millions of games against itself over just a few days. Humans practice for decades!",
      "What does AI stand for? AI stands for Artificial Intelligence — computers programmed to do tasks that normally require human thinking!",
      "How does AI learn to recognize cats? AI learns by seeing millions of examples with labels! It finds patterns in those examples and builds rules for recognizing new ones.",
      "What does AI need A LOT of to get smarter? AI needs massive amounts of data — examples, photos, sounds, text — to learn patterns and improve!",
      "Brilliant! You understand how AI thinks! You now know more about AI than most adults! Keep exploring!",
    ]},
    { id: "tech-5", slides: [
      "What if you could tell a computer EXACTLY what to do — and it would obey perfectly? That's coding! It's one of the most powerful skills in the world, and YOU can learn it. Let's discover what coding really is!",
      "Coding — also called programming — is writing instructions in a language a computer understands. Just like you follow a recipe to bake cookies, a computer follows code to do tasks. The difference? Computers do EXACTLY what you write — no guessing, no shortcuts!",
      "An algorithm is a step-by-step plan for solving a problem — like a recipe! Wake up, Get dressed, Eat breakfast, Go to school — that's an algorithm for your morning! Coders write algorithms and translate them into code. Good algorithms equal great programs!",
      "Here's a funny thing about computers — they do EXACTLY what you say, not what you MEAN! If you write 'make sandwich' without explaining HOW, the computer is lost. Coders must be super precise. Get bread, spread butter on one side, add cheese, place second slice on top — NOW it works!",
      "Computers understand special languages called programming languages! Python is great for beginners and AI. JavaScript makes websites interactive. Scratch uses colorful blocks to teach kids. There are hundreds of languages — each best for different jobs. Coders pick the right tool!",
      "You don't need to be a math genius to code! You need LOGIC — the ability to think step by step — and CREATIVITY. Girls, boys, young and old all code! The youngest programmer in the world was just 6 years old! Age is no barrier to coding greatness!",
      "Every app you've ever used — YouTube, Minecraft, WhatsApp — was built by programmers writing code! Minecraft was originally built by just ONE programmer in his spare time. Today it's played by 140 million people monthly. One person plus code can change the world!",
      "What is coding? Coding is writing step-by-step instructions in a language computers understand, so they can complete tasks!",
      "What is an algorithm? An algorithm is a clear, step-by-step plan for solving a problem — like a recipe that computers follow!",
      "Which language is good for beginners and AI? Python is a popular programming language known for being beginner-friendly and widely used in AI and data science!",
      "You're a Coding Superstar! You understand what coding is, how algorithms work, and you know this skill can change the world!",
    ]},
    { id: "tech-6", slides: [
      "What if you had to write draw a circle 1000 times to make a spiral? That would take forever! Programmers use LOOPS to repeat steps automatically. It's one of the most powerful ideas in all of computing. Let's master it!",
      "A loop tells the computer: Repeat this action X times or Keep repeating until this condition is true. Think of your morning routine — you brush EVERY tooth one by one. That's a loop! For each tooth: brush for 2 seconds. Repeat until all done.",
      "A FOR loop repeats an action a specific number of times! Example: For 10 times: print a star. The computer prints ten stars instantly! Without a loop, you'd write print star ten separate times. Loops save enormous amounts of work!",
      "A WHILE loop keeps running AS LONG AS something is true! Like: While there are dirty dishes: wash one dish. The loop keeps going until all dishes are clean — then stops. Computers use while loops for things like: While game is running: check for player input.",
      "Every app you use is full of loops! In a game, there's a GAME LOOP that runs 60 times per second: Check what the player pressed, Update character position, Draw the screen, Repeat! YouTube's loop shows you video after video. Social media loops through your feed. Loops are EVERYWHERE!",
      "Scientists used a computer loop to calculate Pi to 100 TRILLION decimal places! Pi is 3.14159 and goes on forever. The loop ran for 157 days non-stop, computing digits faster than any human ever could. That's the power of loops — infinite patience!",
      "What does a loop do in coding? A loop tells the computer to repeat a set of instructions automatically — saving you from writing the same code hundreds of times!",
      "What type of loop repeats exactly 10 times? A FOR loop repeats a specific number of times! You tell it exactly how many: for 10 times, do this action.",
      "A game loop in a video game runs about how many times per second? Most video games run their main loop 60 times per second! Each loop checks input, updates positions, and redraws the screen.",
      "Loop Master unlocked! You understand one of coding's most powerful ideas. Loops are the heartbeat of every program!",
    ]},
    { id: "tech-7", slides: [
      "Every single decision a computer makes — every button click, every game choice, every filter on a photo — is made using IF-THEN logic! This simple idea is behind EVERYTHING in computing. Ready to think like a computer? Let's go!",
      "An if-then statement tells a computer: IF this is true, THEN do that. Example: IF it's raining, THEN take an umbrella. IF you scored over 90, THEN say Great job! You use if-then thinking every day — computers just do it millions of times per second!",
      "We can add an ELSE to handle the other case! IF it is raining: take umbrella. ELSE: leave umbrella at home. In code, this covers ALL possibilities — if the condition isn't true, the else handles it. This way your program never gets confused or stuck!",
      "Video games are FULL of if-then logic! IF player touches enemy, lose a life. IF score reaches 100, level up. IF player presses jump button, make character jump. Without if-then statements, games couldn't react to anything you do! Every single game mechanic is built this way!",
      "Conditions can combine! Using AND: IF it's raining AND you're outside, use umbrella. Using OR: IF hungry OR thirsty, go to kitchen. Using NOT: IF NOT tired, keep playing. Real programs combine dozens of conditions to make sophisticated decisions!",
      "The autopilot system in a modern airplane makes over 10,000 if-then decisions per second! IF altitude drops, adjust engines. IF storm detected, reroute. IF fuel low, warn pilot. This incredible decision-making keeps millions of passengers safe every day!",
      "What does an if-then statement do? If-then statements let computers make decisions! IF a condition is true, THEN do something specific.",
      "What does ELSE do in an if-then statement? ELSE handles the case when the IF condition is false! Together, IF-ELSE covers all possible situations.",
      "IF score is greater than or equal to 100, level up — what happens when score is 85? If score is 85, the condition is false, so the level-up code doesn't run! The ELSE part would handle this case.",
      "Decision Champion! You now think like a computer! If-then logic is the foundation of every app, game, and AI system in the world!",
    ]},
    { id: "tech-8", slides: [
      "Your smartphone is more powerful than the computers NASA used to send astronauts to the moon! It has sensors, cameras, GPS, radio, and a brain doing billions of calculations per second. Let's crack it open and see what's really inside!",
      "Inside your phone is a tiny chip called a processor — your phone's brain! A modern phone processor has 15 BILLION transistors — microscopic switches — on a chip smaller than your thumbnail. It does billions of calculations every second without breaking a sweat!",
      "Your touchscreen is covered in a grid of tiny electrodes that detect your finger's electrical charge! Your body conducts electricity, so when your finger touches the glass, it disturbs the electric field at that exact spot. The phone calculates the X and Y position in milliseconds!",
      "Your phone camera has millions of tiny sensors called pixels! Each pixel measures how much light hits it. A 12-megapixel camera captures 12 MILLION pixels per photo. AI then processes the photo — reducing noise, balancing color, and sharpening details — all in a fraction of a second!",
      "GPS works using signals from 24 satellites orbiting 20,000 kilometers above Earth! Your phone listens to at least 4 satellites. By calculating how long each signal took to arrive, your phone triangulates your exact position — accurate to within 3 meters. Space is helping you navigate!",
      "Your phone secretly has LOTS of sensors you might not know about! Accelerometer knows if it's tilting, gyroscope detects rotation, barometer measures air pressure for altitude, magnetometer is a compass, ambient light sensor dims your screen automatically, and proximity sensor turns off screen during calls!",
      "The iPhone in your pocket is 100,000 times more powerful than the Apollo 11 computer that guided astronauts to the moon in 1969! The Apollo computer had just 4 kilobytes of memory. Your phone has billions of times more. You carry history's most powerful computer everywhere!",
      "How does a touchscreen know where you touched? Touchscreens detect your finger's electrical charge! Our bodies conduct electricity, and the screen measures exactly where the charge changed.",
      "How many satellites does GPS need to find your location? GPS needs signals from at least 4 satellites to accurately calculate your 3D position — latitude, longitude, and altitude!",
      "What does the accelerometer in your phone do? The accelerometer detects how your phone is tilting and moving — it's why your screen rotates when you turn your phone sideways!",
      "Tech Genius! You now know more about your smartphone than most people ever will! That little rectangle in your pocket is truly miraculous!",
    ]},
    { id: "tech-9", slides: [
      "You're already using Artificial Intelligence dozens of times every single day — and you probably didn't even know it! From the moment you wake up to when you go to sleep, AI is quietly working to make your life better. Let's count all the ways!",
      "Your morning starts with AI! Your phone's alarm was set by you but the face recognition that unlocks it? Pure AI! Your email app uses AI to sort spam. If you asked Siri or Google Assistant something, that's AI understanding your voice. Breakfast hasn't started and AI is already working!",
      "When your phone suggests the next word as you type — that's AI! It has learned from billions of text messages and knows what words typically follow others. Autocorrect fixes typos by predicting what you MEANT to write. This AI model was trained on more text than any human could ever read!",
      "Ever wonder why YouTube always knows what video you'd love next? AI tracks every video you watch, how long, if you skipped, if you liked it — and builds a model of your taste. Spotify does the same with music. These recommendation AIs are studied by thousands of engineers to get it just right!",
      "AI can identify your face in a crowd of millions in under a second! It maps 68 key points on your face — the distance between your eyes, the shape of your jawline — and creates a mathematical fingerprint unique to you. Your phone, social media tags, and airport security all use this!",
      "AI works like a guardian angel online! It detects spam emails, blocks fake news, catches suspicious bank transactions, and filters harmful content from your social media. Every day, AI blocks billions of cyber attacks before they can reach you. You're protected by invisible AI shields!",
      "Google's AI translates over 100 BILLION words every single day across 109 languages — more than all human translators in history combined! This real-time translation is breaking down language barriers worldwide.",
      "How does YouTube decide what video to show you next? YouTube's recommendation AI analyzes your watch history, likes, skips, and even how long you watched each video to suggest what you'd love next!",
      "What does face recognition AI map on your face? Face recognition AI maps specific key points — distances and angles between features — to create a unique mathematical fingerprint of your face!",
      "AI guards you online by doing what? AI acts as a digital guardian, detecting spam emails, fraudulent transactions, and blocking billions of cyber attacks every day!",
      "AI Detective! You can now spot AI everywhere you look! You're living in the most technologically amazing time in human history!",
    ]},
    { id: "tech-10", slides: [
      "What if a computer could learn without anyone writing rules for it? That's Machine Learning — the most revolutionary idea in modern technology! Instead of programmers writing every rule, the AI figures out the rules from data. This changes EVERYTHING. Let's dive deep!",
      "Old way: programmers write all the rules. Machine Learning way: show the AI 10 million real and spam emails and let IT figure out the patterns. Result: it catches spam no human ever thought to block! Machine Learning creates smarter solutions than hand-written rules ever could!",
      "Training an AI has three stages! First, TRAINING: feed the AI tons of labeled examples so it builds its model. Second, VALIDATION: test it on new examples to tune it. Third, TESTING: give it completely unseen data — its final exam! Only then do you know if it truly learned.",
      "The most powerful machine learning uses NEURAL NETWORKS — systems loosely inspired by how your brain works! Your brain has 86 billion neurons connected together. A neural network is artificial neurons connected in layers. Information flows through the layers, and the network adjusts its connections to get better at tasks!",
      "DEEP LEARNING adds many layers to neural networks — some have hundreds of layers! The first layer might detect edges in images. The next detects shapes. The next recognizes objects. The final layer says that's a cat! Each layer builds on the previous one. This is what makes ChatGPT and image AI possible!",
      "Here's a sneaky problem called OVERFITTING! If an AI memorizes its training data TOO perfectly, it fails on new data — like a student who memorizes the exact test questions instead of understanding the subject. Scientists use clever tricks to prevent this and make AI that truly generalizes!",
      "GPT-4, the AI behind ChatGPT, was trained on approximately 1 TRILLION words of text — more words than all humans combined have written in the past 20 years! It took thousands of computer chips running for months to train. The final model has hundreds of BILLIONS of learned parameters!",
      "What makes Machine Learning different from traditional programming? In Machine Learning, instead of programmers writing every rule, the AI figures out its own rules by analyzing large amounts of labeled data!",
      "What are Neural Networks inspired by? Neural networks are loosely inspired by how biological neurons in the brain connect and communicate!",
      "What is overfitting in machine learning? Overfitting is when an AI memorizes training examples so specifically that it fails to handle new, unseen examples — it learned facts, not concepts!",
      "Machine Learning Master! You understand the technology powering the AI revolution! This knowledge puts you ahead of 99% of people on Earth!",
    ]},
    { id: "tech-11", slides: [
      "When you search for something on Google, it searches through over 100 BILLION web pages and gives you an answer in a fraction of a second. How? Engineering genius! Let's discover the incredible science behind search engines!",
      "Google sends out billions of programs called CRAWLERS that surf the entire internet! They visit every website, read all the text, follow every link to new pages, then come back and report what they found. This never stops — the web is always changing, and crawlers keep up 24 hours a day, 7 days a week!",
      "After crawling, Google INDEXES the information — like organizing a massive library! It notes which words appear on which pages, how many times, how prominently. This creates a giant lookup table: the word DINOSAUR appears on these 4.2 billion pages. This index is stored on millions of servers worldwide!",
      "When you search, Google must decide which of millions of matching pages to show FIRST! It uses over 200 signals: Is the page trusted? Does it have lots of links pointing to it? Is it fast? Is the content fresh? Does it actually answer your question? AI then reranks results based on your specific search!",
      "Google's founders had a genius insight: a web page is important if IMPORTANT pages link to it! Like academic papers — a paper cited by Nobel Prize winners is probably more valuable than one cited by nobody. This PageRank algorithm started Google and is still a core part of how search works today!",
      "Modern Google uses AI to understand what you MEAN, not just what you typed! If you search 'how tall is a giraffe compared to a school bus' — Google understands you want a comparison. AI reads your intent and finds the perfect answer, even for questions never asked before!",
      "Google processes over 8.5 BILLION searches every single day — that's 99,000 searches every second! To store its index and serve results, Google operates over 1 million servers in data centers around the world. If Google goes down for even 5 minutes, global internet traffic drops by 40%!",
      "What are web crawlers? Web crawlers are automated programs that continuously browse the internet, reading pages and following links to discover new content!",
      "What is a search engine's index? The index is Google's giant database that maps every word it has found to all the web pages where that word appears — making searching instant!",
      "What was PageRank's brilliant original idea? PageRank was based on the idea that a page is important if other important pages link to it — like academic citations. Simple but genius!",
      "Search Engine Expert! You now understand what happens in that fraction of a second between your search and your answer. Pure engineering brilliance!",
    ]},
    { id: "tech-12", slides: [
      "Every year, cybercriminals steal over 3 TRILLION dollars from people and businesses online! But with the right knowledge, you can protect yourself completely. Cybersecurity is one of the most important skills of the 21st century. Let's master it!",
      "Cybersecurity is the practice of protecting computers, networks, and data from hackers and cyberattacks! Just like a castle has walls, moats, and guards, digital systems need passwords, encryption, and firewalls. Cybersecurity experts are the guards of the digital world!",
      "A weak password can be cracked in seconds! The password 123 takes a hacker a fraction of a second to guess. But a strong password mixing uppercase, lowercase, numbers, and symbols would take 550 YEARS to crack! Great passwords are at least 12 characters long. Use a unique password for EVERY account!",
      "Phishing is when hackers disguise themselves as trusted companies! They send fake emails saying Your account is hacked — click here immediately! The link goes to a fake website that steals your password. Rule: NEVER click links in panic-inducing emails. Always go to websites directly by typing the address!",
      "Two-Factor Authentication is a superpower! Even if someone gets your password, they still can't log in — because they also need a code sent to YOUR phone. It's like your house having TWO locks: even if someone copies your key, they still can't enter without the second one. Always turn on Two-Factor Authentication!",
      "Encryption scrambles your data so only the right person can read it! When you use HTTPS — the padlock in your browser — your data is encrypted before leaving your device. Even if a hacker intercepts it, they just see random gibberish. Modern encryption would take a billion years to crack!",
      "There are 2,200 cyberattacks every single day — that's one attack every 39 seconds! The most expensive hack in history cost one company 10 BILLION dollars. Because of this, cybersecurity is the fastest-growing career in the world, with millions of jobs unfilled right now!",
      "Which password is strongest? A strong password mixes uppercase, lowercase, numbers, and symbols — making it extremely hard to crack. Common words and birth years are very easily guessed!",
      "What is phishing? Phishing attacks trick you by disguising fake websites or emails as legitimate ones to steal your passwords and personal information!",
      "What does Two-Factor Authentication add? Two-Factor Authentication requires a second proof of identity — usually a code sent to your phone — so even if someone knows your password, they still can't access your account!",
      "Cybersecurity Warrior! You now have the knowledge to protect yourself in the digital world. Strong passwords, Two-Factor Authentication, and skepticism are your superpowers!",
    ]},
    { id: "tech-13", slides: [
      "That game you love, the app you use every day — someone had to BUILD it from scratch! The journey from I have an idea to millions of people are using this is incredible. Let's walk through every step of how apps are really made!",
      "Every great app starts with a problem to solve! Why is there no app that does this? The team researches: Does this problem really exist? How many people have it? Have others tried to solve it? They interview potential users, study competition, and define EXACTLY what the app will do before writing a single line of code!",
      "UI/UX Designers create the app's look and feel! They sketch wireframes — basic sketches of screens — then design beautiful interfaces. UX means User Experience — making the app intuitive so users never feel confused. The best apps feel so natural you never notice the thousands of design decisions behind them!",
      "Developers write the code that makes the app work! Frontend developers build what you see and touch. Backend developers build the servers and databases. Sometimes there are 100 or more developers working on different parts of one app! They use version control so everyone's changes combine without chaos!",
      "Testers try EVERYTHING to make the app crash! They test on different phones, with bad internet, with unusual inputs. What if I type 1 million characters in the name field? What if I press two buttons at the same time? Finding and fixing bugs before launch saves the company from disaster!",
      "Launch day! The app goes on the App Store or Google Play. But the work doesn't stop! The team watches how users behave: Where do they get confused? Which features do they love? Which do they ignore? Then they release UPDATES — improvements based on real user data. Great apps never stop evolving!",
      "Instagram was built by just 13 people before being sold for 1 BILLION dollars to Facebook! WhatsApp had only 35 engineers when it was bought for 19 BILLION dollars. Small, brilliant teams with the right idea can change the world. You could be on that team someday!",
      "What do UX designers focus on? UX designers focus on making apps feel natural and intuitive — ensuring users can accomplish tasks without confusion!",
      "Why do QA testers try to make apps crash? Quality Assurance testers deliberately try to break apps in unusual ways to find bugs and fix them before real users encounter them!",
      "What happens AFTER an app launches? After launch, teams analyze how users actually use the app and continuously release updates and improvements. Great apps are always evolving!",
      "App Builder Certified! You now know exactly how the apps you love go from an idea to a product used by millions! Could you be next?",
    ]},
    { id: "tech-14", slides: [
      "Data is the most valuable resource in the world today — more valuable than oil! Every click, every search, every photo generates data. And AI FEEDS on this data to become smarter. Understanding big data means understanding the fuel behind the entire AI revolution! Let's dig in!",
      "Big Data is data so MASSIVE and complex that regular computers can't process it! We create 2.5 quintillion bytes of data every single day. It comes from social media, sensors, GPS, medical records, satellites — everything digital creates data! Big Data needs special tools to make sense of it.",
      "Scientists describe Big Data with three Vs! VOLUME: the sheer amount — think petabytes of data. VELOCITY: how fast it's generated — millions of tweets per minute. VARIETY: different types — text, images, video, sensor readings, GPS coordinates. AI must handle all three to extract useful insights!",
      "You're generating data right now! Your phone tracks location every few seconds. Smart watches record your heart rate. Netflix logs every pause and rewind. Supermarket loyalty cards track every purchase. Traffic cameras count cars. Scientists even analyze satellite images to count trees and measure glaciers. Everything is data!",
      "AI is useless without data — like a student with no textbooks! Companies feed their AI models billions of examples. Amazon's recommendation AI has analyzed TRILLIONS of purchases to know what you might want next. Google trained its translation AI on billions of translated documents. More data equals smarter AI!",
      "Here's the big question: when you use a free app, YOU are the product! Companies collect your data, analyze it, and sell insights to advertisers. Many countries now have laws protecting your data rights — like Europe's GDPR. You have the right to know what data is collected about you and ask for it to be deleted!",
      "By 2025, humans will create 463 EXABYTES of data every single day! An exabyte is 1 billion gigabytes. If you stored all that data on DVDs, the stack would reach from Earth to the Moon and back 23 times — every single day! The data universe grows faster than any resource in history!",
      "What makes data Big Data? Big Data refers to datasets so massive, fast-moving, and varied that they require special distributed computing systems and tools to process!",
      "What are the Three Vs of Big Data? The Three Vs are Volume — how much, Velocity — how fast, and Variety — what types. These are the three main challenges of working with Big Data!",
      "When you use a free app, what are you really paying with? Free apps are funded by advertising. Companies collect your data, analyze your behavior and preferences, and sell insights to advertisers who target you!",
      "Data Scientist in Training! You understand the invisible resource that powers our digital world. Data literacy is a superpower for the 21st century!",
    ]},
    { id: "tech-15", slides: [
      "Imagine a car that drives perfectly without any human — no hands on the wheel, no feet on the pedals! These cars already exist and are driving on real roads today. The AI inside makes thousands of decisions per second. Let's explore this incredible technology!",
      "Not all self-driving is the same! Level 0 is fully human. Level 1 is cruise control — human plus some assist. Level 2 is steering AND braking automated, like Tesla's Autopilot. Level 3: car handles driving, human ready to take over. Level 4: fully autonomous in most conditions. Level 5: perfectly autonomous anywhere. We're currently between Levels 2 and 3!",
      "Self-driving cars are covered in sensors! LIDAR shoots laser beams in 360 degrees and creates a 3D map of surroundings updated 10 times per second. RADAR measures the speed of nearby objects. Multiple CAMERAS see lane markings and traffic lights. GPS knows exact location. Together, these sensors see far better than any human driver!",
      "The AI must make decisions in milliseconds! It processes all sensor data simultaneously: Pedestrian is 15 meters ahead, moving toward road — calculate brake timing — will stop 3 meters before pedestrian. Every object gets tracked and predicted. The AI plans its route 3 to 5 seconds ahead, continuously updating!",
      "Waymo's self-driving AI has driven over 32 MILLION real kilometers AND 20 BILLION kilometers in simulation! The simulation runs millions of what-if scenarios: What if a child runs into the road? What if the road is icy? What if traffic lights malfunction? Real and simulated experience together create superhuman driving!",
      "Self-driving cars face incredibly hard edge cases! How do you handle a construction zone with no lane markings? A police officer gesturing to stop? A plastic bag blowing across the road versus a rock? Faded white lines in heavy rain? These rare scenarios are very difficult for AI but trivial for experienced human drivers!",
      "Waymo's robotaxis in San Francisco have given over 700,000 paid rides with ZERO serious accidents caused by the AI! Human drivers cause 1 accident per million miles. Waymo is 10 times safer! The main risk is human drivers hitting the robotaxis — proof that humans are the bigger danger on roads!",
      "What does LIDAR do in a self-driving car? LIDAR fires laser pulses in all directions and measures their return time to create a detailed, real-time 3D map of everything around the car!",
      "At which level does Tesla Autopilot operate? Tesla Autopilot is Level 2 — it automates both steering and braking, but a human driver must stay alert and ready to take control at any moment!",
      "Why is simulation training important for self-driving AI? Simulations let AI safely experience millions of rare and dangerous scenarios — bad weather, pedestrian surprises, equipment failures — that can't be tested on real roads!",
      "Autonomous Tech Expert! You understand one of the most complex AI systems ever built. Self-driving technology is reshaping transportation — and you understand how!",
    ]},
    { id: "tech-16", slides: [
      "AI is now detecting cancer before doctors can see it with their own eyes. It's designing new drugs in weeks instead of decades. It's predicting diseases before symptoms appear. Medical AI might be the most important technology in human history — let's explore how it works!",
      "Radiologists spend years learning to read X-rays and MRI scans. Now AI can do it in seconds — and often better! Google's AI detected breast cancer from mammograms with 11 percent FEWER false negatives than human radiologists. It spotted early-stage cancers that human eyes missed. AI doesn't get tired at hour 12 of work!",
      "Finding new medicines traditionally takes 10 to 15 YEARS and costs billions of dollars. AI is changing this completely! DeepMind's AlphaFold AI solved a 50-year biology mystery — predicting how proteins fold — in months. This is helping scientists design drugs for Alzheimer's, cancer, and infectious diseases at unprecedented speed!",
      "AI can predict who will get sick BEFORE they have any symptoms! By analyzing patterns in medical records, genetics, lifestyle, and even retina scans, AI can predict heart attacks, diabetes, and Parkinson's disease years in advance. This allows doctors to intervene early — when treatment is most effective!",
      "The da Vinci surgical robot performs minimally invasive surgery with superhuman precision! It translates a surgeon's hand movements into micro-scale movements inside the body — filtering out any hand tremors. Cuts are 10 times smaller than traditional surgery. Patients recover in days instead of weeks!",
      "AI helped track COVID-19 spread, discover vaccines faster, and identify who was most at risk! Bluedot, a Canadian AI company, detected the COVID outbreak 9 DAYS before the World Health Organization warned the public — by analyzing flight patterns and infectious disease data. AI is becoming our early warning system!",
      "AI-driven drug discovery startup Insilico Medicine found a new drug candidate for lung disease in just 18 MONTHS — a process that normally takes 4 to 5 years! The AI designed over 30,000 candidate molecules and narrowed them to the best one. The drug is now in human clinical trials. AI is rewriting the timeline of medicine!",
      "What did Google's AI do better than human radiologists? Google's AI detected breast cancer from mammograms with fewer false negatives than human radiologists — finding cancers that human eyes missed!",
      "What 50-year mystery did AlphaFold solve? AlphaFold predicted how proteins fold into their 3D shapes — a problem biologists had struggled with for 50 years. This breakthrough is accelerating drug discovery for countless diseases!",
      "How early did AI detect COVID-19 before official warnings? Bluedot's AI detected the COVID-19 outbreak 9 days before the WHO issued public warnings, by analyzing airline ticket data and disease reports!",
      "Medical AI Pioneer! You understand how AI is transforming medicine and saving millions of lives. This is technology at its most meaningful!",
    ]},
    { id: "tech-17", slides: [
      "You are growing up in the most extraordinary era in human history. The technologies being developed right NOW will transform medicine, space, education, and everyday life beyond recognition. Get ready — this is YOUR future!",
      "Regular computers use bits — 0 or 1. Quantum computers use QUBITS that can be 0 AND 1 simultaneously! This superposition lets them solve certain problems millions of times faster. A quantum computer could crack today's encryption in minutes — or design materials that solve energy problems forever!",
      "VR puts you inside a completely digital world. AR overlays digital information on the real world! Surgeons already use AR to see patient data projected onto their body during operations. Students walk through ancient Rome in VR. Within 10 years, AR glasses may replace smartphones — you'll see digital information everywhere you look!",
      "Neuralink is developing chips implanted in the human brain to interface directly with computers! A paralyzed patient can already control a computer mouse just by THINKING about moving it. In the future, you might type by thinking, learn new skills by downloading them, or control digital overlays with your mind!",
      "SpaceX's Starship — the largest rocket ever built — is designed to carry 100 people to Mars! AI will plan and manage the journey, monitor life support, and help establish the first human colony on another planet. You might live to see the first Martian city. The generation born today may never know a world without space travel!",
      "Generative AI creates original art, music, code, and text from simple prompts! DALL-E creates photorealistic images from descriptions. Sora generates full movies from text. AI musicians compose symphonies. AI programmers write apps. This isn't replacing human creativity — it's giving everyone creative superpowers, regardless of artistic training!",
      "Experts predict: by 2030, AI will be smarter than any human at most cognitive tasks. By 2040, self-driving vehicles will outnumber human-driven ones. By 2050, the first human Mars colony may be established. And nuclear fusion — unlimited clean energy — could be commercially available within 15 years. You'll see ALL of this in your lifetime!",
      "What makes quantum computers revolutionary? Quantum computers use qubits that can be in a superposition of 0 and 1 at the same time — allowing them to solve certain problems exponentially faster than regular computers!",
      "What is Augmented Reality? Augmented Reality overlays digital information — images, data, labels — on top of what you see in the real world, enhancing reality rather than replacing it!",
      "What does Neuralink aim to achieve? Neuralink is developing brain implants that allow direct communication between the human brain and computers — letting people control devices by thought alone!",
      "Future Visionary! You understand the technologies that will define your lifetime. You're not just ready for the future — you're ready to help BUILD it!",
    ]},
    { id: "tech-18", slides: [
      "AI is making decisions that affect millions of lives — who gets a loan, who gets interviewed for a job, who gets paroled from prison. But what if AI is WRONG? Or UNFAIR? Or BIASED? This isn't science fiction — these problems are happening RIGHT NOW. Let's explore!",
      "AI learns from human data — and humans have biases. So AI can inherit those biases! Amazon built an AI to screen job applications. The AI learned from 10 years of hiring data — when Amazon mostly hired men. Result: the AI automatically downgraded resumes with the word women's. Biased data leads to biased AI!",
      "Facial recognition AI is dramatically less accurate for darker skin tones! MIT research showed error rates of 1 percent for light-skinned men — but 35 percent for dark-skinned women. Why? The training data had far more light-skinned faces. When this AI is used by police to identify suspects, the consequences of errors are devastating!",
      "When a self-driving car causes an accident, who is at fault? The passenger? The company that built the AI? The programmer? The dataset curator? This question has no easy answer — and courts around the world are still figuring it out! AI creates entirely new legal and ethical questions that humanity has never faced before!",
      "Modern AI — especially deep learning — is a black box. Even its creators can't fully explain WHY it makes certain decisions! This is terrifying when AI decides credit scores, medical diagnoses, or criminal sentences. A doctor can explain their reasoning. An AI often cannot. Explainable AI is a whole field trying to solve this!",
      "Governments are now writing laws for AI! The EU's AI Act is the world's first comprehensive AI law — banning some AI uses entirely and requiring transparency for others. China, the US, and the UK are developing their own frameworks. Getting these rules right will determine whether AI helps or harms humanity!",
      "Here's the most important message: AI ethics isn't just for engineers — it needs philosophers, lawyers, artists, scientists, and people from every background! The decisions about how AI is built, trained, and regulated will affect every human on Earth. YOUR perspective — your values, your culture, your voice — matters in shaping fair AI!",
      "COMPAS, an AI used by US courts to predict reoffending, was found to be twice as likely to falsely flag Black defendants as high-risk compared to white defendants. 🔍 Over 60% of people it labeled high-risk did NOT reoffend. This is AI with real consequences — which is why ethics, diversity in tech teams, and accountability matter enormously!",
      "What is AI bias? AI bias occurs when an AI system produces unfair outcomes due to flawed assumptions in training data or the algorithm itself — often reflecting existing human prejudices!",
      "What is the black box problem in AI? The black box problem means AI makes decisions that even its creators can't fully explain — making it difficult to understand why it produced a specific output!",
      "What is the EU's AI Act? The EU's AI Act is the world's first comprehensive AI regulation — banning high-risk AI uses and requiring transparency and accountability for AI systems affecting people's rights!",
      "AI Ethics Champion! You understand the most important questions about how AI should be built and governed. The future of fair AI needs thinkers like you!",
    ]},
  ];

  interface TechAudioItem {
    bucket: string;
    path: string;
    text: string;
    label: string;
  }

  const items: TechAudioItem[] = [];
  for (const lesson of TECH_SLIDES) {
    for (let i = 0; i < lesson.slides.length; i++) {
      const text = lesson.slides[i]!.trim();
      if (!text) continue;
      items.push({
        bucket: "lessons-audio",
        path: `tech/${lesson.id}/slide-${i}-en`,
        text,
        label: `${lesson.id} slide ${i}`,
      });
    }
  }

  const total = items.length;
  let progress = 0;
  let succeeded = 0;
  let failed = 0;

  sseWrite(res, { progress: 0, total, message: `Starting tech audio: ${total} slides...` });

  await runConcurrent(items, 3, async (item) => {
    try {
      await generateAndStore(item.bucket, item.path, item.text, LESSON_LANG_EN, "-5%", "+0Hz");
      succeeded++;
    } catch {
      failed++;
    }
    progress++;
    if (progress % 10 === 0 || progress === total) {
      sseWrite(res, {
        progress, total, succeeded, failed,
        percent: Math.round((progress / total) * 100),
        message: item.label,
      });
    }
  });

  sseWrite(res, { progress: total, total, succeeded, failed, done: true, message: `Tech audio complete! ${succeeded} generated, ${failed} failed.` });
  res.end();
});

export default router;
