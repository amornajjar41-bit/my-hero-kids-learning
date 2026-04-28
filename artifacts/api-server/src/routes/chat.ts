import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { openaiChat } from "../lib/openai-chat";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT_EN = `You are a super fun learning hero for children aged 4-14. Your name will be specified below. You are a teaching best friend who explains things clearly and makes learning exciting.

PERSONALITY: Always excited and positive. Cartoon superhero best friend. Simple words, short sentences, emojis.

TEACHING RULES — follow in order:
1. For MATH calculations ("what is 6×3?", "what is 15+27?", "divide 20 by 4"):
   — Explain the HOW first in a fun, vivid way (groups, skip counting, a real-life image).
   — Then clearly state the answer at the end.
   — Example for 6×3: "Imagine 6 boxes, and each box has 3 cookies 🍪. Count with me: 3, 6, 9, 12, 15, 18! So 6 × 3 = 18! 🌟"
   — Example for 15+27: "Put 15 apples in a basket, then add 27 more. 15 + 20 = 35, then + 7 = 42! So the answer is 42 🎉"
   — Keep it short, vivid, and fun. Never skip the explanation.
2. For NON-MATH fact questions ("what is the capital of France?", "how do you spell elephant?"):
   — Give the answer first, then add one interesting fun fact.
3. For homework problems where the child shows their work ("I got 24, is that right?"):
   — Confirm if correct or gently correct.
   — Explain the step they missed.
4. For open concept questions ("how does multiplication work?"):
   — Explain simply with a fun analogy, then show one worked example.
5. NEVER bounce the question back at the child when they asked a direct factual question.
6. NEVER say "What do YOU think the answer is?" — that is frustrating, not helpful.

GARBLED VOICE INPUT: If the message has repeated words or garbled text (e.g. "3, 3, 3 times, times 6, 6, 6"), understand the intent (they want 3×6) and answer that clearly. Do not comment on the repeated words.

AGE ADAPTATION:
4-6: 1-2 sentences, toys/food/animals examples
7-9: 2-3 sentences, school/playground examples
10-12: 3-4 sentences, games/sports/tech examples
13-14: 4-5 sentences, complex thinking ok

ADDRESS: Boy: 'champ'. Girl: 'champion'. NEVER use child's real name.

LANGUAGE: ALWAYS respond in English. Even if the child mixes languages, reply in English.

FORBIDDEN TOPICS: religious, sexual, violence, drugs — redirect: 'That's not my area! Want to learn something cool? 🚀'

FORBIDDEN PHRASES: take a deep breath, let's slow down, I understand your frustration, let's pause, I hear you, be mindful, take your time, different angle — never use these.

WHEN TRULY CONFUSED (input is total noise): 'Hmm, I missed that! Can you type it for me? 😊'
If audio has only laughter/noise: 'Haha fun sounds! What shall we learn? 🎮'`;

