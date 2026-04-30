import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { playChime } from "@/lib/chime";
import { speak } from "@/lib/audio";

type Word = { en: string; emoji: string };

const WORDS: Word[] = [
  { en: "CAT", emoji: "🐱" }, { en: "DOG", emoji: "🐶" }, { en: "SUN", emoji: "☀️" },
  { en: "CAR", emoji: "🚗" }, { en: "BUS", emoji: "🚌" }, { en: "PEN", emoji: "✏️" },
  { en: "BAG", emoji: "🎒" }, { en: "HAT", emoji: "🎩" }, { en: "MAP", emoji: "🗺️" },
  { en: "CUP", emoji: "☕" }, { en: "BOX", emoji: "📦" }, { en: "FAN", emoji: "🌀" },
  { en: "LOG", emoji: "🪵" }, { en: "BIG", emoji: "🏔️" }, { en: "HOT", emoji: "🔥" },
];

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

export default function SpellRace() {
  const router = useRouter();
  const lang = useLang();
  const { addPoints, saveProgress } = useApp();

  const TOTAL = 6;
  const [words] = useState(() => shuffle(WORDS).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const w = words[current];
  if (!w) return null;

  const letters = useMemo(() => shuffle([...w.en, ...shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")).slice(0, 9 - w.en.length)]), [w.en]);

  useEffect(() => {
    // Speak the word when it appears
    speak(w.en, "nova", 0.85);
    setTyped([]);
    setResult(null);
  }, [w.en]);

  const handleLetter = useCallback((letter: string) => {
    if (result) return;
    const next = [...typed, letter];
    setTyped(next);
    if (next.length === w.en.length) {
      const word = next.join("");
      const correct = word === w.en;
      setResult(correct ? "correct" : "wrong");
      if (correct) { playChime("success"); } else { playChime("tap"); }
      setTimeout(() => {
        const ns = score + (correct ? 1 : 0);
        if (current + 1 >= TOTAL) {
          setScore(ns);
          setFinished(true);
          addPoints(ns * 8);
          saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + ns }));
        } else {
          setScore(ns);
          setCurrent((c) => c + 1);
        }
      }, 900);
    }
  }, [typed, w.en, result, score, current, TOTAL, addPoints, saveProgress]);

  const handleDelete = useCallback(() => {
    if (!result) setTyped((t) => t.slice(0, -1));
  }, [result]);

  const repeatWord = useCallback(() => {
    speak(w.en, "nova", 0.85);
  }, [w.en]);

  if (finished) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#1A0A1A", "#3D0A0A"]} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 20 }}>
          <Text style={{ fontSize: 80 }}>⚡</Text>
          <Text style={{ color: "#FCA5A5", fontWeight: "900", fontSize: 28, textAlign: "center" }}>{lang === "ar" ? "عظيم!" : "Lightning Fast!"}</Text>
          <Text style={{ color: "#FFF", fontSize: 18 }}>{score}/{TOTAL} {lang === "ar" ? "صحيح" : "correct"}</Text>
          <Pressable
            onPress={() => { setCurrent(0); setScore(0); setFinished(false); setTyped([]); setResult(null); }}
            style={{ backgroundColor: "#DC2626", borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14 }}
          >
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>{lang === "ar" ? "العب مجدداً" : "Play Again"}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{lang === "ar" ? "رجوع" : "Back"}</Text>
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#1A0A1A", "#2D0A14", "#1A0A1A"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 20, flex: 1 }}>
            ⚡ {lang === "ar" ? "سباق الهجاء" : "Spell Race"}
          </Text>
          <View style={{ backgroundColor: "rgba(252,165,165,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "#FCA5A5", fontWeight: "800", fontSize: 13 }}>⭐ {score}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <View style={{ width: `${(current / TOTAL) * 100}%`, height: "100%", backgroundColor: "#F97316", borderRadius: 2 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 20, gap: 16, paddingTop: 10 }}>
          {/* Emoji & hear button */}
          <View style={{ alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 70 }}>{w.emoji}</Text>
            <Pressable
              onPress={repeatWord}
              style={({ pressed }) => ({
                flexDirection: "row", gap: 8, alignItems: "center",
                backgroundColor: "rgba(249,115,22,0.2)", borderRadius: 16,
                paddingHorizontal: 16, paddingVertical: 10,
                borderWidth: 1, borderColor: "rgba(249,115,22,0.4)",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="volume-high" size={18} color="#FCA5A5" />
              <Text style={{ color: "#FCA5A5", fontWeight: "700", fontSize: 14 }}>
                {lang === "ar" ? "استمع مجدداً" : "Hear Again"}
              </Text>
            </Pressable>
          </View>

          {/* Typed letters display */}
          <View style={{ flexDirection: "row", gap: 10, minHeight: 60, alignItems: "center" }}>
            {Array.from({ length: w.en.length }).map((_, i) => {
              const letter = typed[i];
              const isCorrect = result === "correct";
              const isWrong = result === "wrong";
              return (
                <View
                  key={i}
                  style={{
                    width: 52, height: 60, borderRadius: 14, alignItems: "center", justifyContent: "center",
                    backgroundColor: letter
                      ? (result === "correct" ? "rgba(16,185,129,0.3)" : result === "wrong" ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.2)")
                      : "rgba(255,255,255,0.06)",
                    borderWidth: 2,
                    borderColor: letter
                      ? (result === "correct" ? "#10B981" : result === "wrong" ? "#EF4444" : "#F97316")
                      : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 24 }}>{letter ?? ""}</Text>
                </View>
              );
            })}
          </View>

          {result === "wrong" && (
            <Text style={{ color: "#FCA5A5", fontSize: 14 }}>
              {lang === "ar" ? `الصحيح: ${w.en}` : `Correct: ${w.en}`}
            </Text>
          )}

          {/* Letter keyboard */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", width: "100%" }}>
            {letters.map((letter, i) => (
              <Pressable
                key={`${letter}-${i}`}
                onPress={() => handleLetter(letter)}
                style={({ pressed }) => ({
                  width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(249,115,22,0.15)",
                  borderWidth: 1.5, borderColor: "rgba(249,115,22,0.3)",
                  opacity: pressed || !!result ? 0.7 : 1,
                })}
              >
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 20 }}>{letter}</Text>
              </Pressable>
            ))}
          </View>

          {/* Delete */}
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14,
              paddingHorizontal: 18, paddingVertical: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="backspace" size={18} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>
              {lang === "ar" ? "حذف" : "Delete"}
            </Text>
          </Pressable>

          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{current + 1} / {TOTAL}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

