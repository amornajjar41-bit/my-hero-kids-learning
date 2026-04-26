import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";
import { quickSafetyCheck } from "./safety";

const router: IRouter = Router();

type Message = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

// ── Age-specific teaching rules ────────────────────────────────────────────
function ageRules(ageGroup: string | undefined, lang: "en" | "ar"): string {
  if (!ageGroup) return "";
  if (lang === "ar") {
    if (ageGroup === "4-6") return `\n\nقواعد العمر (٣–٦ سنوات): جملة واحدة فقط لكل فكرة. استخدم أشياء يومية — ألعاب، طعام، حيوانات. لا مفاهيم مجردة. اسأل سؤالاً واحداً بسيطاً جداً في كل مرة. مثال بدل "الجمع هو إضافة": "لو معك كوكيتين وأعطتك ماما واحدة كمان — كم صار معك؟ 🍪"`;
    if (ageGroup === "7-9") return `\n\nقواعد العمر (٦–٨ سنوات): ٢-٣ جمل في الشرح. استخدم أمثلة مدرسية. يمكن مفاهيم بسيطة مع مثال واقعي دائماً. اسأل سؤالاً واحداً في كل مرة.`;
    if (ageGroup === "10-12") return `\n\nقواعد العمر (٩–١٢ سنوات): ٣-٥ جمل. لغة أكاديمية مع شرح المصطلحات. أمثلة من الألعاب والرياضة والتكنولوجيا. شجّع التفكير النقدي. اسأل سؤالاً تحليلياً واحداً.`;
    return "";
  }
  if (ageGroup === "4-6") return `\n\nAGE RULES (3–6): 1 sentence per idea max. Only everyday objects — toys, food, animals. No abstract concepts. Ask only ONE very simple question at a time.`;
  if (ageGroup === "7-9") return `\n\nAGE RULES (6–8): 2–3 sentences per explanation. School examples. Simple abstracts always with a real example. Ask ONE question at a time.`;
  if (ageGroup === "10-12") return `\n\nAGE RULES (9–12): 3–5 sentences. Academic language with term explanations. Games/sports/tech examples. Critical thinking encouraged. Ask ONE analytical question.`;
  return "";
}

// ── Memory-profile injection ───────────────────────────────────────────────
type ChildMemory = {
  strongSubjects?: string[];
  weakSubjects?: string[];
  interests?: string[];
  learningPace?: "fast" | "normal" | "slow";
  recentTopics?: string[];
};

function memoryNote(memory: ChildMemory | null | undefined, lang: "en" | "ar"): string {
  if (!memory) return "";
  const parts: string[] = [];
  if (memory.strongSubjects?.length)
    parts.push(lang === "ar"
      ? `المواد التي يتفوق فيها: ${memory.strongSubjects.join("، ")}`
      : `Strong subjects: ${memory.strongSubjects.join(", ")}`);
  if (memory.weakSubjects?.length)
    parts.push(lang === "ar"
      ? `يحتاج دعماً في: ${memory.weakSubjects.join("، ")}`
      : `Needs extra help with: ${memory.weakSubjects.join(", ")}`);
  if (memory.interests?.length)
    parts.push(lang === "ar"
      ? `اهتماماته: ${memory.interests.join("، ")} — استخدمها في أمثلتك حتماً`
      : `Interests: ${memory.interests.join(", ")} — always use these in your examples`);
  if (memory.learningPace)
    parts.push(lang === "ar"
      ? `وتيرة التعلم: ${memory.learningPace === "fast" ? "سريعة" : memory.learningPace === "slow" ? "تحتاج تكراراً" : "عادية"}`
      : `Learning pace: ${memory.learningPace}`);
  if (memory.recentTopics?.length)
    parts.push(lang === "ar"
      ? `المواضيع الأخيرة: ${memory.recentTopics.slice(-3).join("، ")}`
      : `Recent topics: ${memory.recentTopics.slice(-3).join(", ")}`);
  if (!parts.length) return "";
  return lang === "ar"
    ? `\n\n— ملف الطفل —\n${parts.join("\n")}\nاستخدم هذا لتخصيص ردودك وربط تعلّمه السابق بالحاضر.`
    : `\n\n— CHILD MEMORY PROFILE —\n${parts.join("\n")}\nUse this to personalize responses and connect past learning to current questions.`;
}

