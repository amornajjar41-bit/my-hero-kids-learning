import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { STORIES, type Story } from "@/constants/stories";
import { setCurrentStoryId } from "@/lib/storyStore";

function StoryCard({ story, onPress }: { story: Story; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <SoftCard>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Text style={{ fontSize: 44 }}>{story.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>
              {story.titleEn}
            </Text>
            <Text
              style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}
              numberOfLines={2}
            >
              {story.moral}
            </Text>
            <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 4 }}>
              🎵 {story.sentences.length} parts
            </Text>
          </View>
          <Ionicons name="play-circle" size={32} color={c.primary} />
        </View>
      </SoftCard>
    </Pressable>
  );
}

export default function StoriesIndex() {
  const c = useColors();
  const router = useRouter();

  function handleStoryPress(story: Story) {
    setCurrentStoryId(story.id);
    router.push({ pathname: "/stories/[id]", params: { id: story.id } } as any);
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
          🌙 Bedtime Stories
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <Text style={{ fontWeight: "800", fontSize: 14, color: c.primary, marginBottom: 4 }}>
          English Stories ⭐
        </Text>
        {STORIES.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            onPress={() => handleStoryPress(s)}
          />
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
