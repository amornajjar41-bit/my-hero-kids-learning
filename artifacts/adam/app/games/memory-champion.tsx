import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useLang } from "@/hooks/useT";
import { playChime } from "@/lib/chime";

// ── Round 1 data: Word Flash ────────────────────────────────────────────────
const WORD_FLASH_ITEMS = [
  { word: "APPLE",  emoji: "🍎", ar: "تفاحة",  arOptions: ["تفاحة","موزة","عنبة","برتقالة"] },
  { word: "MOON",   emoji: "🌙", ar: "قمر",    arOptions: ["شمس","قمر","نجمة","كوكب"] },
  { word: "FISH",   emoji: "🐟", ar: "سمكة",   arOptions: ["قطة","سمكة","كلب","أسد"] },
  { word: "FLOWER", emoji: "🌸", ar: "زهرة",   arOptions: ["شجرة","غيمة","زهرة","بحر"] },
  { word: "STAR",   emoji: "⭐", ar: "نجمة",   arOptions: ["قمر","شمس","نجمة","سماء"] },
];

// ── Round 2 data: Sequence Memory ──────────────────────────────────────────
const SEQUENCES = [
  { colors: ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4"], sequence: [0,2,1,3] },
  { colors: ["#FF8A4C","#A78BFA","#F472B6","#34D399"], sequence: [1,3,0,2] },
  { colors: ["#FDE68A","#7C3AED","#EC4899","#10B981"], sequence: [2,0,3,1] },
];

// ── Round 3 data: Story Memory ─────────────────────────────────────────────
const STORY_MEMORY_EN = {
  story: "Leo the lion found a red ball in the jungle. He bounced it 3 times, then gave it to his friend Mia the monkey. Mia loved it so much she climbed to the TOP of a tall green tree to show everyone!",
  questions: [
    { q: "What color was the ball?", options: ["Blue","Red","Yellow","Green"], answer: 1 },
    { q: "How many times did Leo bounce it?", options: ["2","5","3","7"], answer: 2 },
    { q: "Who did Leo give the ball to?", options: ["Mia the monkey","Zara the zebra","Ben the bear","Tom the tiger"], answer: 0 },
  ],
};
const STORY_MEMORY_AR = {
  story: "ليو الأسد وجد كرة حمراء في الغابة. قفزها ٣ مرات، ثم أعطاها لصديقته ميا القردة. أحبّتها ميا كثيراً فتسلّقت أعلى شجرة خضراء طويلة لتريها للجميع!",
  questions: [
    { q: "ما لون الكرة؟", options: ["زرقاء","حمراء","صفراء","خضراء"], answer: 1 },
    { q: "كم مرة قفزها ليو؟", options: ["٢","٥","٣","٧"], answer: 2 },
    { q: "لمن أعطى ليو الكرة؟", options: ["ميا القردة","زارا الحمار الوحشي","بن الدب","توم النمر"], answer: 0 },
  ],
};

type Phase = "intro" | "r1-show" | "r1-quiz" | "r2-show" | "r2-quiz" | "r3-story" | "r3-quiz" | "done";

export default function MemoryChampion() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const { saveProgress, addPoints } = useApp();

  const [phase, setPhase] = useState<Phase>("intro");
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Round 1 state
  const [r1Index, setR1Index]   = useState(0);
  const [r1Showing, setR1Showing] = useState(true);
  const r1Fade = useRef(new Animated.Value(1)).current;

  // Round 2 state
  const seqData = SEQUENCES[Math.floor(Math.random() * SEQUENCES.length)];
  const [r2SeqIdx, setR2SeqIdx] = useState(-1);   // which tile is highlighted
  const [r2UserSeq, setR2UserSeq] = useState<number[]>([]);
  const [r2Phase, setR2Phase] = useState<"showing"|"input">("showing");
  const [r2Done, setR2Done] = useState(false);

  // Round 3 state
  const storyData = lang === "ar" ? STORY_MEMORY_AR : STORY_MEMORY_EN;
  const [r3QuestionIdx, setR3QuestionIdx] = useState(0);
  const [r3ShowStory, setR3ShowStory] = useState(true);

  // ── Round 2 sequence animation ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "r2-show") return;
    const seq = seqData.sequence;
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setR2SeqIdx(seq[i]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => { setR2SeqIdx(-1); setR2Phase("input"); }, 600);
      }
    }, 900);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Round 1: flash word then hide ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "r1-show") return;
    setR1Showing(true);
    r1Fade.setValue(1);
    const timer = setTimeout(() => {
      Animated.timing(r1Fade, { toValue: 0, duration: 400, useNativeDriver: false }).start(() => {
        setR1Showing(false);
        setPhase("r1-quiz");
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase, r1Index]);

  function addScore(pts: number) { setTotalScore((s) => s + pts); }

  function showFeedback(correct: boolean, next: () => void) {
    playChime(correct ? "success" : "wrong");
    setFeedback(correct
      ? (lang === "ar" ? "🎉 صحيح! رائع!" : "🎉 Correct! Amazing!")
      : (lang === "ar" ? "🤔 حاول مرة ثانية... الإجابة كانت مختلفة!" : "🤔 Not quite! The answer was different!"));
    if (correct) addScore(1);
    setTimeout(() => { setFeedback(null); next(); }, 1400);
  }

  // ── R1 answer ─────────────────────────────────────────────────────────────
  function answerR1(idx: number) {
    const item = WORD_FLASH_ITEMS[r1Index];
    const correct = lang === "ar"
      ? item.arOptions[idx] === item.ar
      : (idx === 0); // correct answer is always index 0 after shuffle
    const nextR1 = () => {
      if (r1Index < WORD_FLASH_ITEMS.length - 1) {
        setR1Index(r1Index + 1);
        setPhase("r1-show");
      } else {
        setPhase("r2-show");
      }
    };
    showFeedback(correct, nextR1);
  }

  // Build shuffled options for R1 english
  function getR1Options(item: typeof WORD_FLASH_ITEMS[0]) {
    if (lang === "ar") return item.arOptions;
    const distractors = ["BANANA","CLOUD","TIGER","RIVER","BOOK","TRAIN","MOON","APPLE","FISH","FLOWER","STAR"].filter(d => d !== item.word).slice(0, 3);
    return [item.word, ...distractors].sort(() => Math.random() - 0.5);
  }

  // ── R2 tap sequence ───────────────────────────────────────────────────────
  function tapSequenceTile(idx: number) {
    if (r2Phase !== "input" || r2Done) return;
    playChime("tap");
    const newSeq = [...r2UserSeq, idx];
    setR2UserSeq(newSeq);
    const expected = seqData.sequence[newSeq.length - 1];
    if (idx !== expected) {
      playChime("wrong");
      setFeedback(lang === "ar" ? "🤔 الترتيب مختلف — حاول مرة ثانية!" : "🤔 Wrong order — try again!");
      setTimeout(() => {
        setFeedback(null);
        setR2UserSeq([]);
      }, 1200);
    } else if (newSeq.length === seqData.sequence.length) {
      addScore(2);
      setR2Done(true);
      playChime("success");
      setFeedback(lang === "ar" ? "🎉 الترتيب صحيح! عبقري!" : "🎉 Perfect sequence! Genius!");
      setTimeout(() => { setFeedback(null); setPhase("r3-story"); }, 1400);
    }
  }

  // ── R3 story answer ───────────────────────────────────────────────────────
  function answerR3(optionIdx: number) {
    const q = storyData.questions[r3QuestionIdx];
    const correct = optionIdx === q.answer;
    const next = () => {
      if (r3QuestionIdx < storyData.questions.length - 1) {
        setR3QuestionIdx(r3QuestionIdx + 1);
      } else {
        setPhase("done");
        setShowConfetti(true);
        playChime("celebration");
        const final = totalScore;
        saveProgress((p) => ({
          ...p,
          gamesPlayed: p.gamesPlayed + 1,
          starsTotal: p.starsTotal + Math.min(5, Math.ceil(final * 5 / 8)),
        }));
        addPoints(15);
      }
    };
    showFeedback(correct, next);
  }

  const currentItem = WORD_FLASH_ITEMS[r1Index];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }} edges={["top"]}>
      {showConfetti && <Confetti />}

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 10 }}>
        <Pressable
          onPress={() => { playChime("tap"); router.back(); }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#FFF", fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ color: "#A78BFA", fontWeight: "900", fontSize: 20, flex: 1 }}>
          🧠 {lang === "ar" ? "بطل الذاكرة" : "Memory Champion"}
        </Text>
        <View style={{ backgroundColor: "rgba(167,139,250,0.2)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: "#A78BFA", fontWeight: "800" }}>⭐ {totalScore}</Text>
        </View>
      </View>

      {/* Feedback overlay */}
      {feedback && (
        <View style={{ position: "absolute", top: 80, left: 20, right: 20, zIndex: 100, backgroundColor: feedback.includes("🎉") ? "#10B981" : "#F59E0B", borderRadius: 18, padding: 18, alignItems: "center" }}>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18, textAlign: "center" }}>{feedback}</Text>
        </View>
      )}

      <View style={{ flex: 1, padding: 20, gap: 20, justifyContent: "center" }}>

        {/* INTRO */}
        {phase === "intro" && (
          <LinearGradient colors={["#1e1b4b","#312e81"]} style={{ borderRadius: 24, padding: 28, alignItems: "center", gap: 16 }}>
            <Text style={{ fontSize: 60 }}>🧠</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, textAlign: "center" }}>
              {lang === "ar" ? "بطل الذاكرة" : "Memory Champion"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              {lang === "ar"
                ? "٣ جولات تختبر ذاكرتك المذهلة!\n🔤 وميض الكلمات • 🎨 تسلسل الألوان • 📖 ذاكرة القصة"
                : "3 rounds to test your amazing memory!\n🔤 Word Flash • 🎨 Color Sequence • 📖 Story Memory"}
            </Text>
            <Pressable
              onPress={() => { playChime("tap"); setPhase("r1-show"); }}
              style={({ pressed }) => ({ backgroundColor: "#6d28d9", borderRadius: 18, paddingVertical: 16, paddingHorizontal: 32, opacity: pressed ? 0.88 : 1 })}
            >
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
                {lang === "ar" ? "ابدأ! 🚀" : "Start! 🚀"}
              </Text>
            </Pressable>
          </LinearGradient>
        )}

        {/* ROUND 1 — Word Flash */}
        {(phase === "r1-show" || phase === "r1-quiz") && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: "#A78BFA", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
              {lang === "ar" ? `الجولة ١ — وميض الكلمات (${r1Index + 1}/${WORD_FLASH_ITEMS.length})` : `Round 1 — Word Flash (${r1Index + 1}/${WORD_FLASH_ITEMS.length})`}
            </Text>
            <LinearGradient colors={["#1e1b4b","#312e81"]} style={{ borderRadius: 24, padding: 36, alignItems: "center" }}>
              {phase === "r1-show" && (
                <Animated.View style={{ opacity: r1Fade, alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 72 }}>{currentItem.emoji}</Text>
                  <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 28 }}>
                    {lang === "ar" ? currentItem.ar : currentItem.word}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    {lang === "ar" ? "تذكّر هذه الكلمة!" : "Remember this word!"}
                  </Text>
                </Animated.View>
              )}
              {phase === "r1-quiz" && (
                <View style={{ alignItems: "center", gap: 12, width: "100%" }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "700" }}>
                    {lang === "ar" ? "ما هي الكلمة؟" : "What was the word?"}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                    {getR1Options(currentItem).map((opt, i) => (
                      <Pressable
                        key={i}
                        onPress={() => answerR1(lang === "ar" ? currentItem.arOptions.indexOf(opt) : (opt === currentItem.word ? 0 : i))}
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? "#6d28d9" : "rgba(255,255,255,0.12)",
                          borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
                          borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* ROUND 2 — Sequence */}
        {(phase === "r2-show" || phase === "r2-quiz") && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: "#A78BFA", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
              {lang === "ar" ? "الجولة ٢ — تسلسل الألوان" : "Round 2 — Color Sequence"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" }}>
              {r2Phase === "showing"
                ? (lang === "ar" ? "شاهد الترتيب..." : "Watch the order...")
                : (lang === "ar" ? "الآن اضغط بنفس الترتيب!" : "Now tap in the same order!")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {seqData.colors.map((color, i) => (
                <Pressable
                  key={i}
                  onPress={() => tapSequenceTile(i)}
                  disabled={r2Phase === "showing"}
                  style={({ pressed }) => ({
                    width: 120, height: 120, borderRadius: 20,
                    backgroundColor: color,
                    opacity: r2SeqIdx === i ? 1 : (r2Phase === "showing" ? 0.4 : (pressed ? 0.7 : 0.85)),
                    transform: [{ scale: r2SeqIdx === i ? 1.1 : 1 }],
                    borderWidth: r2SeqIdx === i ? 4 : 0,
                    borderColor: "#FFF",
                    alignItems: "center", justifyContent: "center",
                  })}
                >
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 28 }}>
                    {r2UserSeq.includes(i) && r2Phase === "input" ? "✓" : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ROUND 3 — Story Memory */}
        {phase === "r3-story" && r3ShowStory && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: "#A78BFA", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
              {lang === "ar" ? "الجولة ٣ — ذاكرة القصة" : "Round 3 — Story Memory"}
            </Text>
            <LinearGradient colors={["#1e1b4b","#312e81"]} style={{ borderRadius: 24, padding: 22 }}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
                {lang === "ar" ? "اقرأ القصة بعناية ثم أجب على الأسئلة!" : "Read the story carefully, then answer questions!"}
              </Text>
              <Text style={{ color: "#FFF", fontSize: 16, lineHeight: 26 }}>{storyData.story}</Text>
            </LinearGradient>
            <Pressable
              onPress={() => { playChime("tap"); setR3ShowStory(false); }}
              style={({ pressed }) => ({ backgroundColor: "#6d28d9", borderRadius: 18, paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.88 : 1 })}
            >
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 17 }}>
                {lang === "ar" ? "جاهز للأسئلة! 🎯" : "Ready for questions! 🎯"}
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "r3-story" && !r3ShowStory && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: "#A78BFA", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
              {lang === "ar" ? `سؤال ${r3QuestionIdx + 1} من ${storyData.questions.length}` : `Question ${r3QuestionIdx + 1} of ${storyData.questions.length}`}
            </Text>
            <LinearGradient colors={["#1e1b4b","#312e81"]} style={{ borderRadius: 24, padding: 22, gap: 16 }}>
              <Text style={{ color: "#FDE68A", fontSize: 17, fontWeight: "700", textAlign: "center" }}>
                {storyData.questions[r3QuestionIdx].q}
              </Text>
              {storyData.questions[r3QuestionIdx].options.map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={() => answerR3(i)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#6d28d9" : "rgba(255,255,255,0.1)",
                    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>
                    {["🅐","🅑","🅒","🅓"][i]} {opt}
                  </Text>
                </Pressable>
              ))}
            </LinearGradient>
          </View>
        )}

        {/* DONE */}
        {phase === "done" && (
          <LinearGradient colors={["#F59E0B","#f97316"]} style={{ borderRadius: 24, padding: 28, alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 60 }}>🏆</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 24, textAlign: "center" }}>
              {lang === "ar" ? "أنت بطل الذاكرة!" : "Memory Champion!"}
            </Text>
            <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700" }}>
              {lang === "ar" ? `نقاطك: ${totalScore}/8` : `Score: ${totalScore}/8`}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              {lang === "ar"
                ? "ذاكرتك قوية جداً! استمر في التدريب لتصبح أقوى! 🧠✨"
                : "Your memory is incredible! Keep practicing to get even stronger! 🧠✨"}
            </Text>
            <Pressable
              onPress={() => { playChime("tap"); router.back(); }}
              style={({ pressed }) => ({ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, opacity: pressed ? 0.85 : 1 })}
            >
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>
                {lang === "ar" ? "← العب مرة ثانية" : "← Play Again"}
              </Text>
            </Pressable>
          </LinearGradient>
        )}
      </View>
    </SafeAreaView>
  );
}
