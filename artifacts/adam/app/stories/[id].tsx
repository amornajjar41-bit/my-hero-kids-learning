import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";

import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { STORIES } from "@/constants/stories-data";
import { ttsSpeak } from "@/lib/api";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

const SLEEPY_FRAMES = ["😊", "🙂", "😌", "🥱", "😴"];

function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

// ── Cross-platform audio player ──────────────────────────────────────────────
let _storyPlayer: any = null;

async function playAudioCrossPlatform(
  base64: string,
  mimeType: string,
  webAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
  rate = 0.85,
): Promise<void> {
  if (Platform.OS === "web") {
    if (webAudioRef.current) { webAudioRef.current.pause(); webAudioRef.current.src = ""; }
    const uri = `data:${mimeType || "audio/mpeg"};base64,${base64}`;
    const audio = new Audio(uri);
    audio.playbackRate = rate;
    webAudioRef.current = audio;
    await new Promise<void>((resolve) => {
      audio.onended = () => { webAudioRef.current = null; resolve(); };
      audio.onerror  = () => { webAudioRef.current = null; resolve(); };
      audio.play().catch(() => resolve());
    });
  } else {
    // Native: write base64 to temp file then play via expo-audio
    const { createAudioPlayer, AudioModule } = await import("expo-audio");
    try {
      await AudioModule.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
    } catch { /* ignore */ }
    const tmpUri = (FileSystem.cacheDirectory ?? "") + `story_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(tmpUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await new Promise<void>((resolve) => {
      const player = createAudioPlayer({ uri: tmpUri });
      _storyPlayer = player;
      player.addListener("playbackStatusUpdate", (status: any) => {
        if (status.didJustFinish || status.isLoaded === false) {
          _storyPlayer = null;
          FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
          resolve();
        }
      });
      player.play();
      // Safety timeout: 2 min max per paragraph
      setTimeout(() => { resolve(); }, 120_000);
    });
  }
}

function stopNativePlayer() {
  try { _storyPlayer?.pause(); _storyPlayer?.remove(); } catch { /* no-op */ }
  _storyPlayer = null;
}

// ────────────────────────────────────────────────────────────────────────────

export default function StoryPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lang = useLang();
  const { profile } = useApp();

  const story = STORIES.find((s) => s.id === id);
  const paragraphs = story ? splitIntoParagraphs(lang === "ar" ? story.textAr : story.textEn) : [];
  const totalSec = (story?.durationMin ?? 5) * 60;

  const [playing, setPlaying]     = useState(false);
  const [elapsed, setElapsed]     = useState(0);
  const [loading, setLoading]     = useState(false);
  const [sceneIdx, setSceneIdx]   = useState(0);
  const [sleepyFrame, setSleepyFrame] = useState(0);
  const [dimmed, setDimmed]       = useState(false);
  const [finished, setFinished]   = useState(false);
  const [paraIdx, setParaIdx]     = useState(0);

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const dimRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const sleepyRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const webAudioRef= useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef(false);
  const paraIdxRef = useRef(0);

  // Breathe animation
  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.06, duration: 2200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(breathe, { toValue: 1,    duration: 2200, useNativeDriver: false, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
  }, [breathe]);

  // Sleepy animation
  useEffect(() => {
    sleepyRef.current = setInterval(() => {
      setSleepyFrame((f) => Math.min(f + 1, SLEEPY_FRAMES.length - 1));
    }, 4000);
    return () => { if (sleepyRef.current) clearInterval(sleepyRef.current); };
  }, []);

  useEffect(() => { if (playing) setSleepyFrame(0); }, [playing]);

  // Scene detection
  useEffect(() => {
    if (!story) return;
    let idx = 0;
    for (let i = 0; i < story.scenes.length; i++) {
      if (elapsed >= (story.scenes[i]?.startSec ?? 0)) idx = i;
    }
    setSceneIdx(idx);
  }, [elapsed, story]);

  // Auto-dim
  useEffect(() => {
    if (playing) { dimRef.current = setTimeout(() => setDimmed(true), 120_000); }
    else { if (dimRef.current) clearTimeout(dimRef.current); }
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

  const playParagraph = useCallback(async (idx: number): Promise<void> => {
    if (!story || !playingRef.current) return;
    const text = paragraphs[idx];
    if (!text) {
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
      const { audioBase64, mimeType } = await ttsSpeak({ text, voice, maxChars: 700 } as any);
      if (!playingRef.current) return;
      await playAudioCrossPlatform(audioBase64, mimeType || "audio/mpeg", webAudioRef, 0.85);
      if (playingRef.current) {
        const next = idx + 1;
        paraIdxRef.current = next;
        setParaIdx(next);
        await playParagraph(next);
      }
    } catch (e) {
      console.warn("[story tts]", e);
      if (playingRef.current) {
        const next = idx + 1;
        paraIdxRef.current = next;
        setParaIdx(next);
        await playParagraph(next);
      }
    }
  }, [story, paragraphs, profile, id, stopTimer]);

  const startPlayback = useCallback(async () => {
    setLoading(true);
    playingRef.current = true;
    setPlaying(true);
    startTimer();
    try { await playParagraph(paraIdxRef.current); }
    finally { setLoading(false); }
  }, [playParagraph, startTimer]);

  const pausePlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    stopTimer();
    // Stop web audio
    if (Platform.OS === "web" && webAudioRef.current) {
      webAudioRef.current.pause();
    }
    // Stop native audio
    stopNativePlayer();
  }, [stopTimer]);

  const togglePlay = async () => {
    if (playing) { pausePlayback(); }
    else { await startPlayback(); }
  };

  useEffect(() => {
    return () => {
      playingRef.current = false;
      stopTimer();
      if (Platform.OS === "web" && webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = "";
      }
      stopNativePlayer();
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
            <Pressable onPress={() => { pausePlayback(); router.back(); }} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
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
            <View style={{ gap: 6 }}>
              <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
                <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: "#a78bfa", borderRadius: 3 }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{formatTime(elapsed)}</Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{formatTime(totalSec)}</Text>
              </View>
            </View>

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
