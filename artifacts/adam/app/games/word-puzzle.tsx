import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { puzzleWords } from "@/constants/games-data";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang, useT } from "@/hooks/useT";
import { speak, stopAll as stopAudio } from "@/lib/audio";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default function WordPuzzle() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { profile, saveProgress, addPoints } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const pool = puzzleWords[lang];
  const item = pool[round % pool.length]!;
  const target = item.word.replace(/\s+/g, "");
  const letters = useMemo(() => shuffle(target.split("")), [target, round]);
  const current = picked.map((i) => letters[i]).join("");

  useEffect(() => () => { stopAudio(); }, []);

  // Speak just the word after a short delay so the UI settles first
  useEffect(() => {
    setPicked([]);
    const timer = setTimeout(() => {
      speak(item.word, voice).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [round]);

  useEffect(() => {
    if (current.length === target.length) {
      if (current === target) {
        setScore((s) => s + 1);
        // Short celebration — just one word
        speak(lang === "ar" ? "ممتاز!" : "Correct!", voice).catch(() => {});
        setTimeout(() => {
          if (round + 1 >= 10) setDone(true);
          else setRound((r) => r + 1);
        }, 900);
      } else {
        setTimeout(() => setPicked([]), 600);
      }
    }
  }, [current, target, round, lang, voice]);

  const finish = () => {
    saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + score }));
    addPoints(15);
    router.back();
  };

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
          <Ionicons name="close" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>🧩 {t("wordPuzzle")}</Text>
        <Text style={{ fontWeight: "800", color: c.text }}>⭐ {score}</Text>
      </View>

      {done ? (
        <View style={{ flex: 1, padding: 18, gap: 18 }}>
          <Confetti count={70} />
          <SoftCard color={c.primary}>
            <Text style={{ fontSize: 60, textAlign: "center" }}>🏆</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 22, textAlign: "center", marginTop: 6 }}>
              {t("correct")}
            </Text>
            <Text style={{ color: "#FFF", fontWeight: "700", textAlign: "center", marginTop: 6 }}>⭐ {score}/10</Text>
          </SoftCard>
          <PrimaryButton title={t("done")} fullWidth onPress={finish} />
        </View>
      ) : (
        <View style={{ flex: 1, padding: 18, gap: 18 }}>
          <SoftCard>
            <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 12 }}>
              {t("level")} {round + 1} / 10
            </Text>
            <Text style={{ fontSize: 100, textAlign: "center", marginVertical: 16 }}>{item.emoji}</Text>
            <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 64 }}>
              {target.split("").map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 44, height: 56, borderRadius: 10,
                    backgroundColor: picked[i] !== undefined ? c.primary : c.muted,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ color: picked[i] !== undefined ? "#FFF" : "transparent", fontWeight: "800", fontSize: 24 }}>
                    {picked[i] !== undefined ? letters[picked[i]!] : "_"}
                  </Text>
                </View>
              ))}
            </View>
          </SoftCard>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {letters.map((l, i) => {
              const used = picked.includes(i);
              return (
                <Pressable
                  key={l + i}
                  disabled={used}
                  onPress={() => setPicked((p) => [...p, i])}
                  style={({ pressed }) => ({
                    width: 56, height: 56, borderRadius: 14,
                    backgroundColor: used ? c.muted : c.accent,
                    alignItems: "center", justifyContent: "center",
                    opacity: used ? 0.4 : pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: used ? c.mutedForeground : c.accentForeground, fontWeight: "800", fontSize: 24 }}>
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton title={t("tryAgain")} variant="ghost" fullWidth onPress={() => setPicked([])} />
        </View>
      )}
    </SafeAreaView>
  );
}
