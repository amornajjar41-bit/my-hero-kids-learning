import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { playChime } from "@/lib/chime";
import { speakText } from "@/lib/tts";

const PRAISE = ["Great job!", "Well done!", "Amazing!", "Fantastic!", "Super!"];

const ITEMS = ["⭐", "🍎", "🐟", "🎈", "🌟", "🏀", "🦋", "🍕", "🌺", "🎁"];

function makeQuestion(level: number) {
  const maxCount = Math.min(3 + level, 10);
  const count = Math.floor(Math.random() * maxCount) + 1;
  const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]!;
  const wrong1 = count === 1 ? 2 : count - 1;
  const wrong2 = count >= maxCount ? count - 2 : count + 1;
  const opts = [count, wrong1, wrong2, count + 2 > maxCount ? 1 : count + 2]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  // ensure correct is in opts
  if (!opts.includes(count)) opts[0] = count;
  return { count, item, opts: opts.sort(() => Math.random() - 0.5) };
}

export default function NumberHunt() {
  const router = useRouter();
  const lang = useLang();
  const { addPoints, saveProgress, profile } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const TOTAL = 8;
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [q, setQ] = useState(() => makeQuestion(0));

  const handlePick = useCallback((n: number) => {
    if (selected !== null) return;
    const correct = n === q.count;
    setSelected(n);
    if (correct) {
      playChime("success");
      speakText(PRAISE[Math.floor(Math.random() * PRAISE.length)]!, voice).catch(() => {});
    } else {
      playChime("tap");
    }
    setTimeout(() => {
      const newScore = score + (correct ? 1 : 0);
      if (current + 1 >= TOTAL) {
        setScore(newScore);
        setFinished(true);
        addPoints(newScore * 6);
        saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + newScore }));
      } else {
        setScore(newScore);
        setCurrent((c) => c + 1);
        setSelected(null);
        setQ(makeQuestion(current + 1));
      }
    }, 800);
  }, [selected, q.count, score, current, TOTAL, addPoints, saveProgress]);

  if (finished) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={["#0A2E1F", "#065F46"]} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 20 }}>
          <Text style={{ fontSize: 80 }}>🔢</Text>
          <Text style={{ color: "#6EE7B7", fontWeight: "900", fontSize: 28, textAlign: "center" }}>{lang === "ar" ? "ممتاز!" : "Excellent!"}</Text>
          <Text style={{ color: "#FFF", fontSize: 18 }}>{score}/{TOTAL} {lang === "ar" ? "صحيح" : "correct"}</Text>
          <Pressable
            onPress={() => { setCurrent(0); setScore(0); setFinished(false); setSelected(null); setQ(makeQuestion(0)); }}
            style={{ backgroundColor: "#10B981", borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14 }}
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
      <LinearGradient colors={["#0A2E1F", "#065F46", "#0A3A28"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 20, flex: 1 }}>
            🔢 {lang === "ar" ? "صيد الأرقام" : "Number Hunt"}
          </Text>
          <View style={{ backgroundColor: "rgba(110,231,183,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "#6EE7B7", fontWeight: "800", fontSize: 13 }}>⭐ {score}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
          <View style={{ width: `${(current / TOTAL) * 100}%`, height: "100%", backgroundColor: "#10B981", borderRadius: 2 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "space-around", paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, textAlign: "center" }}>
            {lang === "ar" ? "كم عدد هذه الرموز؟" : "How many do you see?"}
          </Text>

          {/* Items grid */}
          <View style={{
            flexDirection: "row", flexWrap: "wrap", justifyContent: "center",
            gap: 10, padding: 20,
            backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 24,
            borderWidth: 1, borderColor: "rgba(110,231,183,0.2)",
            minHeight: 160,
          }}>
            {Array.from({ length: q.count }).map((_, i) => (
              <Text key={i} style={{ fontSize: 42 }}>{q.item}</Text>
            ))}
          </View>

          {/* Answer buttons */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            {q.opts.map((n) => {
              const isSelected = selected === n;
              const isCorrect = n === q.count;
              let bg = "rgba(255,255,255,0.1)";
              let border = "rgba(255,255,255,0.2)";
              if (isSelected && isCorrect) { bg = "rgba(16,185,129,0.4)"; border = "#10B981"; }
              if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.3)"; border = "#EF4444"; }
              if (selected !== null && !isSelected && isCorrect) { bg = "rgba(16,185,129,0.25)"; border = "#10B981"; }

              return (
                <Pressable
                  key={n}
                  onPress={() => handlePick(n)}
                  style={({ pressed }) => ({
                    width: 80, height: 80, borderRadius: 40,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: bg, borderWidth: 2.5, borderColor: border,
                    opacity: pressed && selected === null ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 28 }}>{n}</Text>
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
