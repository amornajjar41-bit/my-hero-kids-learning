import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { letterMatchPairs } from "@/constants/games-data";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang, useT } from "@/hooks/useT";
import { speak, stopAll as stopAudio } from "@/lib/audio";

export default function LetterMatch() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { profile, saveProgress } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"" | "ok" | "no">("");
  const [done, setDone] = useState(false);

  const pool = letterMatchPairs[lang];

  const data = useMemo(() => {
    const correct = pool[round % pool.length]!;
    const distractors = pool
      .filter((p) => p.letter !== correct.letter)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [...distractors, correct].sort(() => Math.random() - 0.5);
    return { correct, options };
  }, [round, pool]);

  const choose = (letter: string) => {
    if (letter === data.correct.letter) {
      setScore((s) => s + 1);
      setFeedback("ok");
      speak(data.correct.letter, voice).catch(() => {});
      setTimeout(() => {
        setFeedback("");
        if (round + 1 >= 6) setDone(true);
        else setRound((r) => r + 1);
      }, 700);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(""), 600);
    }
  };

  // FIX 3: Stop audio when navigating away
  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    if (done) {
      saveProgress((p) => ({
        ...p,
        gamesPlayed: p.gamesPlayed + 1,
        starsTotal: p.starsTotal + score,
      }));
    }
  }, [done, saveProgress, score]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View
        style={{
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c.card,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>
          🔤 {t("letterMatch")}
        </Text>
        <Text style={{ fontWeight: "800", color: c.text }}>⭐ {score}</Text>
      </View>

      {done ? (
        <View style={{ flex: 1, padding: 18, gap: 16 }}>
          <Confetti count={70} />
          <SoftCard color={c.primary}>
            <Text style={{ fontSize: 60, textAlign: "center" }}>🏆</Text>
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 22,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {t("correct")}
            </Text>
            <Text
              style={{
                color: "#FFF",
                fontWeight: "700",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              ⭐ {score}/6
            </Text>
          </SoftCard>
          <PrimaryButton title={t("done")} fullWidth onPress={() => router.back()} />
        </View>
      ) : (
        <View style={{ flex: 1, padding: 18, gap: 16 }}>
          <SoftCard>
            <Text
              style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 12 }}
            >
              {t("level")} {round + 1} / 6
            </Text>
            <Text
              style={{
                fontSize: 110,
                textAlign: "center",
                marginVertical: 16,
              }}
            >
              {data.correct.emoji}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: c.mutedForeground,
                textAlign: "center",
              }}
            >
              {lang === "ar"
                ? "اضغط الحرف اللي بتبدأ فيه الصورة"
                : "Pick the letter the picture starts with"}
            </Text>
          </SoftCard>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            {data.options.map((opt) => (
              <Pressable
                key={opt.letter}
                onPress={() => choose(opt.letter)}
                style={({ pressed }) => ({
                  width: 90,
                  height: 90,
                  borderRadius: 18,
                  backgroundColor: c.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    color: c.accentForeground,
                    fontWeight: "800",
                    fontSize: 44,
                  }}
                >
                  {opt.letter}
                </Text>
              </Pressable>
            ))}
          </View>

          {feedback === "ok" && (
            <Text
              style={{
                textAlign: "center",
                color: c.green,
                fontWeight: "800",
                fontSize: 18,
              }}
            >
              🎉 {t("correct")}
            </Text>
          )}
          {feedback === "no" && (
            <Text
              style={{
                textAlign: "center",
                color: c.destructive,
                fontWeight: "800",
              }}
            >
              {t("oops")}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
