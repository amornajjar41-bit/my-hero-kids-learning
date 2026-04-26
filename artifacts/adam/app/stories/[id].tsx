import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { STORIES } from "@/constants/stories-data";
import { ttsSpeak } from "@/lib/api";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

const SLEEPY_FRAMES = ["😊", "🙂", "😌", "🥱", "😴"];

// Split story text into paragraphs (audio chunks)
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function StoryPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lang = useLang();
  const { profile } = useApp();

  const story = STORIES.find((s) => s.id === id);
  const paragraphs = story ? splitIntoParagraphs(lang === "ar" ? story.textAr : story.textEn) : [];
  const totalSec = (story?.durationMin ?? 5) * 60;

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [sleepyFrame, setSleepyFrame] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paraIdx, setParaIdx] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dimRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepyRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const paraIdxRef = useRef(0);

  // Breathe animation for main emoji
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.06, duration: 2200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(breathe, { toValue: 1, duration: 2200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
  }, [breathe]);

  // Sleepy animation loop
  useEffect(() => {
    sleepyRef.current = setInterval(() => {
      setSleepyFrame((f) => Math.min(f + 1, SLEEPY_FRAMES.length - 1));
    }, 4000);
    return () => { if (sleepyRef.current) clearInterval(sleepyRef.current); };
  }, []);

  // Reset sleepy when story plays
  useEffect(() => {
    if (playing) setSleepyFrame(0);
  }, [playing]);

  // Scene detection based on elapsed
  useEffect(() => {
    if (!story) return;
    let idx = 0;
    for (let i = 0; i < story.scenes.length; i++) {
      if (elapsed >= (story.scenes[i]?.startSec ?? 0)) idx = i;
    }
    setSceneIdx(idx);
  }, [elapsed, story]);

  // Auto-dim after 2 minutes of playing
  useEffect(() => {
    if (playing) {
      dimRef.current = setTimeout(() => setDimmed(true), 120_000);
    } else {
      if (dimRef.current) clearTimeout(dimRef.current);
    }
    return () => { if (dimRef.current) clearTimeout(dimRef.current); };
  }, [playing]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSec) { stopTimer(); return e; }
        return e + 1;
      });
    }, 1000);
  }, [stopTimer, totalSec]);

  // Play a single paragraph via TTS, return duration
  const playParagraph = useCallback(async (idx: number): Promise<void> => {
    if (!story || !playingRef.current) return;
    const text = paragraphs[idx];
    if (!text) {
      // All done
      playingRef.current = false;
      setPlaying(false);
      setFinished(true);
      stopTimer();
      getJSON<Record<string, boolean>>(STORAGE_KEYS.storiesListened).then((prev) => {
        setJSON(STORAGE_KEYS.storiesListened, { ...(prev ?? {}), [id!]: true });
      });
      return;
    }

    try {
      const voice = profile?.hero === "girl" ? "nova" : "echo";
      const { audioBase64, mimeType } = await ttsSpeak({
        text,
        voice,
        // @ts-ignore – custom param
        maxChars: 700,
      });
      if (!playingRef.current) return;
      const uri = `data:${mimeType || "audio/mpeg"};base64,${audioBase64}`;

      if (typeof window !== "undefined") {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
        const audio = new Audio(uri);
        audioRef.current = audio;
        audio.playbackRate = 0.85;

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
      }

      if (playingRef.current) {
        const nextIdx = idx + 1;
        paraIdxRef.current = nextIdx;
        setParaIdx(nextIdx);
        await playParagraph(nextIdx);
      }
    } catch (e) {
      console.warn("[story tts]", e);
      // Try next paragraph anyway
      if (playingRef.current) {
        const nextIdx = idx + 1;
        paraIdxRef.current = nextIdx;
        setParaIdx(nextIdx);
        await playParagraph(nextIdx);
      }
    }
  }, [story, paragraphs, profile, id, stopTimer]);

  const startPlayback = useCallback(async () => {
    setLoading(true);
    playingRef.current = true;
    setPlaying(true);
    startTimer();
    try {
      await playParagraph(paraIdxRef.current);
    } finally {
      setLoading(false);
    }
  }, [playParagraph, startTimer]);

  const pausePlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopTimer();
    if (typeof window !== "undefined" && audioRef.current) {
      audioRef.current.pause();
    }
  }, [stopTimer]);

  const togglePlay = async () => {
    if (playing) {
      pausePlayback();
    } else {
      await startPlayback();
    }
  };

  useEffect(() => {
    return () => {
      playingRef.current = false;
      stopTimer();
      if (typeof window !== "undefined" && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [stopTimer]);

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  const progress = Math.min(elapsed / totalSec, 1);

  if (!story) {
    return (
      <LinearGradient colors={["#0d1b4b", "#0f0c29"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#FFF", fontSize: 18 }}>Story not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: "#a78bfa" }}>← Back</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentScene = story.scenes[sceneIdx]!;

  return (
    <Pressable style={{ flex: 1 }} onPress={() => dimmed && setDimmed(false)}>
      <LinearGradient colors={[...currentScene.bg, "#000"]} style={{ flex: 1, opacity: dimmed ? 0.2 : 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </Pressable>
            <Text style={{ flex: 1, color: "#FFF", fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
              {lang === "ar" ? story.titleAr : story.titleEn}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              {paraIdx + 1}/{paragraphs.length}
            </Text>
          </View>

          {/* Main scene emoji */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
            <Animated.View style={{ transform: [{ scale: breathe }] }}>
              <Text style={{ fontSize: 120 }}>{currentScene.emoji}</Text>
            </Animated.View>

            {/* Current paragraph text */}
            {paragraphs[paraIdx] && (
              <View style={{ marginHorizontal: 24, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 16, padding: 14 }}>
                <Text style={{ color: "#FFF", fontSize: 14, lineHeight: 22, textAlign: lang === "ar" ? "right" : "left", opacity: 0.9 }} numberOfLines={4}>
                  {paragraphs[paraIdx]}
                </Text>
              </View>
            )}

            {finished && (
              <View style={{ backgroundColor: "rgba(124,58,237,0.85)", borderRadius: 20, padding: 24, marginHorizontal: 24, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontSize: 36 }}>🌟</Text>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 20, textAlign: "center", marginTop: 8 }}>
                  {lang === "ar" ? "The End — قصة جميلة! 💫" : "The End 🌟 Sweet dreams!"}
                </Text>
              </View>
            )}
          </View>

          {/* Sleepy character corner */}
          <View style={{ position: "absolute", bottom: 200, right: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 36 }}>{SLEEPY_FRAMES[sleepyFrame]}</Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, textAlign: "center" }}>
              {profile?.hero === "girl" ? "Lulu" : "Adam"}
            </Text>
          </View>

          {/* Controls */}
          <View style={{ padding: 24, gap: 16 }}>
            {/* Progress bar */}
            <View style={{ gap: 6 }}>
              <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
                <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: "#a78bfa", borderRadius: 3 }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{formatTime(elapsed)}</Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{formatTime(totalSec)}</Text>
              </View>
            </View>

            {/* Play / Pause */}
            <Pressable
              onPress={togglePlay}
              disabled={loading}
              style={({ pressed }) => ({
                alignSelf: "center", width: 80, height: 80, borderRadius: 40,
                backgroundColor: loading ? "rgba(167,139,250,0.4)" : "#7c3aed",
                alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
                shadowColor: "#7c3aed", shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
              })}
            >
              {loading ? (
                <Text style={{ fontSize: 28 }}>⏳</Text>
              ) : (
                <Ionicons name={playing ? "pause" : "play"} size={36} color="#FFF" />
              )}
            </Pressable>

            {dimmed && (
              <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", fontSize: 12 }}>
                {lang === "ar" ? "اضغط للإضاءة" : "Tap anywhere to brighten"}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Pressable>
  );
}
