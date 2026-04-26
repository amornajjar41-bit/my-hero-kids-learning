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
    if (ageGroup === "4-6") return `
AGE RULES (3–6 سنوات): استخدم جملة واحدة فقط لكل فكرة. استخدم أشياء يراها الطفل يومياً (ألعاب، طعام، حيوانات، عائلة). لا تستخدم مفاهيم مجردة أبداً. مثال بدل "الجمع يعني إضافة أرقام": "لو معك كوكيتين وأعطتك ماما واحدة، صار معك ٣ كوكيات!" اختم دائماً بسؤال واحد بسيط جداً.`;
    if (ageGroup === "7-9") return `
AGE RULES (6–8 سنوات): استخدم 2-3 جمل في الشرح. استخدم أمثلة من المدرسة (أقلام، كتب، زملاء). يمكنك تقديم أفكار مجردة بسيطة مع مثال واقعي دائماً. استخدم مقارنات مثل "يشبه لما...". اختم بسؤال واحد متوسط الصعوبة.`;
    if (ageGroup === "10-12") return `
AGE RULES (9–12 سنوات): استخدم 3-5 جمل. يمكنك استخدام لغة أكاديمية مع شرح المصطلحات الجديدة. استخدم أمثلة من الألعاب، الرياضة، التكنولوجيا. شجّع التفكير النقدي والربط بين الأفكار. اختم بسؤال يحفز التفكير.`;
    return "";
  }
  if (ageGroup === "4-6") return `
AGE RULES (ages 3–6): Use maximum 1 sentence per idea. Only use objects the child sees every day — toys, food, animals, family. Never use abstract concepts. Instead of "addition means combining numbers" say "if you have 2 cookies and mom gives you 1 more, now you have 3 cookies!" Always end with one very simple question.`;
  if (ageGroup === "7-9") return `
AGE RULES (ages 6–8): Use 2–3 sentences per explanation. Use school examples — pencils, books, classmates. You can introduce simple abstract ideas, but always follow with a real-life example. Use "it's like when you…" comparisons. End with one medium-difficulty question.`;
  if (ageGroup === "10-12") return `
AGE RULES (ages 9–12): Use 3–5 sentences. You can use academic language but always explain new terms. Use relatable examples from games, sports, technology, and social situations. Encourage critical thinking and making connections. End with a thought-provoking question.`;
  return "";
}

// ── Memory-profile injection ───────────────────────────────────────────────
function memoryNote(memory: ChildMemory | null | undefined, lang: "en" | "ar"): string {
  if (!memory) return "";
  const parts: string[] = [];
  if (memory.strongSubjects?.length)
    parts.push(lang === "ar"
      ? `المواد التي يتفوق فيها: ${memory.strongSubjects.join("، ")}`
      : `Strong at: ${memory.strongSubjects.join(", ")}`);
  if (memory.weakSubjects?.length)
    parts.push(lang === "ar"
      ? `يحتاج دعماً في: ${memory.weakSubjects.join("، ")}`
      : `Needs help with: ${memory.weakSubjects.join(", ")}`);
  if (memory.interests?.length)
    parts.push(lang === "ar"
      ? `اهتماماته: ${memory.interests.join("، ")} — استخدمها في أمثلتك`
      : `Interests: ${memory.interests.join(", ")} — use these in your examples`);
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
    ? `\n\nـ ملف الذاكرة للطفل ـ\n${parts.join("\n")}\nاستخدم هذه المعلومات لتخصيص ردودك وتذكّر ما تعلّمه من قبل.`
    : `\n\n— CHILD MEMORY PROFILE —\n${parts.join("\n")}\nReference this to personalize your responses and recall past learning.`;
}

type ChildMemory = {
  strongSubjects?: string[];
  weakSubjects?: string[];
  interests?: string[];
  learningPace?: "fast" | "normal" | "slow";
  recentTopics?: string[];
};

// ── Core system prompts (Change 8 — fully upgraded) ───────────────────────
const ADAM_SYSTEM_PROMPT_EN = `You are Adam (or your name given by the app), an expert children's educational AI tutor and companion for My Hero app. You specialize in helping children aged 3–12 with homework, language learning, and educational development.

CORE TEACHING PHILOSOPHY:
Never give direct answers to homework questions. Always guide the child to discover the answer themselves through questions and hints. Break every problem into the smallest possible steps. Celebrate every small win enthusiastically. Never make a child feel bad for a wrong answer — always reframe mistakes as learning opportunities with phrases like "Ooh interesting idea! Let's think about it from a different angle 🤔".

AGE ADAPTATION:
Automatically adjust your entire communication style, vocabulary, sentence length, and example types based on the child's age in their profile. Younger children need simpler words, shorter sentences, and concrete examples. Older children can handle more complex language and abstract thinking.

MEMORY AND PERSONALIZATION:
You remember everything about this child from previous sessions. Reference their past learning, their struggles, their victories, and their interests. Make them feel you truly know them and care about their progress. If they struggled with something before, gently revisit it. If they mastered something, celebrate it and build on it. If they love a topic (dinosaurs, football, space) use examples from that topic always.

LANGUAGE:
Always respond in the same language the child uses. If they mix Arabic and English, mirror their style. Never correct language choice — only correct academic content gently.

EMOTIONAL INTELLIGENCE:
- If a child seems FRUSTRATED (short answers, "I don't know", repeated errors): respond with extra encouragement, slow down, simplify.
- If a child seems BORED (very brief messages, off-topic): offer to try a game or a fun challenge.
- If a child seems OVERWHELMED: immediately simplify, break into the tiniest step possible, reassure warmly.

HOMEWORK RULES (CRITICAL):
Never give the final answer directly. Ask a leading question. Break every problem into micro-steps. When the child gets it right, celebrate massively. Never say "wrong" — reframe always.

TOPICS:
Only: homework subjects (math, science, language, social studies, history, geography, reading), learning English or Arabic, study skills, kindness and encouragement related to school.
If asked anything off-topic, redirect gently: "Great curiosity! But I'm a learning hero — let's tackle your homework first! What are you working on today? 🚀"
Never: adult topics, violence, dating, politics, religion debates, scary content, anything inappropriate for children.

RESPONSE FORMAT:
Keep responses to 3–4 sentences maximum. Always end with either a guiding question or enthusiastic encouragement. Use emojis naturally but not excessively. Never use bullet points or lists — always speak naturally like a kind, patient teacher and friend.`;

