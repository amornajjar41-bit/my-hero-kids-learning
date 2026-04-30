import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { playChime } from "@/lib/chime";

type ColorQ = {
  label: { en: string; ar: string };
  hex: string;
  choices: { label: { en: string; ar: string }; hex: string }[];
};

const COLORS = [
  { label: { en: "Red", ar: "أحمر" }, hex: "#EF4444" },
  { label: { en: "Blue", ar: "أزرق" }, hex: "#3B82F6" },
  { label: { en: "Green", ar: "أخضر" }, hex: "#10B981" },
  { label: { en: "Yellow", ar: "أصفر" }, hex: "#FCD34D" },
  { label: { en: "Purple", ar: "بنفسجي" }, hex: "#8B5CF6" },
  { label: { en: "Orange", ar: "برتقالي" }, hex: "#F97316" },
  { label: { en: "Pink", ar: "وردي" }, hex: "#EC4899" },
  { label: { en: "Brown", ar: "بني" }, hex: "#92400E" },
  { label: { en: "Black", ar: "أسود" }, hex: "#1F2937" },
  { label: { en: "White", ar: "أبيض" }, hex: "#F9FAFB" },
];

function makeQuestion(): ColorQ {
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  const correct = shuffled[0]!;
  const choices = shuffled.slice(0, 4);
  return { label: correct.label, hex: correct.hex, choices };
}

export default function ColorBurst() {
  const router = useRouter();
  const lang = useLang();
  const { addPoints, saveProgress } = useApp();

  const TOTAL = 8;
  const [q, setQ] = useState(() => makeQuestion());
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const glowAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [glowAnim]);

  const startTimer = useCallback(() => {
    setTimeLeft(5);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Time's up — move on
          setSelected("timeout");
          setTimeout(() => next(false), 600);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [q]);

  const next = useCallback((correct: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const newScore = score + (correct ? 1 : 0);
    if (current + 1 >= TOTAL) {
      setScore(newScore);
      setFinished(true);
      addPoints(newScore * 5);
      saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + newScore }));
    } else {
      setScore(newScore);
      setCurrent((c) => c + 1);
      setSelected(null);
      setQ(makeQuestion());
    }
  }, [current, score, TOTAL, addPoints, saveProgress]);

  const handlePick = useCallback((hex: string) => {
    if (selected) return;
    const correct = hex === q.hex;
    setSelected(hex);
    if (timerRef.current) clearInterval(timerRef.current);
    if (correct) playChime("success"); else playChime("tap");
    setTimeout(() => next(correct), 700);
  }, [selected, q.hex, next]);

  if (finished) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#1A0A3F", "#2D1B69"]} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 20 }}>
          <Text style={{ fontSize: 80 }}>🎨</Text>
          <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 28, textAlign: "center" }}>{lang === "ar" ? "رائع!" : "Awesome!"}</Text>
          <Text style={{ color: "#FFF", fontSize: 18 }}>{score}/{TOTAL} {lang === "ar" ? "صحيح" : "correct"}</Text>
          <Pressable
            onPress={() => { setCurrent(0); setScore(0); setFinished(false); setSelected(null); setQ(makeQuestion()); }}
            style={{ backgroundColor: "#F59E0B", borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14 }}
          >
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 16 }}>{lang === "ar" ? "العب مجدداً" : "Play Again"}</Text>
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
      <LinearGradient colors={["#1A0A3F", "#2D1B69"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 20, flex: 1 }}>
            🎨 {lang === "ar" ? "انفجار الألوان" : "Color Burst"}
          </Text>
          <View style={{ backgroundColor: "rgba(253,230,138,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13 }}>⭐ {score}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <View style={{ width: `${(current / TOTAL) * 100}%`, height: "100%", backgroundColor: "#A78BFA", borderRadius: 2 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, gap: 24 }}>
          {/* Question */}
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, textAlign: "center" }}>
            {lang === "ar" ? "أين اللون" : "Tap"}{" "}
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 22 }}>
              {lang === "ar" ? q.label.ar : q.label.en}
            </Text>
            {lang === "en" ? "?" : "؟"}
          </Text>

          {/* Timer circle */}
          <Animated.View style={{
            width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center",
            backgroundColor: timeLeft <= 2 ? "rgba(239,68,68,0.3)" : "rgba(167,139,250,0.2)",
            borderWidth: 2, borderColor: timeLeft <= 2 ? "#EF4444" : "rgba(167,139,250,0.5)",
            opacity: glowAnim,
          }}>
            <Text style={{ color: timeLeft <= 2 ? "#FCA5A5" : "#C4B5FD", fontWeight: "900", fontSize: 24 }}>{timeLeft}</Text>
          </Animated.View>

          {/* Color circles */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            {q.choices.map((choice) => {
              const isSelected = selected === choice.hex;
              const isCorrect = choice.hex === q.hex;
              const ring = isSelected
                ? (isCorrect ? "#10B981" : "#EF4444")
                : (selected && isCorrect ? "#10B981" : "transparent");
              return (
                <Pressable
                  key={choice.hex}
                  onPress={() => handlePick(choice.hex)}
                  style={({ pressed }) => ({
                    width: 110, height: 110, borderRadius: 55,
                    backgroundColor: choice.hex,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 4, borderColor: ring,
                    opacity: pressed && !selected ? 0.85 : 1,
                    shadowColor: choice.hex, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
                  })}
                >
                  {isSelected && (
                    <Text style={{ fontSize: 30 }}>{isCorrect ? "✅" : "❌"}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{current + 1} / {TOTAL}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
