import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useT";

const REASONS: { icon: string; title: string; subtitle: string }[] = [
  { icon: "🧠", title: "Teaches Critical Thinking", subtitle: "Guides and prompts — never just gives answers" },
  { icon: "📚", title: "Covers ALL Subjects", subtitle: "Math, English, Science and more — one app for everything" },
  { icon: "🌍", title: "English-Focused Learning", subtitle: "Rich English curriculum — vocabulary, reading, grammar and conversation" },
  { icon: "👶", title: "Age-Adaptive Content", subtitle: "Grows with your child from age 4 to 14" },
  { icon: "✅", title: "Fully Safe & Monitored", subtitle: "Automatic parent alerts for any inappropriate content" },
  { icon: "💰", title: "Replaces Tutors", subtitle: "Unlimited learning at a fraction of tutor costs" },
  { icon: "📊", title: "Weekly Progress Reports", subtitle: "Know exactly what your child learned this week" },
  { icon: "⏰", title: "Parent-Controlled Screen Time", subtitle: "Set daily limits: 2h, 4h, 6h or unlimited" },
  { icon: "🎮", title: "Learning Disguised as Play", subtitle: "Kids love it — they don't even know they're learning" },
  { icon: "🔒", title: "Complete Privacy", subtitle: "Zero ads, zero data selling — your child's data stays private" },
];

const examples = [
  {
    bad: "❌ Other apps: '6 × 7 = 42'",
    good: "✅ My Hero: 'Ooh fun! Let's break it down — what's 6 × 5? Then just add 6 + 6 more! What do you get?'",
  },
  {
    bad: "❌ Other apps: 'The capital is Paris'",
    good: "✅ My Hero: 'I bet you can find this! Think of the country with the Eiffel Tower 🗼 — what city is it in?'",
  },
];

export default function WhyAdam() {
  const c = useColors();
  const router = useRouter();
  const t = useT();

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
          💡 Why My Hero?
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 40 }}>

        <SoftCard color={c.accent}>
          <Text style={{ color: c.accentForeground, fontSize: 15, lineHeight: 22, fontWeight: "600" }}>
            My Hero isn't just an app — it's a learning companion that guides your child to think, not just receive answers.
          </Text>
        </SoftCard>

        <Text style={{ fontWeight: "800", color: c.text, fontSize: 18, marginTop: 4 }}>
          10 Reasons to Choose My Hero
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
                  <Text style={{ color: c.mutedForeground, fontSize: 11, fontWeight: "700" }}>
                    #{i + 1}
                  </Text>
                  <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
                    {r.title}
                  </Text>
                </View>
                <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 3, lineHeight: 19 }}>
                  {r.subtitle}
                </Text>
              </View>
            </View>
          </SoftCard>
        ))}

        <Text style={{ fontWeight: "800", color: c.text, fontSize: 18, marginTop: 8 }}>
          Real Example
        </Text>
        {examples.map((ex, i) => (
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