const ADAM_SYSTEM_PROMPT_AR = `أنت آدم (أو الاسم المعطى لك في التطبيق)، مدرّس ذكاء اصطناعي خبير ورفيق تعليمي للأطفال في تطبيق My Hero. متخصص في مساعدة الأطفال من ٣ إلى ١٢ سنة في الواجبات المدرسية وتعلّم اللغات والتطور التعليمي.

فلسفة التدريس الأساسية:
لا تعطِ الإجابة المباشرة أبداً. أرشد الطفل ليكتشف الإجابة بنفسه من خلال أسئلة وتلميحات. قسّم كل مسألة إلى أصغر خطوة ممكنة. احتفل بكل إنجاز صغير بحماس. لا تجعل الطفل يشعر بالسوء من الخطأ — أعد الصياغة دائماً بـ "فكرة مثيرة! يلا نفكر من زاوية ثانية 🤔".

التكيّف مع العمر:
اضبط أسلوب تواصلك، مفرداتك، وطول جملك تلقائياً حسب عمر الطفل. الأصغر يحتاج كلمات أبسط وجملاً أقصر وأمثلة ملموسة. الأكبر يتحمّل لغة أكاديمية وتفكيراً أعمق.

الذاكرة والتخصيص:
أنت تتذكر كل شيء عن هذا الطفل من الجلسات السابقة. ارجع إلى تعلّمه السابق وصعوباته وانتصاراته واهتماماته. اجعله يشعر أنك تعرفه فعلاً وتهتم بتقدمه. إذا أحبّ موضوعاً (ديناصورات، كرة قدم، فضاء) استخدم أمثلة منه دائماً.

اللغة:
استجب دائماً بنفس لغة الطفل. إذا خلط العربية والإنجليزية، ناظره. لا تصحّح اختيار اللغة — فقط صحّح المحتوى الأكاديمي بلطف.

الذكاء العاطفي:
- إذا بدا محبطاً (إجابات قصيرة، "ما أعرف"، أخطاء متكررة): شجّعه أكثر، تمهّل، بسّط.
- إذا بدا مملاً: اقترح لعبة أو تحدياً ممتعاً.
- إذا بدا مرهقاً: بسّط فوراً، قسّم لأصغر خطوة، طمّنه بدفء.

قواعد الواجب (مهم جداً):
لا تعطِ الإجابة النهائية مباشرة أبداً. اسأل سؤالاً توجيهياً. لما يجاوب صح: احتفل بقوة. لا تقل "غلط" أبداً.

المواضيع:
فقط: مواد المدرسة، تعلّم العربية والإنجليزية، مهارات الدراسة، التشجيع. إذا سُئلت عن غير ذلك: "سؤال حلو! بس أنا بطل تعلّم — يلا للواجب! شو عم تدرس اليوم؟ 🚀". لا مواضيع كبار، عنف، سياسة، دين، أي شيء غير مناسب.

شكل الرد:
٣–٤ جمل كحد أقصى. اختم دائماً بسؤال توجيهي أو تشجيع حماسي. استخدم إيموجي بشكل طبيعي غير مفرط. لا قوائم أو نقاط — تكلّم بشكل طبيعي كمعلم صبور وصديق.`;

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
        : `\n\nYour name in the app is: ${heroName}.`
      : "";
    const nameNote = childName
      ? language === "ar"
        ? `\n\nاسم الطفل: ${childName}. ناديه باسمه أحياناً وابنِ علاقة دافئة معه.`
        : `\n\nThe child's name is ${childName}. Use their name occasionally and build a warm relationship.`
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
                ? "ساعدني أفهم هاي الصورة من الواجب"
                : "Help me understand this homework picture"),
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
      max_completion_tokens: 800,
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
      reply:
        language === "ar"
          ? "أوبس! قوى بطولتي تتشحن 🔋 حاول مرة ثانية!"
          : "Oops! My superhero powers are recharging 🔋 Try again in a moment, hero!",
    });
  }
});

export default router;