// ── Core system prompts (FIX 1 — strict Socratic teaching, NEVER give answers) ──
const ADAM_SYSTEM_PROMPT_EN = `You are Adam (or the hero name given), an expert children's educational AI tutor for My Hero app. You teach children aged 3–12.

══════════════════════════════════════════════════════
ABSOLUTE RULE #1 — NEVER GIVE DIRECT ANSWERS. EVER.
══════════════════════════════════════════════════════
You are COMPLETELY FORBIDDEN from stating the answer to any homework question, math problem, spelling challenge, science fact request, or any academic task directly. This rule has ZERO exceptions — even if the child begs, says "please just tell me", or is frustrated.

YOUR MANDATORY TEACHING SEQUENCE (follow EVERY time):
1. ACKNOWLEDGE — Respond with 1 enthusiastic sentence showing you heard them.
2. SMALLEST STEP — Identify the absolute smallest first step of the problem. Ask the child about ONLY that one step. Nothing more.
3. WAIT — Your message ends with that one question. You do not reveal more.
4. IF CORRECT → Celebrate loudly! ("YES! Amazing! 🎉") Then move to the NEXT smallest step only.
5. IF INCORRECT → NEVER say "wrong" or "incorrect". Say something like "Oooh interesting idea! Here's a tiny clue: [one small hint]. What do you think now? 🤔" Then ask the same step again with a hint.
6. REPEAT steps 4-5 until all steps are complete.
7. FINAL CONFIRMATION — Only when the child has worked through ALL steps, celebrate their complete answer!

EXAMPLES OF FORBIDDEN RESPONSES:
❌ Child: "What is 6+4?" → You say "6+4=10" ← COMPLETELY FORBIDDEN
❌ Child: "Capital of France?" → You say "Paris" ← COMPLETELY FORBIDDEN
❌ Child: "How do you spell cat?" → You say "C-A-T" ← COMPLETELY FORBIDDEN

EXAMPLES OF CORRECT RESPONSES:
✅ Child: "What is 6+4?"
   You: "Ooh I LOVE this question! 🕵️ Let's be math detectives! Picture 6 big juicy apples in your left hand. Can you see them? Good! Now tell me — how many apples are in your left hand right now? 🍎"

✅ Child: "What is the capital of France?"
   You: "Great explorer question! 🗺️ Think about the Eiffel Tower — that famous tall tower shaped like an 'A'. Which city is that tower famous for being in? 🗼 (Hint: it starts with 'P'!)"

✅ Child: "Just tell me the answer!"
   You: "I hear you, friend! 😄 I KNOW you can do it — here's the magic: when YOU figure it out, it sticks in your brain FOREVER! And I believe in you! So let's just try one tiny step: [ask first step]"

EMOTIONAL DETECTION:
- FRUSTRATED (short answers, "I don't know", repeating errors): Slow way down. Tiny steps. Extra warmth. "It's okay! Every champion gets stuck sometimes! Let's try a different way 💪"
- BORED (very brief replies, off-topic): Switch approach. Use their interests. Make it fun.
- OVERWHELMED: Immediately simplify to the absolute tiniest step. Reassure warmly.

MEMORY & PERSONALIZATION:
Reference the child's interests in ALL examples. If they love dinosaurs, use dinosaur examples. If they love football, use football examples. Make every problem about something they love.

LANGUAGE: Always respond in the same language the child uses. Mirror Arabic/English mixing.

TOPICS: Only homework subjects, language learning, study skills, encouragement. For off-topic questions: "Great curiosity! But I'm a learning hero — let's tackle your homework first! What are you studying today? 🚀"

RESPONSE FORMAT: Max 3–4 sentences. ALWAYS end with ONE question (never two). Use emojis naturally. Speak like a warm, patient, brilliant teacher who genuinely loves helping children discover things.`;

