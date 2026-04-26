import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { STORIES } from "@/constants/stories-data";
import { ttsSpeak } from "@/lib/api";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

const ADAM_SLEEPY_FRAMES = ["😊", "🙂", "😌", "😴"];

export default function StoryPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lang = useLang();
  const { profile } = useApp();

  const story = STORIES.find((s) => s.id === id);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [loading, setLoading] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [sleepyFrame, setSleepyFrame] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const [finished, setFinished] = useState(false);

  const totalSec = (story?.durationMin ?? 5) * 60;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scene detection
  useEffect(() => {
    if (!story) return;
    const scenes = story.scenes;
    let idx = 0;
    for (let i = 0; i < scenes.length; i++) {
      if (elapsed >= (scenes[i]?.startSec ?? 0)) idx = i;
    }
    setSceneIdx(idx);
  }, [elapsed, story]);

  // Sleepy Adam animation
  useEffect(() => {
    sleepyTimerRef.current = setInterval(() => {
      setSleepyFrame((f) => (f + 1) % ADAM_SLEEPY_FRAMES.length);
    }, 3000);
    return () => {
      if (sleepyTimerRef.current) clearInterval(sleepyTimerRef.current);
    };
  }, []);

  // Auto-dim after 2 minutes
  useEffect(() => {
    if (playing) {
      dimTimerRef.current = setTimeout(() => setDimmed(true), 120_000);
    } else {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
      setDimmed(false);
    }
    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current);
    };
  }, [playing]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSec) {
          stopTimer();
          setPlaying(false);
          setFinished(true);
          // Save as listened
          getJSON<Record<string, boolean>>(STORAGE_KEYS.storiesListened).then((prev) => {
            setJSON(STORAGE_KEYS.storiesListened, { ...(prev ?? {}), [id!]: true });
          });
          return e;
        }
        return e + 1;
      });
    }, 1000);
  }, [totalSec, stopTimer, id]);

  const loadAndPlay = useCallback(async () => {
    if (!story) return;
    setLoading(true);
    try {
      const text = lang === "ar" ? story.textAr : story.textEn;
      // Chunk: take first 400 chars to keep TTS fast
      const chunk = text.slice(0, 400);
      const { audioBase64, mimeType } = await ttsSpeak({
        text: chunk,
        voice: profile?.hero === "girl" ? "nova" : "echo",
      });
      const uri = `data:${mimeType || "audio/mpeg"};base64,${audioBase64}`;
      if (Platform.OS === "web") {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        const audio = new Audio(uri);
        audioRef.current = audio;
        audio.playbackRate = 0.88; // slower for bedtime
        await audio.play();
        audio.onended = () => {
          stopTimer();
          setPlaying(false);
        };
      }
    } catch (e) {
      console.warn("[story] tts failed", e);
    } finally {
      setLoading(false);
    }
  }, [story, lang, profile, stopTimer]);

  const togglePlay = async () => {
    if (playing) {
      if (Platform.OS === "web" && audioRef.current) {
        audioRef.current.pause();
      }
      stopTimer();
      setPlaying(false);
    } else {
      setPlaying(true);
      startTimer();
      await loadAndPlay();
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (Platform.OS === "web" && audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [stopTimer]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
  const progress = Math.min(elapsed / totalSec, 1);

  return (
    <Pressable style={{ flex: 1 }} onPress={() => dimmed && setDimmed(false)}>
      <LinearGradient
        colors={[...currentScene.bg, "#000"]}
        style={{ flex: 1, opacity: dimmed ? 0.25 : 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </Pressable>
            <Text style={{ flex: 1, color: "#FFF", fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
              {lang === "ar" ? story.titleAr : story.titleEn}
            </Text>
          </View>

          {/* Main illustration */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Text style={{ fontSize: 130 }}>{currentScene.emoji}</Text>

            {finished && (
              <View style={{ backgroundColor: "rgba(124,58,237,0.8)", borderRadius: 20, padding: 20, marginHorizontal: 24, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontSize: 26, marginBottom: 8 }}>🌙</Text>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 18, textAlign: "center" }}>
                  {lang === "ar" ? "قصة جميلة! تصبح على خير 💫" : "Sweet dreams! Goodnight 💫"}
                </Text>
              </View>
            )}
          </View>

          {/* Sleepy Adam in corner */}
          <View style={{ position: "absolute", bottom: 180, right: 20 }}>
            <Text style={{ fontSize: 40 }}>{ADAM_SLEEPY_FRAMES[sleepyFrame]}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textAlign: "center" }}>
              {profile?.hero === "girl" ? "Lulu" : "Adam"}
            </Text>
          </View>

          {/* Controls */}
          <View style={{ padding: 24, gap: 20 }}>
            {/* Progress bar */}
            <View style={{ gap: 6 }}>
              <View
                style={{
                  height: 4,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${progress * 100}%`,
                    height: "100%",
                    backgroundColor: "#a78bfa",
                    borderRadius: 2,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                  {formatTime(elapsed)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                  {formatTime(totalSec)}
                </Text>
              </View>
            </View>

            {/* Play / Pause button */}
            <Pressable
              onPress={togglePlay}
              disabled={loading}
              style={({ pressed }) => ({
                alignSelf: "center",
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: loading ? "rgba(167,139,250,0.4)" : "#7c3aed",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
                shadowColor: "#7c3aed",
                shadowOpacity: 0.6,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              })}
            >
              {loading ? (
                <Text style={{ fontSize: 28 }}>⏳</Text>
              ) : (
                <Ionicons
                  name={playing ? "pause" : "play"}
                  size={36}
                  color="#FFF"
                />
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
