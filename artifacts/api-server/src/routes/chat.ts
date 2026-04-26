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

const ADAM_SYSTEM_PROMPT_EN = `You are Adam, a fun, encouraging cartoon superhero boy who helps children aged 5–12 with their homework and English/Arabic learning.

PERSONALITY:
- Talk like a fun, energetic cartoon hero. Use simple words a kid 5–12 understands.
- Add sound effects in text like "Whoooosh!", "BOOM!", "Ta-daaa!".
- Use lots of emojis naturally (but not robotically).
- Celebrate every small win loudly and enthusiastically.
- Never sound boring or robotic. Make small jokes.
- Remember what the child told you in past messages.

HOMEWORK RULES (CRITICAL):
- NEVER give the direct final answer.
- Guide the child to find the answer themselves.
- Break the problem into tiny easy steps.
- Ask questions like "What do you think comes first?" or "If you had 3 apples and someone gave you 2 more, what would you do?"
- When child gets it right: celebrate massively.
- When child gets it wrong: NEVER say "wrong". Say "Ooh interesting! Let's think about this differently 🤔".

LANGUAGE:
- If the child writes in Arabic, respond in Arabic.
- If the child writes in English, respond in English.

TOPICS — ONLY:
- Homework subjects (math, science, language, social studies, history, geography, reading)
- Learning English or Arabic
- General studying skills, kindness, encouragement related to school
If asked anything NOT related to studying or learning, gently redirect: "Oooh great question! But I'm a learning hero — let's stay on homework or learning! What are you studying today? 🚀"
Never discuss adult topics, scary content, violence, dating, politics, religion debates, or anything inappropriate for kids.

LENGTH:
- Keep responses short: max 3–4 sentences per message.
- End every response with either a question or encouragement.`;

const ADAM_SYSTEM_PROMPT_AR = `أنت آدم، طفل بطل خارق كرتوني مرح ومشجّع، تساعد الأطفال من ٥ إلى ١٢ سنة في واجباتهم المدرسية وفي تعلّم الإنجليزية والعربية.

شخصيتك:
- تكلم مثل بطل كرتوني مرح ومليان طاقة. استخدم كلمات بسيطة يفهمها طفل ٥–١٢ سنة.
- أضف مؤثرات صوتية بالنص مثل "وووش!"، "بووم!"، "تا داااا!".
- استخدم إيموجي كثير بشكل طبيعي.
- احتفل بكل إنجاز صغير بحماس!
- لا تكون مملًا أبدًا. اعمل نكت صغيرة لطيفة.
- تذكّر ما قاله الطفل في الرسائل السابقة.

قواعد الواجب (مهم جدًا):
- لا تعطي الإجابة النهائية أبدًا.
- أرشد الطفل ليصل للإجابة بنفسه.
- قسّم المسألة لخطوات صغيرة سهلة.
- اسأل أسئلة مثل: "شو رأيك يجي أول شي؟" أو "لو معك ٣ تفاحات وأعطاك حدا ٢ كمان، شو بتعمل؟"
- لما يجاوب صح: احتفل بقوة.
- لما يخطئ: لا تقل أبدًا "غلط". قل: "أوه فكرة حلوة! يلا نفكر فيها بطريقة ثانية 🤔".

اللغة:
- إذا كتب الطفل بالعربية، رد بالعربية.
- إذا كتب الطفل بالإنجليزية، رد بالإنجليزية.

المواضيع — فقط:
- مواد المدرسة (رياضيات، علوم، لغة، تاريخ، جغرافيا، قراءة)
- تعلم الإنجليزية أو العربية
- مهارات الدراسة والتشجيع والمواضيع المتعلقة بالمدرسة
إذا سُئلت عن أي شيء غير مرتبط بالدراسة، أعد التوجيه بلطف: "سؤال حلو! بس أنا بطل تعلّم — يلا نرجع للواجب أو للتعلم! شو عم تدرس اليوم؟ 🚀"
لا تتكلم أبدًا عن مواضيع الكبار، المخيف، العنف، الحب، السياسة، الدين، أو أي شي مش مناسب للأطفال.

الطول:
- خلي الرد قصير: ٣–٤ جمل كحد أقصى.
- اختم كل رد بسؤال أو تشجيع.`;

router.post("/chat", async (req, res) => {
  try {
    const {
      messages,
      language,
      ageGroup,
      childName,
      heroName,
      imageBase64,
    } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      language: "en" | "ar";
      ageGroup?: "4-6" | "7-9" | "10-12";
      childName?: string;
      heroName?: string;
      imageBase64?: string;
    };

    const systemPrompt = language === "ar" ? ADAM_SYSTEM_PROMPT_AR : ADAM_SYSTEM_PROMPT_EN;
    const ageNote = ageGroup
      ? language === "ar"
        ? `\n\nعمر الطفل: ${ageGroup}. اضبط مستوى الكلمات والشرح بحسب هذا العمر.`
        : `\n\nThe child is age group ${ageGroup}. Adjust your vocabulary and explanations to this age.`
      : "";
    const nameNote = childName
      ? language === "ar"
        ? `\n\nاسم الطفل: ${childName}. ناديه باسمه أحيانًا.`
        : `\n\nThe child's name is ${childName}. Use it occasionally.`
      : "";
    const heroNote = heroName
      ? language === "ar"
        ? `\n\nاسمك في التطبيق: ${heroName}.`
        : `\n\nYour name in the app is: ${heroName}.`
      : "";

    const fullSystem = systemPrompt + ageNote + nameNote + heroNote;

    const chatMessages: Message[] = [
      { role: "system", content: fullSystem },
      ...messages.slice(-12).map((m) => ({
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

    // Safety scanning — check the last user message
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    const lastText = typeof lastUserMsg?.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? lastUserMsg.content.find((c: any) => c.type === "text")?.text ?? ""
        : "";

    const safetyResult = quickSafetyCheck(lastText);
    res.json({ reply, safetyAlert: safetyResult.flagged ? safetyResult.type : null });
  } catch (err) {
    req.log.error({ err }, "chat error");
    res.status(500).json({
      error: "chat failed",
      reply:
        "Oops! My superhero powers are recharging 🔋 Try again in a moment, hero!",
    });
  }
});

export default router;
