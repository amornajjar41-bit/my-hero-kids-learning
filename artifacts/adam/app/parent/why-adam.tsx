import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useT, useLang } from "@/hooks/useT";

// 5A – 10 reasons
const REASONS: { icon: string; en: string; ar: string; sub_en: string; sub_ar: string }[] = [
  {
    icon: "🧠",
    en: "Teaches Critical Thinking",
    ar: "يعلّم التفكير النقدي",
    sub_en: "Guides and prompts — never just gives answers",
    sub_ar: "يرشد ويحفّز، ولا يعطي الجواب مباشرة",
  },
  {
    icon: "📚",
    en: "Covers ALL Subjects",
    ar: "يغطي كل المواد",
    sub_en: "Math, English, Science and more — one app for everything",
    sub_ar: "رياضيات، إنجليزي، عربي، علوم — تطبيق واحد لكل شيء",
  },
  {
    icon: "🌍",
    en: "English-Focused Learning",
    ar: "تعلم متركز على الإنجليزية",
    sub_en: "Rich English curriculum — vocabulary, reading, grammar and conversation",
    sub_ar: "منهج إنجليزي غني — مفردات، قراءة، قواعد ومحادثة",
  },
  {
    icon: "👶",
    en: "Age-Adaptive Content",
    ar: "محتوى يتكيف مع العمر",
    sub_en: "Grows with your child from age 4 to 14",
    sub_ar: "يكبر مع طفلك من عمر 4 إلى 14 سنة",
  },
  {
    icon: "✅",
    en: "Fully Safe & Monitored",
    ar: "آمن تماماً ومُراقب",
    sub_en: "Automatic parent alerts for any inappropriate content",
    sub_ar: "تنبيهات فورية للوالدين عند أي محتوى غير لائق",
  },
  {
    icon: "💰",
    en: "Replaces Tutors",
    ar: "يغني عن المدرس الخصوصي",
    sub_en: "Unlimited learning at a fraction of tutor costs",
    sub_ar: "تعلم غير محدود بجزء بسيط من تكلفة المدرس",
  },
  {
    icon: "📊",
    en: "Weekly Progress Reports",
    ar: "تقارير تقدم أسبوعية",
    sub_en: "Know exactly what your child learned this week",
    sub_ar: "اعرف بالضبط ماذا تعلم طفلك هذا الأسبوع",
  },
  {
    icon: "⏰",
    en: "Parent-Controlled Screen Time",
    ar: "وقت الشاشة بيد الوالدين",
    sub_en: "Set daily limits: 2h, 4h, 6h or unlimited",
    sub_ar: "حدد الوقت اليومي: ساعتان، ٤، ٦، أو غير محدود",
  },
  {
    icon: "🎮",
    en: "Learning Disguised as Play",
    ar: "التعلم بشكل لعبة",
    sub_en: "Kids love it — they don't even know they're learning",
    sub_ar: "الأطفال يعشقونه — ولا يحسون أنهم يتعلمون",
  },
  {
    icon: "🔒",
    en: "Complete Privacy",
    ar: "خصوصية تامة",
    sub_en: "Zero ads, zero data selling — your child's data stays private",
    sub_ar: "لا إعلانات، لا بيع بيانات — بيانات طفلك تبقى خاصة",
  },
];

const examples = {
  en: [
    {
      bad: "❌ Other apps: '6 × 7 = 42'",
      good: "✅ My Hero: 'Ooh fun! Let's break it down — what's 6 × 5? Then just add 6 + 6 more! What do you get?'",
    },
    {
      bad: "❌ Other apps: 'The capital is Paris'",
      good: "✅ My Hero: 'I bet you can find this! Think of the country with the Eiffel Tower 🗼 — what city is it in?'",
    },
  ],
  ar: [
    {
      bad: "❌ التطبيقات التانية: '٦ × ٧ = ٤٢'",
      good: "✅ My Hero: 'ولا أحلى! يلا نفككها — قديش ٦ × ٥؟ بعدين بنزيد ٦ + ٦. شو بطلع معك؟'",
    },
    {
      bad: "❌ التطبيقات التانية: 'العاصمة هي باريس'",
      good: "✅ My Hero: 'متأكد بتعرفها! فكر بالدولة اللي فيها برج إيفل 🗼 — أي مدينة هي؟'",
    },
  ],
};

export default function WhyAdam() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: c.card, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          💡 {lang === "ar" ? "لماذا My Hero؟" : "Why My Hero?"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 40 }}>

        {/* Intro card */}
        <SoftCard color={c.accent}>
          <Text style={{ color: c.accentForeground, fontSize: 15, lineHeight: 22, fontWeight: "600" }}>
            {lang === "ar"
              ? "My Hero مش مجرد تطبيق — هو رفيق تعليمي يرشد طفلك نحو التفكير، لا يعطيه الجواب على طبق."
              : "My Hero isn't just an app — it's a learning companion that guides your child to think, not just receive answers."}
          </Text>
        </SoftCard>

        {/* 10 Reasons */}
        <Text style={{ fontWeight: "800", color: c.text, fontSize: 18, marginTop: 4 }}>
          {lang === "ar" ? "١٠ أسباب لاختيار My Hero" : "10 Reasons to Choose My Hero"}
        </Text>

        {REASONS.map((r, i) => (
          <SoftCard key={i}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: c.muted,
                alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Text style={{ fontSize: 22 }}>{r.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{
                    color: c.mutedForeground, fontSize: 11, fontWeight: "700",
                  }}>
                    {lang === "ar" ? `#${i + 1}` : `#${i + 1}`}
                  </Text>
                  <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
                    {lang === "ar" ? r.ar : r.en}
                  </Text>
                </View>
                <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 3, lineHeight: 19 }}>
                  {lang === "ar" ? r.sub_ar : r.sub_en}
                </Text>
              </View>
            </View>
          </SoftCard>
        ))}

        {/* Examples section */}
        <Text style={{ fontWeight: "800", color: c.text, fontSize: 18, marginTop: 8 }}>
          {lang === "ar" ? "مثال حقيقي" : "Real Example"}
        </Text>
        {examples[lang].map((ex, i) => (
          <SoftCard key={i}>
            <Text style={{ color: c.mutedForeground, fontSize: 13, lineHeight: 20 }}>{ex.bad}</Text>
            <Text style={{ color: c.text, fontSize: 14, marginTop: 10, lineHeight: 20, fontWeight: "600" }}>
              {ex.good}
            </Text>
          </SoftCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
