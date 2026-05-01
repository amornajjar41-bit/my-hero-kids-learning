import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { mathLevels } from "@/constants/games-data";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang, useT } from "@/hooks/useT";
import { speak, stopAll as stopAudio } from "@/lib/audio";
import {
  preloadMathAudio,
  mathNumPath,
  mathOpPath,
  mathCorrectPath,
  playPreloaded,
  stopPreloaded,
} from "@/lib/lessonAudio";

type Q = { a: number; b: number; op: string; ans: number };

function makeQ(levelIdx: number): Q {
  const lvl = mathLevels[levelIdx] ?? mathLevels[0]!;
  const op = lvl.ops[Math.floor(Math.random() * lvl.ops.length)]!;
  const max = lvl.maxNum;
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * (op === "×" ? 12 : max)) + 1;
  if (op === "-" && b > a) [a, b] = [b, a];
  if (op === "÷") {
    b = Math.floor(Math.random() * 9) + 2;
    a = b * (Math.floor(Math.random() * 9) + 1);
  }
  const ans = op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b;
  return { a, b, op, ans };
}

// Generate a full level's questions with no consecutive repeats
function generateLevelQuestions(levelIdx: number, count: number): Q[] {
  const qs: Q[] = [];
  for (let i = 0; i < count; i++) {
    let candidate: Q;
    let attempts = 0;
    do {
      candidate = makeQ(levelIdx);
      attempts++;
    } while (
      attempts < 15 &&
      qs.length > 0 &&
      qs[qs.length - 1]!.a === candidate.a &&
      qs[qs.length - 1]!.b === candidate.b &&
      qs[qs.length - 1]!.op === candidate.op
    );
    qs.push(candidate);
  }
  return qs;
}

