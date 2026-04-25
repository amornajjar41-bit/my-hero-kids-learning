import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { speak } from "@/lib/audio";

type Q = { a: number; b: number; op: "+" | "-" | "×"; ans: number };

function makeQ(level: number): Q {
  const ops: Q["op"][] = level < 2 ? ["+"] : level < 4 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)]!;
  const max = level < 2 ? 10 : level < 4 ? 20 : 12;
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;
  if (op === "-" && b > a) [a, b] = [b, a];
  const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { a, b, op, ans };
}

function options(ans: number) {
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const off = Math.floor(Math.random() * 6) + 1;
    set.add(Math.max(0, ans + (Math.random() > 0.5 ? off : -off)));
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

export default function MathBlast() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, saveProgress } = useApp();
  const lang = profile?.language ?? "en";
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<"" | "ok" | "no">("");
  const q = useMemo(() => makeQ(Math.floor(level / 2)), [level]);
  const opts = useMemo(() => options(q.ans), [q]);

  const choose = (n: number) => {
    if (n === q.ans) {
      setScore((s) => s + 1);
      setFeedback("ok");
      speak(lang === "ar" ? "ممتاز!" : "Yes!", voice).catch(() => {});
      setTimeout(() => {
        setFeedback("");
        if (level + 1 >= 8) setDone(true);
        else setLevel((l) => l + 1);
      }, 600);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(""), 600);
    }
  };

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
          💥 {t("mathBlast")}
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
              ⭐ {score}/8
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
              {t("level")} {level + 1} / 8
            </Text>
            <Text
              style={{
                fontSize: 60,
                fontWeight: "800",
                color: c.primary,
                textAlign: "center",
                marginVertical: 22,
              }}
            >
              {q.a} {q.op} {q.b} = ?
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
            {opts.map((n) => (
              <Pressable
                key={n}
                onPress={() => choose(n)}
                style={({ pressed }) => ({
                  width: "44%",
                  paddingVertical: 26,
                  borderRadius: 18,
                  backgroundColor: c.accent,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    color: c.accentForeground,
                    fontWeight: "800",
                    fontSize: 30,
                  }}
                >
                  {n}
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