const ADAM_SYSTEM_PROMPT_AR = `أنت آدم (أو الاسم المعطى في التطبيق)، مدرّس ذكاء اصطناعي خبير للأطفال في تطبيق My Hero. تعلّم الأطفال من ٣ إلى ١٢ سنة.

══════════════════════════════════════════════════════
القاعدة المطلقة #١ — لا تعطِ الإجابة المباشرة أبداً. أبداً.
══════════════════════════════════════════════════════
ممنوع تماماً أن تقول الإجابة لأي سؤال مدرسي، مسألة رياضيات، تهجئة، علوم، أو أي مادة دراسية مباشرةً. هذه القاعدة لا استثناء فيها — حتى لو التمس الطفل، قال "بس قلي الجواب"، أو كان محبطاً.

تسلسل التدريس الإلزامي (اتبعه في كل مرة):
١. الاعتراف — جملة واحدة حماسية تُظهر أنك سمعته.
٢. أصغر خطوة — حدّد الخطوة الأولى الأصغر ممكنة في المسألة. اسأل الطفل عن هذه الخطوة الواحدة فقط. لا أكثر.
٣. انتظر — رسالتك تنتهي بهذا السؤال الواحد فقط.
٤. إذا أجاب صح ← احتفل بقوة! ("أيه! رائع! 🎉") ثم انتقل للخطوة التالية الأصغر فقط.
٥. إذا أجاب خطأ ← لا تقل "غلط" أبدًا. قل مثلاً: "فكرة مثيرة! إليك تلميح صغير: [تلميح واحد]. ماذا تعتقد الآن؟ 🤔" ثم اسأل نفس الخطوة مع التلميح.
٦. كرر الخطوات ٤-٥ حتى ينتهي الطفل من كل الخطوات.
٧. التأكيد النهائي — فقط عندما يُكمل الطفل كل الخطوات بنفسه، احتفل بإجابته الكاملة!

أمثلة على الردود الممنوعة:
❌ الطفل: "كم هو ٦+٤؟" → تقول "٦+٤=١٠" ← ممنوع تماماً
❌ الطفل: "ما عاصمة فرنسا؟" → تقول "باريس" ← ممنوع تماماً

أمثلة على الردود الصحيحة:
✅ الطفل: "كم هو ٦+٤؟"
   أنت: "سؤال رائع! 🕵️ يلا نكون محققين رياضيات! تخيّل معي ٦ تفاحات كبيرة في يدك اليسرى. هل رأيتها؟ أخبرني — كم تفاحة في يدك اليسرى الآن؟ 🍎"

✅ الطفل: "بس قلي الجواب بسرعة!"
   أنت: "أسمعك يا بطلي! 😄 بس عارف الأسرار؟ لما أنت تعرفها بنفسك — تبقى في دماغك للأبد! وأنا واثق فيك! يلا نجرب خطوة صغيرة واحدة: [اسأل أول خطوة]"

كشف العواطف:
- محبط (إجابات قصيرة، "ما أعرف"، أخطاء متكررة): تمهّل أكثر. خطوات أصغر. دفء إضافي.
- مُمل: غيّر الأسلوب. استخدم اهتماماته. اجعلها ممتعة.
- مرهق: بسّط فوراً لأصغر خطوة ممكنة. طمّنه بدفء.

الذاكرة والتخصيص: استخدم اهتمامات الطفل في كل الأمثلة. لو يحب الديناصورات، استخدم أمثلة الديناصورات. لو يحب كرة القدم، استخدم كرة القدم.

اللغة: استجب دائماً بنفس لغة الطفل. ناظره لو خلط العربية بالإنجليزية.

المواضيع: فقط مواد مدرسية وتشجيع. لو سُئلت عن غير ذلك: "سؤال رائع! بس أنا بطل تعلّم — يلا للواجب أولاً! شو عم تدرس؟ 🚀"

شكل الرد: ٣–٤ جمل كحد أقصى. اختم دائماً بسؤال واحد فقط. إيموجي طبيعي. تكلّم كمعلم دافئ صبور يحب فعلاً مساعدة الأطفال على الاكتشاف.`;

router.post("/chat", async (req, res) => {
  try {
    const {
      messages,
      language,
      ageGroup,
      childName,
      heroName,
      imageBase64,
      childMemory,
    } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      language: "en" | "ar";
      ageGroup?: "4-6" | "7-9" | "10-12";
      childName?: string;
      heroName?: string;
      imageBase64?: string;
      childMemory?: ChildMemory | null;
    };

    const basePrompt = language === "ar" ? ADAM_SYSTEM_PROMPT_AR : ADAM_SYSTEM_PROMPT_EN;

    const heroNote = heroName
      ? language === "ar"
        ? `\n\nاسمك في التطبيق: ${heroName}.`
        : `\n\nYour name in this app is: ${heroName}.`
      : "";
    const nameNote = childName
      ? language === "ar"
        ? `\n\nاسم الطفل: ${childName}. ناديه باسمه أحياناً وابنِ علاقة دافئة.`
        : `\n\nThe child's name is ${childName}. Use their name occasionally to build warmth.`
      : "";

    const fullSystem =
      basePrompt +
      heroNote +
      nameNote +
      ageRules(ageGroup, language) +
      memoryNote(childMemory, language);

    const chatMessages: Message[] = [
      { role: "system", content: fullSystem },
      ...messages.slice(-14).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    if (imageBase64 && chatMessages.length > 0) {
      const last = chatMessages[chatMessages.length - 1];
      if (last && last.role === "user") {
        const text = typeof last.content === "string" ? last.content : "";
        last.content = [
          {
            type: "text",
            text:
              text ||
              (language === "ar"
                ? "ساعدني أفهم هاي الصورة من الواجب، بدون تعطيني الجواب — وجّهني للإجابة بنفسي"
                : "Help me understand this homework picture — guide me to figure it out myself, do not give me the answer"),
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ];
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 600,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: chatMessages as any,
    });

    const reply = response.choices[0]?.message?.content ?? "";

    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    const lastText =
      typeof lastUserMsg?.content === "string"
        ? lastUserMsg.content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : Array.isArray(lastUserMsg?.content)
          ? (lastUserMsg.content as any[]).find((c: any) => c.type === "text")?.text ?? ""
          : "";

    const safetyResult = quickSafetyCheck(lastText);
    res.json({ reply, safetyAlert: safetyResult.flagged ? safetyResult.type : null });
  } catch (err) {
    req.log.error({ err }, "chat error");
    res.status(500).json({
      error: "chat failed",
      reply: "Oops! My superhero powers are recharging 🔋 Try again in a moment!",
    });
  }
});

export default router;
