import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCurrentStoryId } from "@/lib/storyStore";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Pressable, ScrollView,
  Text, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReAnimated, { FadeIn } from "react-native-reanimated";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AudioStatusBadge } from "@/components/AudioStatusBadge";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";

import { STORIES } from "@/constants/stories";
import { preloadStory, storyPath, playPreloaded, stopPreloaded, cacheAudio } from "@/lib/lessonAudio";
import { speak, stopAll } from "@/lib/audio";
import { startBgMusic, stopBgMusic } from "@/lib/bgMusic";
import { generateStorySentence } from "@/lib/api";

// Floating star component for background decoration
function Star({ style }: { style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800 + Math.random() * 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800 + Math.random() * 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);
  return (
    <Animated.Text style={[style, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] }) }]}>
      ✦
    </Animated.Text>
  );
}

const STARS = [
  { top: 40, left: 20, fontSize: 10 }, { top: 70, right: 35, fontSize: 8 },
  { top: 120, left: 60, fontSize: 12 }, { top: 90, right: 80, fontSize: 7 },
  { top: 200, left: 15, fontSize: 9 }, { top: 160, right: 20, fontSize: 11 },
  { top: 240, left: 130, fontSize: 8 }, { top: 300, right: 50, fontSize: 10 },
];

export default function StoryReader() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const lang = useLang();
  const { profile, saveProgress, addPoints } = useApp();

  const rawParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const [storyId] = useState<string>(() => {
    if (rawParam && rawParam !== "") return rawParam;
    return getCurrentStoryId() || "1";
  });
  const story = STORIES.find((s) => s.id === storyId) ?? STORIES[0]!;

  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);
  const [generating, setGenerating] = useState(false);
  const autoPlayRef = useRef(false);

  const totalSentences = story.sentences.length;
  const voice = "nova" as const;
  const storyLang: "en" | "ar" = story.id.startsWith("ar") ? "ar" : "en";

  useEffect(() => {
    preloadStory(story.id, totalSentences).then(() => setLoaded(true));
    startBgMusic();
    return () => {
      autoPlayRef.current = false;
      stopPreloaded();
      stopAll();
      stopBgMusic();
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
    const text = story.sentences[idx] ?? "";

    await playPreloaded(path, async () => {
      setGenerating(true);
      try {
        const result = await generateStorySentence({
          storyId: story.id,
          sentenceIndex: idx,
          text,
          lang: storyLang,
        });
        if (result?.audioBase64) {
          cacheAudio(path, result.audioBase64);
          await playPreloaded(path);
          return;
        }
      } catch { } finally {
        setGenerating(false);
      }
      await speak(text, voice, 1.0, undefined, profile?.ageGroup);
    });

    setGenerating(false);
    setIsPlaying(false);
    if (autoPlayRef.current) {
      await new Promise<void>((r) => setTimeout(r, 60));
      if (autoPlayRef.current) playSentence(idx + 1);
    }
  };

  const startAutoPlay = () => { autoPlayRef.current = true; playSentence(sentenceIdx); };
  const stopAutoPlay = () => {
    autoPlayRef.current = false;
    stopPreloaded();
    stopAll();
    setIsPlaying(false);
  };

  const isArabic = lang === "ar";
  const progress = totalSentences > 0 ? (sentenceIdx / totalSentences) * 100 : 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Deep magical gradient background */}
      <LinearGradient
        colors={["#0D0826", "#1A1045", "#0D1B3E"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Floating stars */}
      {STARS.map((s, i) => (
        <Star
          key={i}
          style={{
            position: "absolute",
            color: "#A78BFA",
            fontSize: s.fontSize,
            top: s.top,
            ...(s as any).left !== undefined ? { left: (s as any).left } : { right: (s as any).right },
          }}
        />
      ))}

      {/* Soft glow orb top-center */}
      <View style={{
        position: "absolute", top: -60, alignSelf: "center",
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: "#7C3AED", opacity: 0.12,
      }} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AudioStatusBadge />

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => { stopAutoPlay(); router.back(); }}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
          <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF", flex: 1 }} numberOfLines={1}>
            {story.titleEn}
          </Text>
          <View style={{ backgroundColor: "rgba(167,139,250,0.25)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: "#C4B5FD", fontWeight: "700" }}>
              {sentenceIdx + 1}/{totalSentences}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginHorizontal: 16, marginBottom: 8, height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <View style={{ width: `${progress}%`, height: "100%", backgroundColor: "#A78BFA", borderRadius: 2 }} />
        </View>

        {finished ? (
          <ScrollView contentContainerStyle={{ padding: 24, gap: 18, alignItems: "center" }}>
            <Confetti count={60} />
            <View style={{ backgroundColor: "rgba(167,139,250,0.15)", borderRadius: 30, padding: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 72, textAlign: "center" }}>{story.emoji}</Text>
            </View>
            <View style={{ backgroundColor: "rgba(124,58,237,0.3)", borderRadius: 24, padding: 24, width: "100%", borderWidth: 1, borderColor: "rgba(167,139,250,0.3)" }}>
              <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 22, textAlign: "center" }}>
                The End! 🌟
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 10, lineHeight: 24, fontSize: 15 }}>
                {story.moral}
              </Text>
            </View>
            <PrimaryButton title="Read Again" fullWidth onPress={() => { setSentenceIdx(0); setFinished(false); setIsPlaying(false); autoPlayRef.current = false; }} />
            <PrimaryButton title="Another Story" variant="secondary" fullWidth onPress={() => router.back()} />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }}>

            {/* Story emoji with moon glow */}
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <View style={{
                width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(167,139,250,0.12)",
                shadowColor: "#A78BFA", shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
              }}>
                <Text style={{ fontSize: 60 }}>{story.emoji}</Text>
              </View>
            </View>

            {/* Dot progress */}
            <View style={{ flexDirection: "row", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
              {story.sentences.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === sentenceIdx ? 22 : 8,
                    height: 8, borderRadius: 4,
                    backgroundColor: i <= sentenceIdx
                      ? (i === sentenceIdx ? "#A78BFA" : "rgba(167,139,250,0.5)")
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </View>

            {/* Current sentence card — storybook page style */}
            <ReAnimated.View key={sentenceIdx} entering={FadeIn.duration(350)}>
              <View style={{
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(167,139,250,0.3)",
                padding: 26,
                shadowColor: "#7C3AED",
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 4,
              }}>
                {/* Decorative corner quotes */}
                <Text style={{ position: "absolute", top: 10, left: 16, fontSize: 28, color: "rgba(167,139,250,0.3)", fontFamily: "serif" }}>"</Text>
                <Text style={{ position: "absolute", bottom: 10, right: 16, fontSize: 28, color: "rgba(167,139,250,0.3)", fontFamily: "serif" }}>"</Text>

                {!loaded && <ActivityIndicator color="#A78BFA" style={{ marginBottom: 12 }} />}

                <Text
                  style={{
                    color: "#F3F0FF",
                    fontSize: isArabic ? 23 : 21,
                    fontWeight: "700",
                    lineHeight: isArabic ? 40 : 34,
                    textAlign: isArabic ? "right" : "left",
                    writingDirection: isArabic ? "rtl" : "ltr",
                    paddingHorizontal: 8,
                  }}
                >
                  {story.sentences[sentenceIdx] ?? ""}
                </Text>
              </View>
            </ReAnimated.View>

            {generating && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#A78BFA" />
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Generating audio…</Text>
              </View>
            )}

            {/* Playback controls */}
            <View style={{ flexDirection: "row", gap: 16, justifyContent: "center", alignItems: "center", marginTop: 4 }}>
              <Pressable
                disabled={sentenceIdx === 0}
                onPress={() => { stopAutoPlay(); setSentenceIdx((i) => Math.max(0, i - 1)); }}
                style={({ pressed }) => ({
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
                  opacity: sentenceIdx === 0 ? 0.25 : pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="play-skip-back" size={22} color="#FFF" />
              </Pressable>

              <Pressable
                onPress={isPlaying ? stopAutoPlay : startAutoPlay}
                style={({ pressed }) => ({
                  width: 76, height: 76, borderRadius: 38,
                  backgroundColor: "#7C3AED",
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: "#7C3AED", shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
                  borderWidth: 2, borderColor: "rgba(255,255,255,0.2)",
                })}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFF" />
              </Pressable>

              <Pressable
                onPress={() => {
                  stopAutoPlay();
                  if (sentenceIdx + 1 >= totalSentences) setFinished(true);
                  else setSentenceIdx((i) => i + 1);
                }}
                style={({ pressed }) => ({
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="play-skip-forward" size={22} color="#FFF" />
              </Pressable>
            </View>

            {/* Full story list */}
            <View style={{
              backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16,
            }}>
              <Text style={{ fontWeight: "700", color: "rgba(167,139,250,0.8)", fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>
                FULL STORY
              </Text>
              {story.sentences.map((sentence, i) => (
                <Pressable
                  key={i}
                  onPress={() => { stopAutoPlay(); playSentence(i); }}
                  style={{
                    padding: 10, borderRadius: 10, marginBottom: 4,
                    backgroundColor: i === sentenceIdx ? "rgba(124,58,237,0.25)" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: i === sentenceIdx ? "#C4B5FD" : i < sentenceIdx ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)",
                      fontWeight: i === sentenceIdx ? "700" : "400",
                      fontSize: 13, lineHeight: 21,
                      textAlign: isArabic ? "right" : "left",
                      writingDirection: isArabic ? "rtl" : "ltr",
                    }}
                  >
                    {i === sentenceIdx ? "▶ " : ""}{sentence}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
