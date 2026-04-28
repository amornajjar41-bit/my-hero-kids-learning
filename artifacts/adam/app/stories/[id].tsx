import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCurrentStoryId } from "@/lib/storyStore";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { Confetti } from "@/components/Confetti";
import { SoftCard } from "@/components/SoftCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";

import { useApp } from "@/contexts/AppContext";
import { STORIES } from "@/constants/stories";
import { preloadStory, storyPath, playPreloaded, stopPreloaded } from "@/lib/lessonAudio";
import { speakEdgeStory, stopAll } from "@/lib/audio";

export default function StoryReader() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { saveProgress, addPoints } = useApp();

  // Primary: module store set just before navigation (100% reliable on all platforms).
  // Fallback: URL params (reliable on web but occasionally delayed on native).
  const storeId = getCurrentStoryId();
  const rawParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const storyId = storeId || rawParam || "";
  const story = (storyId ? STORIES.find((s) => s.id === storyId) : null) ?? STORIES[0]!;

  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);
  const autoPlayRef = useRef(false);

  const totalSentences = story.sentences.length;

  useEffect(() => {
    preloadStory(story.id, totalSentences).then(() => setLoaded(true));
    return () => {
      autoPlayRef.current = false;
      stopPreloaded();
      stopAll();
    };
  }, [story.id, totalSentences]);

  const playSentence = async (idx: number) => {
    if (idx >= totalSentences) {
      setFinished(true);
      setIsPlaying(false);
      saveProgress((p) => ({ ...p, storiesListened: p.storiesListened + 1 }));
      addPoints(20);
      return;
    }
    setSentenceIdx(idx);
    setIsPlaying(true);
    const path = storyPath(story.id, idx);
    await playPreloaded(path, () => speakEdgeStory(story.sentences[idx] ?? "", "en"));
    setIsPlaying(false);
    if (autoPlayRef.current) {
      await new Promise<void>((r) => setTimeout(r, 600));
      if (autoPlayRef.current) playSentence(idx + 1);
    }
  };

  const startAutoPlay = () => {
    autoPlayRef.current = true;
    playSentence(sentenceIdx);
  };

  const stopAutoPlay = () => {
    autoPlayRef.current = false;
    stopPreloaded();
    stopAll();
    setIsPlaying(false);
  };

  const isArabic = false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => { stopAutoPlay(); router.back(); }}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: c.card, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 18, color: c.text, flex: 1 }} numberOfLines={1}>
          {story.titleEn}
        </Text>
        <Text style={{ fontSize: 11, color: c.mutedForeground }}>
          {sentenceIdx + 1}/{totalSentences}
        </Text>
      </View>

      {finished ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, alignItems: "center" }}>
          <Confetti count={60} />
          <Text style={{ fontSize: 80, textAlign: "center" }}>{story.emoji}</Text>
          <SoftCard color={c.primary} style={{ width: "100%" }}>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 20, textAlign: "center" }}>
              The End! 🎉
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.95, textAlign: "center", marginTop: 10, lineHeight: 22, fontSize: 15 }}>
              Lesson: {story.moral}
            </Text>
          </SoftCard>
          <PrimaryButton
            title="Read Again"
            fullWidth
            onPress={() => { setSentenceIdx(0); setFinished(false); setIsPlaying(false); autoPlayRef.current = false; }}
          />
          <PrimaryButton
            title="Another Story"
            variant="secondary"
            fullWidth
            onPress={() => router.back()}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 18 }}>
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 80 }}>{story.emoji}</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {story.sentences.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === sentenceIdx ? 20 : 8,
                    height: 8, borderRadius: 4,
                    backgroundColor: i <= sentenceIdx ? c.primary : c.muted,
                  }}
                />
              ))}
            </View>
          </View>

          <Animated.View key={sentenceIdx} entering={FadeIn.duration(300)}>
            <LinearGradient
              colors={["#2D1B69", "#1A0F3F"]}
              style={{ borderRadius: c.radius, padding: 24 }}
            >
              {!loaded && (
                <ActivityIndicator color="#FFF" style={{ marginBottom: 12 }} />
              )}
              <Text
                style={{
                  color: "#FFF",
                  fontSize: isArabic ? 22 : 20,
                  fontWeight: "700",
                  lineHeight: isArabic ? 38 : 32,
                  textAlign: isArabic ? "right" : "left",
                  writingDirection: isArabic ? "rtl" : "ltr",
                }}
              >
                {story.sentences[sentenceIdx] ?? ""}
              </Text>
            </LinearGradient>
          </Animated.View>

          <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 8 }}>
            <Pressable
              disabled={sentenceIdx === 0}
              onPress={() => { stopAutoPlay(); setSentenceIdx((i) => Math.max(0, i - 1)); }}
              style={({ pressed }) => ({
                width: 50, height: 50, borderRadius: 25,
                backgroundColor: c.muted, alignItems: "center", justifyContent: "center",
                opacity: sentenceIdx === 0 ? 0.3 : pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="play-skip-back" size={22} color={c.text} />
            </Pressable>

            <Pressable
              onPress={isPlaying ? stopAutoPlay : startAutoPlay}
              style={({ pressed }) => ({
                width: 70, height: 70, borderRadius: 35,
                backgroundColor: c.primary, alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#FFF" />
            </Pressable>

            <Pressable
              onPress={() => {
                stopAutoPlay();
                if (sentenceIdx + 1 >= totalSentences) setFinished(true);
                else setSentenceIdx((i) => i + 1);
              }}
              style={({ pressed }) => ({
                width: 50, height: 50, borderRadius: 25,
                backgroundColor: c.muted, alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="play-skip-forward" size={22} color={c.text} />
            </Pressable>
          </View>

          <SoftCard>
            <Text style={{ fontWeight: "700", color: c.mutedForeground, fontSize: 12, marginBottom: 8 }}>
              Full Story
            </Text>
            {story.sentences.map((sentence, i) => (
              <Pressable
                key={i}
                onPress={() => { stopAutoPlay(); playSentence(i); }}
                style={{
                  padding: 8, borderRadius: 8,
                  backgroundColor: i === sentenceIdx ? c.primary + "22" : "transparent",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    color: i === sentenceIdx ? c.primary : i < sentenceIdx ? c.mutedForeground : c.text,
                    fontWeight: i === sentenceIdx ? "700" : "400",
                    fontSize: 14, lineHeight: 22,
                    textAlign: isArabic ? "right" : "left",
                    writingDirection: isArabic ? "rtl" : "ltr",
                  }}
                >
                  {i === sentenceIdx ? "▶ " : ""}{sentence}
                </Text>
              </Pressable>
            ))}
          </SoftCard>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