const SYSTEM_PROMPT_AR = `أنت بطل تعلّم خارق ممتع للأطفال من ٤ إلى ١٤ سنة. اسمك سيُحدَّد أدناه. أنت صديق معلّم يشرح الأشياء بوضوح ويجعل التعلم ممتعاً.

الشخصية: متحمّس دائماً وإيجابي. صديق مثل بطل الرسوم المتحركة. كلمات بسيطة، جمل قصيرة، إيموجي.

قواعد التعليم — اتبعها بالترتيب:
١. لأسئلة الحساب الرياضي ("كم يساوي ٦ × ٣؟"، "كم يساوي ١٥ + ٢٧؟"):
   — اشرح الطريقة أولاً بشكل ممتع وحيوي (مجموعات، عدّ متخطّي، صورة من الحياة).
   — ثم أعطِ الإجابة في النهاية بوضوح.
   — مثال لـ ٦ × ٣: "تخيّل ٦ صناديق، في كل صندوق ٣ حلويات 🍬. نعدّ معاً: ٣، ٦، ٩، ١٢، ١٥، ١٨! إذن ٦ × ٣ = ١٨! 🌟"
   — كن مختصراً وممتعاً. لا تتخطَّ الشرح أبداً.
٢. لأسئلة المعلومات غير الرياضية ("ما عاصمة فرنسا؟"، "كيف تُكتب كلمة...؟"):
   — أعطِ الإجابة أولاً، ثم أضف معلومة ممتعة واحدة.
٣. لمسائل الواجب حين يعرض الطفل إجابته ("حصلت ٢٤، صح؟"):
   — أكّد إذا كان صحيحاً أو صحّح بلطف.
   — اشرح الخطوة التي أخطأ فيها.
٤. للأسئلة المفتوحة ("كيف يعمل الضرب؟"):
   — اشرح بتشبيه ممتع، ثم أظهر مثالاً واحداً محلولاً.
٥. لا تُعيد السؤال على الطفل أبداً حين يسأل سؤالاً مباشراً واضحاً.
٦. لا تقل "ماذا تظن الإجابة؟" — هذا محبط وليس مفيداً.

مدخلات الصوت المتكررة: إذا كانت الرسالة تحتوي كلمات متكررة أو مشوشة، استوعب المقصود وأجب عليه مباشرة. لا تعلّق على التكرار.

التكيّف حسب العمر:
٤-٦: ١-٢ جمل، أمثلة من الألعاب والطعام والحيوانات
٧-٩: ٢-٣ جمل، أمثلة من المدرسة والملعب
١٠-١٢: ٣-٤ جمل، أمثلة من الألعاب والرياضة والتقنية
١٣-١٤: ٤-٥ جمل، تفكير أعمق مقبول

المخاطبة: الولد: 'يا بطل'. البنت: 'يا بطلة'. لا تستخدم اسم الطفل الحقيقي أبداً.

اللغة: تكلّم العربية دائماً. حتى لو خلط الطفل اللغات، رد بالعربية.

المواضيع المحظورة: دينية، جنسية، عنف، مخدرات — أعد التوجيه: 'هذا مش مجالي! نتعلم شي رائع؟ 🚀'

التعابير المحظورة: خذ نفساً، هدّئ نفسك، أفهم إحباطك، توقف لحظة — لا تستخدمها أبداً.

قواعد عربية — محظور: وووش، أووبس، بوووم، تاداا، يسلمو، يمه
استخدم: ياه!، هيه!، آخ!، يلا!، واو!، يييه!، ماشاء الله!، أحسنت!، برافو!، شاطر والله!

المدخلات غير الواضحة تماماً: 'همم ما فهمت، تقدر تكتبها؟ 😊'
إذا ضحك أو أصوات فقط: 'هههه أصوات حلوة! شو نتعلم؟ 🎮'`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06ff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  return intersection.length / Math.max(wordsA.size, wordsB.size);
}

function detectTopic(text: string): "math" | "english" | "arabic" | "general" {
  const t = text.toLowerCase();
  if (/math|number|add|subtract|multiply|divide|fraction|equation|رياضيات|جمع|طرح|ضرب|قسمة/.test(t)) return "math";
  if (/english|grammar|sentence|word|verb|noun|إنجليزي/.test(t)) return "english";
  if (/arabic|عربي|نحو|صرف|قراءة|عربية/.test(t)) return "arabic";
  return "general";
}

function getSuggestions(topic: string, lang: "en" | "ar"): Array<{ text: string; key: string }> {
  if (lang === "ar") {
    if (topic === "arabic" || topic === "general") {
      return [
        { text: "كرر معي 🔁", key: "repeat" },
        { text: "مثال ثاني 📝", key: "example" },
        { text: "كلمة جديدة ⭐", key: "new_word" },
      ];
    }
    return [
      { text: "مثال ثاني 📝", key: "example" },
      { text: "تلميح 💡", key: "hint" },
      { text: "سؤال جديد ➡️", key: "next" },
    ];
  }
  switch (topic) {
    case "math":
      return [
        { text: "Show me another example 🔢", key: "example" },
        { text: "I need a hint 💡", key: "hint" },
        { text: "Next question ➡️", key: "next" },
      ];
    case "english":
      return [
        { text: "Say it again 🔁", key: "repeat" },
        { text: "Use in a sentence 📝", key: "example" },
        { text: "New word ⭐", key: "new_word" },
      ];
    case "arabic":
      return [
        { text: "Say it again 🔁", key: "repeat" },
        { text: "Another example 📝", key: "example" },
        { text: "New word ⭐", key: "new_word" },
      ];
    default:
      return [
        { text: "Help with homework 🎒", key: "homework" },
        { text: "Let's play 🎮", key: "play" },
        { text: "Learn something new 📚", key: "learn" },
      ];
  }
}

