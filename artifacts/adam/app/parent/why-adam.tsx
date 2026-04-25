import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useT, useLang } from "@/hooks/useT";

const examples = {
  en: [
    {
      bad: "❌ Other apps: '6 × 7 = 42'",
      good:
        "✅ Adam: 'Ooh fun! Let's break it down — what's 6 × 5? Then we just add 6 + 6 more! What do you get?'",
    },
    {
      bad: "❌ Other apps: 'The capital is Paris'",
      good:
        "✅ Adam: 'I bet you can find this! Think of the country with the Eiffel Tower 🗼 — what city is it in?'",
    },
    {
      bad: "❌ Other apps just give the answer",
      good:
        "✅ Adam guides — your child becomes the hero of their own learning 🦸",
    },
  ],
  ar: [
    {
      bad: "❌ التطبيقات التانية: '٦ × ٧ = ٤٢'",
      good:
        "✅ آدم: 'ولا أحلى! يلا نفككها — قديش ٦ × ٥؟ بعدين بنزيد ٦ + ٦. شو بطلع معك؟'",
    },
    {
      bad: "❌ التطبيقات التانية: 'العاصمة هي باريس'",
      good:
        "✅ آدم: 'متأكد بتعرفها! فكر بالدولة اللي فيها برج إيفل 🗼 — أي مدينة هي؟'",
    },
    {
      bad: "❌ التطبيقات التانية بتعطي الجواب على طول",
      good:
        "✅ آدم بيرشد — طفلك بيصير بطل تعلّمه 🦸",
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
      <View
        style={{
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c.card,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          💡 {t("whyAdam")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <SoftCard color={c.accent}>
          <Text
            style={{ color: c.accentForeground, fontSize: 15, lineHeight: 22 }}
          >
            {t("whyAdamBody")}
          </Text>
        </SoftCard>

        <Text style={{ fontWeight: "800", color: c.text, fontSize: 18 }}>
          {t("sampleAnswers")}
        </Text>
        {examples[lang].map((ex, i) => (
          <SoftCard key={i}>
            <Text style={{ color: c.mutedForeground, fontSize: 13, lineHeight: 20 }}>
              {ex.bad}
            </Text>
            <Text
              style={{
                color: c.text,
                fontSize: 14,
                marginTop: 10,
                lineHeight: 20,
                fontWeight: "600",
              }}
            >
              {ex.good}
            </Text>
          </SoftCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