function buildOptions(ans: number): number[] {
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const off = Math.floor(Math.random() * 8) + 1;
    set.add(Math.max(0, ans + (Math.random() > 0.5 ? off : -off)));
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

export default function MathBlast() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { profile, saveProgress, addPoints } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [levelIdx, setLevelIdx] = useState(0);
  const [questionNo, setQuestionNo] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<"" | "ok" | "no">("");

  // Pre-generate all questions for the current level — no repeats, no re-randomizing mid-level
  const [levelQuestions, setLevelQuestions] = useState<Q[]>(() =>
    generateLevelQuestions(0, mathLevels[0]!.questionsPerLevel)
  );

  const currentLevel = mathLevels[levelIdx] ?? mathLevels[0]!;
  const totalQuestions = mathLevels.reduce((s, l) => s + l.questionsPerLevel, 0);
  const globalQ = mathLevels.slice(0, levelIdx).reduce((s, l) => s + l.questionsPerLevel, 0) + questionNo;

  const q = levelQuestions[questionNo] ?? levelQuestions[0]!;
  const opts = useMemo(() => buildOptions(q.ans), [q.a, q.b, q.op]);

  // Re-generate questions when level advances
  useEffect(() => {
    setLevelQuestions(generateLevelQuestions(levelIdx, currentLevel.questionsPerLevel));
    setQuestionNo(0);
  }, [levelIdx]);

  useEffect(() => {
    preloadMathAudio();
    return () => {
      stopPreloaded();
      stopAudio();
    };
  }, [lang]);

  const opWord = (op: string): string => {
    const en: Record<string, string> = { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" };
    return en[op] ?? op;
  };

  // Read question aloud — short delay then play parts sequentially
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const opKey = (q.op === "+" ? "plus" : q.op === "-" ? "minus" : q.op === "×" ? "times" : "div") as Parameters<typeof mathOpPath>[0];
      const aPath = mathNumPath(q.a);
      const opPath = mathOpPath(opKey);
      const bPath = mathNumPath(q.b);

      // Try preloaded path: play a → op → b with short gaps
      const hitA = await playPreloaded(aPath);
      if (cancelled) return;
      if (!hitA) {
        // Cache miss — speak whole equation at faster speed to reduce perceived latency
        speak(`${q.a} ${opWord(q.op)} ${q.b}`, voice, 1.3).catch(() => {});
        return;
      }
      await new Promise<void>((r) => setTimeout(r, 60));
      if (cancelled) return;
      await playPreloaded(opPath);
      await new Promise<void>((r) => setTimeout(r, 60));
      if (cancelled) return;
      await playPreloaded(bPath);
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q]);

  const choose = useCallback((n: number) => {
    if (feedback) return;
    if (n === q.ans) {
      setScore((s) => s + 1);
      setFeedback("ok");
      const variant = Math.floor(Math.random() * 5);
      playPreloaded(mathCorrectPath(variant), () =>
        speak("Correct!", voice)
      ).catch(() => {});
      setTimeout(() => {
        setFeedback("");
        const nextQ = questionNo + 1;
        if (nextQ >= currentLevel.questionsPerLevel) {
          const nextLevel = levelIdx + 1;
          if (nextLevel >= mathLevels.length) setDone(true);
          else setLevelIdx(nextLevel);
        } else {
          setQuestionNo(nextQ);
        }
      }, 800);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(""), 700);
    }
  }, [feedback, q, questionNo, currentLevel, levelIdx, lang, voice]);

  useEffect(() => {
    if (done) {
      saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + score }));
      addPoints(15);
    }
  }, [done]);

  const levelLabel = currentLevel.label;

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
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>💥 {t("mathBlast")}</Text>
        <Text style={{ fontWeight: "800", color: c.text }}>⭐ {score}</Text>
      </View>

      {done ? (
        <View style={{ flex: 1, padding: 18, gap: 16 }}>
          <Confetti count={80} />
          <SoftCard color={c.primary}>
            <Text style={{ fontSize: 64, textAlign: "center" }}>🏆</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 24, textAlign: "center", marginTop: 8 }}>
              Math Champion!
            </Text>
            <Text style={{ color: "#FFF", fontWeight: "700", textAlign: "center", marginTop: 6 }}>
              ⭐ {score} / {totalQuestions} correct
            </Text>
          </SoftCard>
          <PrimaryButton title={t("done")} fullWidth onPress={() => router.back()} />
        </View>
      ) : (
        <View style={{ flex: 1, padding: 18, gap: 14 }}>
          <View style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" }}>
            <Text style={{ color: c.accentForeground, fontWeight: "800", fontSize: 12 }}>
              {levelLabel} · {questionNo + 1}/{currentLevel.questionsPerLevel}
            </Text>
          </View>

          <View style={{ height: 6, backgroundColor: c.border, borderRadius: 6 }}>
            <View style={{ height: 6, borderRadius: 6, backgroundColor: c.primary, width: `${((globalQ + 1) / totalQuestions) * 100}%` }} />
          </View>

          <SoftCard>
            <Text style={{ fontSize: 64, fontWeight: "800", color: c.primary, textAlign: "center", marginVertical: 20, letterSpacing: 2 }}>
              {q.a} {q.op} {q.b} = ?
            </Text>
          </SoftCard>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {opts.map((n) => (
              <Pressable
                key={n}
                onPress={() => choose(n)}
                style={({ pressed }) => ({
                  width: "44%", paddingVertical: 26, borderRadius: 18,
                  backgroundColor:
                    feedback === "ok" && n === q.ans ? c.green :
                    feedback === "no" && n === q.ans ? c.destructive : c.accent,
                  alignItems: "center", opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: c.accentForeground, fontWeight: "800", fontSize: 28 }}>{n}</Text>
              </Pressable>
            ))}
          </View>

          {feedback === "ok" && (
            <Text style={{ textAlign: "center", color: c.green, fontWeight: "800", fontSize: 18 }}>🎉 {t("correct")}</Text>
          )}
          {feedback === "no" && (
            <Text style={{ textAlign: "center", color: c.destructive, fontWeight: "800" }}>
              {t("oops")} — try again!
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