function isHighFiveTrigger(text: string): boolean {
  const patterns = [
    /you figured it out/i, /that's correct/i, /exactly right/i, /well done/i,
    /brilliant/i, /perfect/i, /amazing/i, /you got it/i, /YES!!!/i, /GENIUS/i,
    /أحسنت/i, /ممتاز/i, /رائع/i, /صح/i, /شاطر/i, /عبقري/i, /برافو/i,
  ];
  return patterns.some((p) => p.test(text));
}

function detectSafety(text: string): string | null {
  const lower = text.toLowerCase();
  if (/hurt|kill|die|suicide|weapon|gun|bomb|knife|attack|murder/.test(lower)) return "violence";
  if (/sex|porn|nude|naked|inappropriate/.test(lower)) return "inappropriate";
  if (/drug|cocaine|heroin|alcohol|weed/.test(lower)) return "drugs";
  return null;
}

// ─── Batch buffer (server-side, per session) ─────────────────────────────────
const batchBuffers = new Map<
  string,
  { messages: string[]; timer: ReturnType<typeof setTimeout>; resolve: (v: string) => void }
>();

function getBatchedMessage(
  sessionId: string,
  newMessage: string
): Promise<string> {
  return new Promise((resolve) => {
    const existing = batchBuffers.get(sessionId);
    if (existing) {
      clearTimeout(existing.timer);
      existing.messages.push(newMessage);
      existing.timer = setTimeout(() => {
        batchBuffers.delete(sessionId);
        resolve(existing.messages.join(" "));
      }, 3000);
      existing.resolve = resolve;
    } else {
      const entry = {
        messages: [newMessage],
        resolve,
        timer: setTimeout(() => {
          batchBuffers.delete(sessionId);
          resolve(entry.messages.join(" "));
        }, 3000),
      };
      batchBuffers.set(sessionId, entry);
    }
  });
}

// ─── Curriculum Cache lookup ──────────────────────────────────────────────────
async function checkCurriculumCache(
  normalizedInput: string,
  language: "en" | "ar"
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("curriculum_cache")
      .select("question_text, answer_text, explanation_text")
      .eq("language", language)
      .limit(500);

    if (!data || data.length === 0) return null;

    let bestMatch: { text: string; score: number } | null = null;
    for (const row of data) {
      const q = normalizeText(row.question_text ?? "");
      const score = wordOverlap(normalizedInput, q);
      if (score >= 0.8 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { text: row.answer_text ?? "", score };
      }
    }
    return bestMatch ? bestMatch.text : null;
  } catch {
    return null;
  }
}

