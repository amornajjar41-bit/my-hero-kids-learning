import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/hooks/useT";
import { STORIES } from "@/constants/stories";

export default function StoriesIndex() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();

  const userLangStories = STORIES.filter((s) => s.lang === lang);
  const otherLangStories = STORIES.filter((s) => s.lang !== lang);
  const otherLang = lang === "ar" ? "en" : "ar";

  const groupLabel = (l: "en" | "ar") =>
    l === "ar"
      ? (lang === "ar" ? "قصص عربية 🌙" : "Arabic Stories 🌙")
      : (lang === "ar" ? "قصص إنجليزية ⭐" : "English Stories ⭐");

  function StoryCard({ story }: { story: (typeof STORIES)[number] }) {
    return (
      <Pressable
        key={story.id}
        onPress={() =>
          router.push({
            pathname: "/stories/[id]",
            params: { id: story.id },
          } as any)
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <SoftCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ fontSize: 44 }}>{story.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>
                {lang === "ar" ? story.titleAr : story.titleEn}
              </Text>
              <Text
                style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}
                numberOfLines={2}
              >
                {lang === "ar" ? story.moral.ar : story.moral.en}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 4 }}>
                🎵 {story.sentences.length} {lang === "ar" ? "مقاطع" : "parts"}
              </Text>
            </View>
            <Ionicons name="play-circle" size={32} color={c.primary} />
          </View>
        </SoftCard>
      </Pressable>
    );
  }

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

      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        {/* User's language stories first */}
        <Text style={{
          fontWeight: "800", fontSize: 14, color: c.primary,
          textAlign: lang === "ar" ? "right" : "left",
          marginBottom: 4,
        }}>
          {groupLabel(lang as "en" | "ar")}
        </Text>
        {userLangStories.map((s) => <StoryCard key={s.id} story={s} />)}

        {/* Other language stories */}
        <Text style={{
          fontWeight: "800", fontSize: 14, color: c.mutedForeground,
          textAlign: lang === "ar" ? "right" : "left",
          marginTop: 8, marginBottom: 4,
        }}>
          {groupLabel(otherLang)}
        </Text>
        {otherLangStories.map((s) => <StoryCard key={s.id} story={s} />)}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
