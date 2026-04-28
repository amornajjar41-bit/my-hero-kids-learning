import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

  const currentLevel = mathLevels[levelIdx] ?? mathLevels[0]!;
  const totalQuestions = mathLevels.reduce((s, l) => s + l.questionsPerLevel, 0);
  const globalQ = mathLevels.slice(0, levelIdx).reduce((s, l) => s + l.questionsPerLevel, 0) + questionNo;

  const q = useMemo(() => makeQ(levelIdx), [levelIdx, questionNo]);
  const opts = useMemo(() => buildOptions(q.ans), [q]);

  useEffect(() => {
    preloadMathAudio(lang);
    return () => {
      stopPreloaded();
      stopAudio();
    };
  }, [lang]);

  // Map operator symbols to spoken words
  const opWord = (op: string): string => {
    if (lang === "ar") {
      const ar: Record<string, string> = { "+": "زائد", "-": "ناقص", "×": "ضرب", "÷": "قسمة" };
      return ar[op] ?? op;
    }
    const en: Record<string, string> = { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" };
    return en[op] ?? op;
  };

  // Read question aloud using preloaded paths; fall back to speak() if cache miss
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const opKey = (q.op === "+" ? "plus" : q.op === "-" ? "minus" : q.op === "×" ? "times" : "div") as Parameters<typeof mathOpPath>[0];
      const aPath = mathNumPath(q.a, lang);
      const opPath = mathOpPath(opKey, lang);
      const bPath = mathNumPath(q.b, lang);
      const hitA = await playPreloaded(aPath);
      if (cancelled) return;
      if (!hitA) { speak(`${q.a} ${opWord(q.op)} ${q.b}`, voice).catch(() => {}); return; }
      await new Promise<void>((r) => setTimeout(r, 120));
      if (cancelled) return;
      await playPreloaded(opPath);
      await new Promise<void>((r) => setTimeout(r, 120));
      if (cancelled) return;
      await playPreloaded(bPath);
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [levelIdx, questionNo]);

  const choose = (n: number) => {
    if (feedback) return;
    if (n === q.ans) {
      setScore((s) => s + 1);
      setFeedback("ok");
      // Play a random pre-generated correct phrase; fall back to short TTS
      const variant = Math.floor(Math.random() * 5);
      const path = mathCorrectPath(variant, lang);
      playPreloaded(path, () =>
        speak(lang === "ar" ? "ممتاز!" : "Correct!", voice)
      ).catch(() => {});
      setTimeout(() => {
        setFeedback("");
        const nextQ = questionNo + 1;
        if (nextQ >= currentLevel.questionsPerLevel) {
          const nextLevel = levelIdx + 1;
          if (nextLevel >= mathLevels.length) setDone(true);
          else { setLevelIdx(nextLevel); setQuestionNo(0); }
        } else {
          setQuestionNo(nextQ);
        }
      }, 800);
    } else {
      setFeedback("no");
      setTimeout(() => setFeedback(""), 700);
    }
  };

  useEffect(() => {
    if (done) {
      saveProgress((p) => ({ ...p, gamesPlayed: p.gamesPlayed + 1, starsTotal: p.starsTotal + score }));
      addPoints(15);
    }
  }, [done]);

  const levelLabel = lang === "ar" ? currentLevel.labelAr : currentLevel.labelEn;

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
              {lang === "ar" ? "أنت بطل الرياضيات!" : "Math Champion!"}
            </Text>
            <Text style={{ color: "#FFF", fontWeight: "700", textAlign: "center", marginTop: 6 }}>
              ⭐ {score} / {totalQuestions} {lang === "ar" ? "إجابة صحيحة" : "correct"}
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
              {t("oops")} — {lang === "ar" ? "حاول مرة ثانية" : "try again!"}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