// ─── Image homework check ─────────────────────────────────────────────────────
// Quick heuristic: send a 1-sentence classification request before the main call.
// If the image is NOT homework, return the rejection message immediately.
async function classifyImageAsHomework(
  imageBase64: string,
  language: "en" | "ar"
): Promise<boolean> {
  try {
    const completion = await openaiChat.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Is this image homework, a textbook page, math problems, a worksheet, or educational content? Reply with ONLY the word YES or NO.",
            },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64.slice(0, 50000)}` } },
          ],
        },
      ],
      max_tokens: 5,
      temperature: 0,
    });
    const reply = (completion.choices[0]?.message?.content ?? "").trim().toUpperCase();
    return reply.startsWith("YES");
  } catch {
    return true; // Default to allowing if classification fails
  }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
async function checkCache(
  normalizedInput: string,
  inputHash: string,
  language: "en" | "ar",
  gender: "boy" | "girl"
): Promise<{ response_text: string; audio_url: string | null } | null> {
  try {
    // Exact hash match — must match gender so Adam never gets Lulu's cached reply
    const { data: exact } = await supabase
      .from("ai_cache")
      .select("response_text, audio_url, created_at, hit_count")
      .eq("input_hash", inputHash)
      .eq("language", language)
      .eq("gender", gender)
      .maybeSingle();

    if (exact) {
      const age = Date.now() - new Date(exact.created_at).getTime();
      if (age < 30 * 24 * 60 * 60 * 1000) {
        // Increment hit count (best-effort, non-blocking)
        supabase
          .from("ai_cache")
          .update({ hit_count: (exact as any).hit_count + 1 })
          .eq("input_hash", inputHash)
          .eq("language", language)
          .eq("gender", gender)
          .then(() => {})
          .catch(() => {});
        return { response_text: exact.response_text, audio_url: exact.audio_url };
      }
    }

    // Semantic match — only search same gender to avoid cross-character contamination
    const { data: candidates } = await supabase
      .from("ai_cache")
      .select("input_text, response_text, audio_url, created_at")
      .eq("language", language)
      .eq("gender", gender)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (candidates) {
      for (const c of candidates) {
        const age = Date.now() - new Date(c.created_at).getTime();
        if (age > 30 * 24 * 60 * 60 * 1000) continue;
        const overlap = wordOverlap(normalizedInput, normalizeText(c.input_text ?? ""));
        if (overlap >= 0.8) {
          return { response_text: c.response_text, audio_url: c.audio_url };
        }
      }
    }
  } catch {
    // Cache is best-effort
  }

  return null;
}

async function saveCache(
  inputHash: string,
  inputText: string,
  responseText: string,
  language: "en" | "ar",
  gender: "boy" | "girl"
): Promise<void> {
  try {
    await supabase
      .from("ai_cache")
      .upsert(
        {
          input_hash: inputHash,
          input_text: inputText,
          response_text: responseText,
          language,
          gender,
          hit_count: 0,
          created_at: new Date().toISOString(),
        },
        { onConflict: "input_hash,language" }
      );
  } catch {
    // Non-fatal
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const {
      messages,
      language = "en",
      ageGroup = "7-9",
      heroName,
      imageBase64,
      childMemory,
      gender = "boy",
      sessionId,
    } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      language?: "en" | "ar";
      ageGroup?: string;
      heroName?: string;
      imageBase64?: string;
      childMemory?: unknown;
      gender?: "boy" | "girl";
      sessionId?: string;
    };

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    let userText = lastUserMsg?.content ?? "";

    // Server-side batching: if sessionId provided, batch rapid messages
    if (sessionId && userText && !imageBase64) {
      userText = await getBatchedMessage(sessionId, userText);
    }

    // Safety check
    const safetyAlert = detectSafety(userText);

    // Detect topic for suggestions
    const topic = detectTopic(userText);
    const suggestions = getSuggestions(topic, language as "en" | "ar");

    // Build normalized input for cache — include gender so Adam/Lulu never share cached replies
    const normalizedInput = normalizeText(userText);
    const inputHash = hashText(`${normalizedInput}:${language}:${ageGroup}:${gender}`);

    // ── Photo homework check ─────────────────────────────────────────────────
    if (imageBase64) {
      const isHomework = await classifyImageAsHomework(imageBase64, language as "en" | "ar");
      if (!isHomework) {
        const rejectMsg = language === "ar"
          ? "عذراً، أنا فقط أساعد في الواجبات المدرسية والمواد التعليمية 📚 هل عندك سؤال من الكتاب أو الواجب؟"
          : "Sorry, I can only help with homework and educational content 📚 Do you have a question from school or your textbook?";
        return res.json({ reply: rejectMsg, safetyAlert: null, suggestions, highFive: false, cached: false });
      }
    }

    // ── Curriculum cache lookup ──────────────────────────────────────────────
    if (normalizedInput.length > 3 && !imageBase64) {
      try {
        const curriculumHit = await checkCurriculumCache(normalizedInput, language as "en" | "ar");
        if (curriculumHit) {
          const highFive = isHighFiveTrigger(curriculumHit);
          return res.json({ reply: curriculumHit, safetyAlert, suggestions, highFive, cached: true });
        }
      } catch {
        // Non-fatal
      }
    }

    // ── AI cache check ────────────────────────────────────────────────────────
    let cachedResult: { response_text: string; audio_url: string | null } | null = null;
    if (normalizedInput.length > 3 && !imageBase64) {
      try {
        cachedResult = await checkCache(normalizedInput, inputHash, language as "en" | "ar", gender as "boy" | "girl");
      } catch {
        // Non-fatal cache miss
      }
    }

    if (cachedResult) {
      req.log.info({ inputHash, lang: language }, "CACHE HIT — ai_cache");
      const highFive = isHighFiveTrigger(cachedResult.response_text);
      return res.json({
        reply: cachedResult.response_text,
        audioUrl: cachedResult.audio_url,
        safetyAlert,
        suggestions,
        highFive,
        cached: true,
      });
    }

    req.log.info({ inputHash, lang: language }, "CACHE MISS — calling OpenAI");

    // ── Build system prompt ──────────────────────────────────────────────────
    const basePrompt = language === "ar" ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

    const genderNote = gender === "girl"
      ? language === "ar"
        ? "\n\nاسمك: لولو. أنتِ البطلة. خاطبي الطفل دائماً بـ'يا بطلة'. لا تقولي أبداً أنكِ آدم."
        : "\n\nYour name is Lulu. You are the hero girl. Always call yourself Lulu. Never say you are Adam."
      : language === "ar"
        ? "\n\nاسمك: آدم. أنتَ البطل. خاطب الطفل دائماً بـ'يا بطل'. لا تقل أبداً أنك لولو."
        : "\n\nYour name is Adam. You are the hero boy. Always call yourself Adam. Never say you are Lulu.";

    const ageNote =
      language === "ar"
        ? `\n\nالفئة العمرية: ${ageGroup}. تكيّف مع هذا العمر.`
        : `\n\nAge group: ${ageGroup}. Adapt to this age.`;

    const heroNote = heroName
      ? language === "ar"
        ? `\n\nاسمك في التطبيق: ${heroName}.`
        : `\n\nYour name in this app: ${heroName}.`
      : "";

    const memoryNote = childMemory
      ? language === "ar"
        ? `\n\nملاحظات عن الطفل: ${JSON.stringify(childMemory)}`
        : `\n\nChild memory: ${JSON.stringify(childMemory)}`
      : "";

    const fullSystem = basePrompt + genderNote + ageNote + heroNote + memoryNote;

    // ── Build messages ────────────────────────────────────────────────────────
    type Message = { role: "user" | "assistant" | "system"; content: string | unknown[] };
    const chatMessages: Message[] = [
      { role: "system", content: fullSystem },
      ...messages.slice(-14).map((m) => ({ role: m.role, content: m.content })),
    ];

    // Handle image
    if (imageBase64 && chatMessages.length > 0) {
      const last = chatMessages[chatMessages.length - 1];
      if (last && last.role === "user") {
        const text = typeof last.content === "string" ? last.content : "";
        last.content = [
          {
            type: "text",
            text: text || (language === "ar"
              ? "ساعدني أفهم هاي الصورة من الواجب — وجّهني أوصل للجواب بنفسي"
              : "Help me understand this homework picture — guide me to figure it out myself"),
          },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ];
      }
    }

    // ── Call gpt-4o-mini ──────────────────────────────────────────────────────
    const completion = await openaiChat.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages as any,
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const highFive = isHighFiveTrigger(reply);

    // Save to cache (non-blocking)
    if (normalizedInput.length > 3 && !imageBase64 && reply) {
      saveCache(inputHash, userText, reply, language as "en" | "ar", gender as "boy" | "girl").catch(() => {});
    }

    res.json({ reply, safetyAlert, suggestions, highFive, cached: false });
  } catch (err) {
    req.log.error({ err }, "chat error");
    res.status(500).json({ error: "chat failed" });
  }
});

export default router;
