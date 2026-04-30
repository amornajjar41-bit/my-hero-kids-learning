import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { playChime } from "@/lib/chime";

type Question = {
  emoji: string;
  correct: { en: string; ar: string };
  options: { en: string; ar: string }[];
};

const QUESTIONS: Question[] = [
  { emoji: "🍎", correct: { en: "Apple", ar: "تفاحة" }, options: [{ en: "Apple", ar: "تفاحة" }, { en: "Orange", ar: "برتقالة" }, { en: "Mango", ar: "مانجو" }, { en: "Grape", ar: "عنب" }] },
  { emoji: "🐶", correct: { en: "Dog", ar: "كلب" }, options: [{ en: "Cat", ar: "قطة" }, { en: "Dog", ar: "كلب" }, { en: "Lion", ar: "أسد" }, { en: "Rabbit", ar: "أرنب" }] },
  { emoji: "🌞", correct: { en: "Sun", ar: "شمس" }, options: [{ en: "Moon", ar: "قمر" }, { en: "Star", ar: "نجمة" }, { en: "Sun", ar: "شمس" }, { en: "Cloud", ar: "سحابة" }] },
  { emoji: "🚗", correct: { en: "Car", ar: "سيارة" }, options: [{ en: "Bus", ar: "حافلة" }, { en: "Car", ar: "سيارة" }, { en: "Plane", ar: "طائرة" }, { en: "Boat", ar: "قارب" }] },
  { emoji: "🏠", correct: { en: "House", ar: "منزل" }, options: [{ en: "School", ar: "مدرسة" }, { en: "Hospital", ar: "مستشفى" }, { en: "House", ar: "منزل" }, { en: "Park", ar: "حديقة" }] },
  { emoji: "🎵", correct: { en: "Music", ar: "موسيقى" }, options: [{ en: "Book", ar: "كتاب" }, { en: "Music", ar: "موسيقى" }, { en: "Dance", ar: "رقص" }, { en: "Song", ar: "أغنية" }] },
  { emoji: "🌺", correct: { en: "Flower", ar: "زهرة" }, options: [{ en: "Flower", ar: "زهرة" }, { en: "Tree", ar: "شجرة" }, { en: "Leaf", ar: "ورقة" }, { en: "Grass", ar: "عشب" }] },
  { emoji: "⚽", correct: { en: "Football", ar: "كرة قدم" }, options: [{ en: "Basketball", ar: "كرة سلة" }, { en: "Tennis", ar: "تنس" }, { en: "Football", ar: "كرة قدم" }, { en: "Cricket", ar: "كريكيت" }] },
  { emoji: "🍕", correct: { en: "Pizza", ar: "بيتزا" }, options: [{ en: "Burger", ar: "برغر" }, { en: "Pizza", ar: "بيتزا" }, { en: "Pasta", ar: "مكرونة" }, { en: "Bread", ar: "خبز" }] },
  { emoji: "🦋", correct: { en: "Butterfly", ar: "فراشة" }, options: [{ en: "Bee", ar: "نحلة" }, { en: "Ant", ar: "نملة" }, { en: "Butterfly", ar: "فراشة" }, { en: "Fly", ar: "ذبابة" }] },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function EmojiQuiz() {
  const router = useRouter();
  const lang = useLang();
  const { addPoints, saveProgress } = useApp();

  const [questions] = useState(() => shuffle(QUESTIONS).slice(0, 7));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const q = questions[current];
  if (!q) return null;

  const shuffledOpts = useRef<{ en: string; ar: string }[]>([]);
  if (!selected && shuffledOpts.current.length === 0) {
    shuffledOpts.current = shuffle(q.options);
  }

  const handleAnswer = useCallback((option: { en: string; ar: string }) => {
    if (selected) return;
    const correct = option.en === q.correct.en;
    setSelected(option.en);

    if (correct) {
      playChime("success");
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setScore((s) => s + 1);
    } else {
      playChime("tap");
      Animated.sequence([
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      setSelected(null);
      shuffledOpts.current = [];
      if (current + 1 >= questions.length) {
        setFinished(true);
        const pts = (score + (correct ? 1 : 0)) * 5;
        addPoints(pts);
        saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + (score + (correct ? 1 : 0)) }));
      } else {
        setCurrent((c) => c + 1);
      }
    }, 900);
  }, [selected, q, current, questions.length, score, shake, scale, addPoints, saveProgress]);

  if (finished) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#1A0A3F", "#2D1B69"]} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 20 }}>
          <Text style={{ fontSize: 80 }}>🏆</Text>
          <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 28, textAlign: "center" }}>
            {lang === "ar" ? "أحسنت!" : "Well Done!"}
          </Text>
          <Text style={{ color: "#FFF", fontSize: 18, textAlign: "center" }}>
            {score}/{questions.length} {lang === "ar" ? "إجابات صحيحة" : "correct answers"}
          </Text>
          <Pressable
            onPress={() => { setCurrent(0); setScore(0); setFinished(false); shuffledOpts.current = []; }}
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
            🤩 {lang === "ar" ? "مسابقة الرموز" : "Emoji Quiz"}
          </Text>
          <View style={{ backgroundColor: "rgba(253,230,138,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 13 }}>⭐ {score}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={{ marginHorizontal: 16, marginBottom: 20, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <View style={{ width: `${((current) / questions.length) * 100}%`, height: "100%", backgroundColor: "#FCD34D", borderRadius: 2 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 20 }}>
          {/* Emoji display */}
          <Animated.View style={{ transform: [{ scale }, { translateX: shake }] }}>
            <View style={{
              width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(167,139,250,0.15)", borderWidth: 2, borderColor: "rgba(167,139,250,0.3)",
              marginBottom: 24,
            }}>
              <Text style={{ fontSize: 90 }}>{q.emoji}</Text>
            </View>
          </Animated.View>

          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginBottom: 24, textAlign: "center" }}>
            {lang === "ar" ? "ما هذا الرمز؟" : "What does this emoji mean?"}
          </Text>

          {/* Options grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", width: "100%" }}>
            {shuffledOpts.current.map((opt) => {
              const isCorrect = opt.en === q.correct.en;
              const isSelected = selected === opt.en;
              let bg = "rgba(255,255,255,0.08)";
              let border = "rgba(255,255,255,0.15)";
              if (isSelected && isCorrect) { bg = "rgba(16,185,129,0.3)"; border = "#10B981"; }
              if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.3)"; border = "#EF4444"; }
              if (selected && !isSelected && isCorrect) { bg = "rgba(16,185,129,0.2)"; border = "#10B981"; }

              return (
                <Pressable
                  key={opt.en}
                  onPress={() => handleAnswer(opt)}
                  style={({ pressed }) => ({
                    width: "46%", borderRadius: 18, padding: 16, alignItems: "center",
                    backgroundColor: bg, borderWidth: 2, borderColor: border,
                    opacity: pressed && !selected ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15, textAlign: "center" }}>
                    {lang === "ar" ? opt.ar : opt.en}
                  </Text>
                  {isSelected && isCorrect && <Text style={{ fontSize: 18, marginTop: 4 }}>✅</Text>}
                  {isSelected && !isCorrect && <Text style={{ fontSize: 18, marginTop: 4 }}>❌</Text>}
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 24 }}>
            {current + 1} / {questions.length}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
