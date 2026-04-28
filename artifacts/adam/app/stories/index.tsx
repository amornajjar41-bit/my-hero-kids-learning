import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { STORIES } from "@/constants/stories";

export default function StoriesIndex() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const { profile } = useApp();

  const arabicStories = STORIES.filter((s) => s.lang === "ar");
  const englishStories = STORIES.filter((s) => s.lang === "en");

  const Section = ({ title, stories }: { title: string; stories: typeof STORIES }) => (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color: c.mutedForeground, letterSpacing: 1 }}>
        {title.toUpperCase()}
      </Text>
      {stories.map((story) => (
        <Pressable
          key={story.id}
          onPress={() => router.push(`/stories/${story.id}` as any)}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <SoftCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Text style={{ fontSize: 48 }}>{story.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>
                  {lang === "ar" ? story.titleAr : story.titleEn}
                </Text>
                <Text
                  style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {lang === "ar" ? story.moral.ar : story.moral.en}
                </Text>
                <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 4 }}>
                  🎵 {story.sentences.length} {lang === "ar" ? "مقاطع" : "parts"} · {lang === "ar" ? (story.lang === "ar" ? "عربي" : "إنجليزي") : (story.lang === "ar" ? "Arabic" : "English")}
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color={c.primary} />
            </View>
          </SoftCard>
        </Pressable>
      ))}
    </View>
  );

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
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          🌙 {lang === "ar" ? "قصص ما قبل النوم" : "Bedtime Stories"}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 20 }}>
        <Section
          title={lang === "ar" ? "قصص عربية" : "Arabic Stories"}
          stories={arabicStories}
        />
        <Section
          title={lang === "ar" ? "قصص إنجليزية" : "English Stories"}
          stories={englishStories}
        />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
