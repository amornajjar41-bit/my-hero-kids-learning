import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { sendWeeklyReport } from "@/lib/api";
import { getJSON, STORAGE_KEYS, type SafetyAlert } from "@/lib/storage";
import { trialDaysLeft } from "@/lib/utils";
import ParentPin from "./pin";

export type { SafetyAlert };

const dayLabelsEn = ["S", "M", "T", "W", "T", "F", "S"];
const dayLabelsAr = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

type GenerationState = {
  running: boolean;
  percent: number;
  message: string;
  done: boolean;
  error: string;
};

const GEN_IDLE: GenerationState = { running: false, percent: 0, message: "", done: false, error: "" };

export default function ParentDashboard() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, progress, resetAll, patchProfile } = useApp();

  const [pinVerified, setPinVerified] = useState(false);
  const [sentMsg, setSentMsg] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [heroSwitchMsg, setHeroSwitchMsg] = useState("");

  const [lessonGen, setLessonGen] = useState<GenerationState>(GEN_IDLE);
  const [storyGen, setStoryGen] = useState<GenerationState>(GEN_IDLE);
  const [chatPrewarm, setChatPrewarm] = useState<GenerationState>(GEN_IDLE);
  const lessonAbortRef = useRef<AbortController | null>(null);
  const storyAbortRef = useRef<AbortController | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getJSON<SafetyAlert[]>(STORAGE_KEYS.safetyAlerts).then((v) => {
      if (v && Array.isArray(v)) setSafetyAlerts(v);
    });
  }, []);

  if (!pinVerified) {
    return <ParentPin onSuccess={() => setPinVerified(true)} onBack={() => router.back()} />;
  }

  if (!profile) return null;
  const lang = profile.language;
  const dayLabels = lang === "ar" ? dayLabelsAr : dayLabelsEn;

  const trialDays = trialDaysLeft(profile.trialStartedAt);
  const max = Math.max(1, ...progress.weekly);

  const usedMinutes = progress.dailyUsageDate === new Date().toISOString().slice(0, 10)
    ? Math.round(progress.dailyUsageMinutes) : 0;
  const limitLabel = profile.screenLimitHours === 0
    ? (lang === "ar" ? "غير محدود" : "Unlimited")
    : `${profile.screenLimitHours}h / ${lang === "ar" ? "يوم" : "day"}`;

  const sendReport = async () => {
    setSending(true);
    try {
      await sendWeeklyReport({
        parentEmail: profile.parentEmail,
        childName: profile.childName,
        summary: {
          wordsLearned: progress.wordsLearned,
          questionsAsked: progress.chatSessions,
          lessonsCompleted: progress.lessonsCompleted.length,
          activeDays: progress.monthlyActiveDays.length,
          strengths: progress.englishLessons > progress.arabicLessons
            ? ["English vocabulary", "Reading"] : ["Arabic letters", "Pronunciation"],
          difficulties: ["Multiplication"],
        },
      });
      setSentMsg(t("reportSent"));
    } catch {
      setSentMsg("⚠️ Failed — try again");
    } finally {
      setSending(false);
      setTimeout(() => setSentMsg(""), 3000);
    }
  };

  // ── SSE stream consumer ───────────────────────────────────────────────────
  async function runGeneration(
    endpoint: string,
    abortRef: React.MutableRefObject<AbortController | null>,
    setState: React.Dispatch<React.SetStateAction<GenerationState>>,
  ) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState({ running: true, percent: 0, message: lang === "ar" ? "جاري التحضير…" : "Preparing…", done: false, error: "" });

    try {
      const res = await fetch(`${getApiBase()}${endpoint}`, {
        method: "POST",
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setState((s) => ({ ...s, running: false, error: `HTTP ${res.status}` }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              progress?: number; total?: number; percent?: number;
              message?: string; done?: boolean;
            };
            setState((s) => ({
              ...s,
              percent: data.percent ?? s.percent,
              message: data.message ?? s.message,
              done: data.done ?? false,
              running: !(data.done ?? false),
            }));
          } catch { /* ignore malformed chunk */ }
        }
      }

      setState((s) => ({ ...s, running: false, done: true, percent: 100 }));
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setState((s) => ({ ...s, running: false, error: String(err?.message ?? err) }));
    }
  }


  const hasSafetyAlerts = safetyAlerts.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          👨‍👩‍👧 {t("parentDashboard")}
        </Text>
        <Pressable
          onPress={() => setPinVerified(false)}
          style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
          hitSlop={8}
        >
          <Ionicons name="lock-closed-outline" size={18} color={c.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 60 }}>

        {/* Trial banner */}
        {!profile.isPaid && (
          <SoftCard color={trialDays > 0 ? c.yellow : c.destructive}>
            <Text style={{ fontWeight: "800", color: trialDays > 0 ? "#5B3700" : "#FFF" }}>
              {trialDays > 0 ? `🎁 ${trialDays} free days remaining` : "🔒 Free trial ended"}
            </Text>
            <Pressable
              onPress={() => router.push("/parent/upgrade")}
              style={({ pressed }) => ({ marginTop: 10, backgroundColor: "#FFF", paddingVertical: 10, borderRadius: 12, alignItems: "center", opacity: pressed ? 0.85 : 1 })}
            >
              <Text style={{ fontWeight: "800", color: c.text }}>✨ {lang === "ar" ? "عرض الباقات" : "See plans"}</Text>
            </Pressable>
          </SoftCard>
        )}

        {/* Safety alerts */}
        {hasSafetyAlerts ? (
          <SoftCard color="#FEE2E2">
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24 }}>🚨</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: "#991B1B", fontSize: 15 }}>
                  {lang === "ar" ? "تنبيه أمان" : "Safety Alert"}
                </Text>
                <Text style={{ color: "#7F1D1D", fontSize: 12 }}>
                  {lang === "ar"
                    ? `تم اكتشاف ${safetyAlerts.length} رسالة تحتاج مراجعة`
                    : `${safetyAlerts.length} message${safetyAlerts.length > 1 ? "s" : ""} flagged for review`}
                </Text>
              </View>
            </View>
            {safetyAlerts.slice(-3).map((a, i) => (
              <View key={i} style={{ marginTop: 10, backgroundColor: "rgba(153,27,27,0.08)", borderRadius: 10, padding: 10 }}>
                <Text style={{ color: "#7F1D1D", fontSize: 11, marginBottom: 2 }}>{new Date(a.ts).toLocaleString()}</Text>
                <Text style={{ color: "#991B1B", fontSize: 13, fontWeight: "700" }}>
                  "{a.message.slice(0, 80)}{a.message.length > 80 ? "…" : ""}"
                </Text>
              </View>
            ))}
          </SoftCard>
        ) : (
          <SoftCard color="#D1FAE5">
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 14 }}>
                {lang === "ar" ? "لا تنبيهات أمان — كل شي ممتاز!" : "No safety alerts — all clear!"}
              </Text>
            </View>
          </SoftCard>
        )}

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SoftCard style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>📚</Text>
            <Text style={{ fontWeight: "800", fontSize: 22, color: c.text }}>{progress.wordsLearned}</Text>
            <Text style={{ fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>{t("wordsLearned")}</Text>
          </SoftCard>
          <SoftCard style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>❓</Text>
            <Text style={{ fontWeight: "800", fontSize: 22, color: c.text }}>{progress.chatSessions}</Text>
            <Text style={{ fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>{t("questionsAsked")}</Text>
          </SoftCard>
          <SoftCard style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text style={{ fontWeight: "800", fontSize: 22, color: c.text }}>{progress.monthlyActiveDays.length}</Text>
            <Text style={{ fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>{t("activeDays")}</Text>
          </SoftCard>
        </View>

        {/* Screen time today */}
        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>⏱️ {lang === "ar" ? "وقت الشاشة اليوم" : "Screen Time Today"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "900", color: c.primary }}>{usedMinutes}m</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {lang === "ar" ? `الحد: ${limitLabel}` : `Limit: ${limitLabel}`}
              </Text>
            </View>
            {profile.screenLimitHours > 0 && (
              <View style={{ alignItems: "flex-end" }}>
                <View style={{ width: 100, height: 8, backgroundColor: c.muted, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{
                    width: `${Math.min(100, (usedMinutes / (profile.screenLimitHours * 60)) * 100)}%`,
                    height: "100%",
                    backgroundColor: usedMinutes >= profile.screenLimitHours * 60 ? "#EF4444" : c.primary,
                    borderRadius: 4,
                  }} />
                </View>
                <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 4 }}>
                  {Math.min(100, Math.round((usedMinutes / (profile.screenLimitHours * 60)) * 100))}%
                </Text>
              </View>
            )}
          </View>
        </SoftCard>

        {/* Weekly chart */}
        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>📊 {t("weeklyChart")}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, alignItems: "flex-end", height: 140 }}>
            {progress.weekly.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View style={{ width: "100%", height: Math.max(6, (v / max) * 110), backgroundColor: c.primary, borderRadius: 8 }} />
                <Text style={{ fontSize: 11, color: c.mutedForeground }}>{dayLabels[i]}</Text>
              </View>
            ))}
          </View>
        </SoftCard>

        {/* Stories listened */}
        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>🌙 {lang === "ar" ? "القصص المسموعة" : "Stories listened"}</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 14, marginTop: 6 }}>
            {lang === "ar"
              ? `استمع الطفل لـ ${progress.storiesListened ?? 0} قصة هذا الأسبوع`
              : `${progress.storiesListened ?? 0} stories listened this week`}
          </Text>
        </SoftCard>

        {/* Navigation */}
        <Pressable onPress={() => router.push("/parent/controls")} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <SoftCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 30 }}>⏱️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>{t("parentControls")}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {profile.screenLimitHours === 0 ? t("unlimited") : `${profile.screenLimitHours} ${t("hours")}/day`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        <Pressable onPress={() => router.push("/parent/why-adam")} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <SoftCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 30 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>{lang === "ar" ? "لماذا My Hero؟" : "Why My Hero?"}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {lang === "ar" ? "١٠ أسباب لاختياره" : "10 reasons to choose it"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        <Pressable onPress={() => router.push("/parent/upgrade")} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <SoftCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 30 }}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
                {lang === "ar" ? "باقات الاشتراك" : "Subscription Plans"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {profile.isPaid
                  ? (lang === "ar" ? "مشترك ✅" : "Subscribed ✅")
                  : (lang === "ar" ? "شهري / ٦ أشهر / سنوي" : "Monthly / 6-Month / Yearly")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        <Pressable onPress={() => router.push("/terms" as any)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <SoftCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 30 }}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
                {lang === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {lang === "ar" ? "الخصوصية، الاشتراك، حقوق الأطفال" : "Privacy, subscription & children's rights"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        <Pressable onPress={() => router.push("/privacy" as any)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <SoftCard style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 30 }}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
                {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {lang === "ar" ? "كيف نحمي بيانات طفلك" : "How we protect your child's data"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        {/* ── Change Hero ───────────────────────────────────────────────────── */}
        <SoftCard style={{ gap: 12 }}>
          <Text style={{ fontWeight: "800", fontSize: 15, color: c.text, textAlign: lang === "ar" ? "right" : "left" }}>
            🦸 {lang === "ar" ? "تغيير البطل" : "Change Hero"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: lang === "ar" ? "right" : "left" }}>
            {lang === "ar"
              ? `البطل الحالي: ${profile?.hero === "girl" ? "لولو 👧" : "آدم 👦"}`
              : `Current hero: ${profile?.hero === "girl" ? "Sara 👧" : "Adam 👦"}`}
          </Text>
          <View style={{ flexDirection: lang === "ar" ? "row-reverse" : "row", gap: 10 }}>
            {([
              { val: "boy" as const, emoji: "👦", enLabel: "Adam", arLabel: "آدم", color: "#3B82F6" },
              { val: "girl" as const, emoji: "👧", enLabel: "Sara", arLabel: "Sara", color: "#EC4899" },
            ] as const).map(({ val, emoji, enLabel, arLabel, color }) => {
              const sel = profile?.hero === val;
              return (
                <Pressable
                  key={val}
                  onPress={async () => {
                    if (sel) return;
                    await patchProfile({ hero: val });
                    const name = lang === "ar" ? arLabel : enLabel;
                    setHeroSwitchMsg(lang === "ar" ? `تم التغيير إلى ${name} ✓` : `Switched to ${name} ✓`);
                    setTimeout(() => setHeroSwitchMsg(""), 2500);
                  }}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 14, borderRadius: 14,
                    backgroundColor: sel ? color : c.muted,
                    alignItems: "center", gap: 4,
                    opacity: pressed ? 0.85 : 1,
                    borderWidth: sel ? 0 : 1, borderColor: c.border,
                  })}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  <Text style={{ fontWeight: "800", color: sel ? "#FFF" : c.text, fontSize: 14 }}>
                    {lang === "ar" ? arLabel : enLabel}
                  </Text>
                  {sel && (
                    <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "700" }}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          {heroSwitchMsg !== "" && (
            <Text style={{ color: "#059669", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
              {heroSwitchMsg}
            </Text>
          )}
        </SoftCard>

        <PrimaryButton
          title={sentMsg || t("sendWeeklyReport")}
          variant="secondary"
          fullWidth
          loading={sending}
          onPress={sendReport}
        />

        {/* Contact Us */}
        <Pressable
          onPress={() => router.push("/parent/contact" as never)}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 14, borderRadius: 16,
            borderWidth: 1.5, borderColor: "#7C3AED", opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="mail-outline" size={20} color="#7C3AED" />
          <Text style={{ color: "#7C3AED", fontWeight: "700", fontSize: 15 }}>
            {lang === "ar" ? "تواصل مع الدعم 💙" : "Contact Support 💙"}
          </Text>
        </Pressable>

        {/* Switch / Logout */}
        <Pressable
          onPress={() => {
            Alert.alert(
              lang === "ar" ? "تسجيل الخروج" : "Switch Profile",
              lang === "ar"
                ? "هل تريد مسح البيانات والبدء من جديد؟"
                : "This will clear all data and return to the welcome screen.",
              [
                { text: lang === "ar" ? "إلغاء" : "Cancel", style: "cancel" },
                {
                  text: lang === "ar" ? "نعم، اخرج" : "Yes, reset",
                  style: "destructive",
                  onPress: async () => {
                    await resetAll();
                    router.replace("/onboarding/welcome" as never);
                  },
                },
              ],
            );
          }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 14, borderRadius: 16,
            borderWidth: 1.5, borderColor: "#EF4444", opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>
            {lang === "ar" ? "تغيير الشخصية / تسجيل خروج" : "Switch Character / Log Out"}
          </Text>
        </Pressable>

        {/* ── Admin: Audio Generation ───────────────────────────────────────── */}
        <View style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }} />

        <Text style={{ fontWeight: "700", fontSize: 12, color: c.mutedForeground, letterSpacing: 1, textTransform: "uppercase" }}>
          {lang === "ar" ? "أدوات المطور" : "Developer Tools"}
        </Text>

        {/* Generate Lesson + Game Audio */}
        <SoftCard style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            🎙️ {lang === "ar" ? "توليد صوت الدروس والألعاب" : "Generate Lesson & Game Audio"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            {lang === "ar"
              ? "ينشئ كل الملفات الصوتية للدروس والألعاب الأربعة بصوت Google WaveNet ويرفعها لـ Supabase."
              : "Pre-generates all lesson and game audio using Google WaveNet and uploads to Supabase Storage."}
          </Text>

          {lessonGen.running && (
            <View style={{ gap: 6 }}>
              <View style={{ height: 8, backgroundColor: c.muted, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${lessonGen.percent}%`, backgroundColor: c.primary, borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 12, color: c.mutedForeground }} numberOfLines={1}>
                {lessonGen.percent}% — {lessonGen.message}
              </Text>
            </View>
          )}

          {lessonGen.done && !lessonGen.running && (
            <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 13 }}>
              ✅ {lang === "ar" ? "اكتمل!" : "Done!"}
            </Text>
          )}
          {lessonGen.error !== "" && (
            <Text style={{ color: c.destructive, fontSize: 12 }}>⚠️ {lessonGen.error}</Text>
          )}

          <Pressable
            disabled={lessonGen.running}
            onPress={() => runGeneration("/api/admin/generate-lesson-audio", lessonAbortRef, setLessonGen)}
            style={({ pressed }) => ({
              backgroundColor: lessonGen.running ? c.muted : c.primary,
              paddingVertical: 12, borderRadius: 12, alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
              {lessonGen.running
                ? (lang === "ar" ? "جاري التوليد…" : "Generating…")
                : (lang === "ar" ? "ابدأ التوليد" : "Start Generation")}
            </Text>
          </Pressable>
        </SoftCard>

        {/* Generate Story Audio */}
        <SoftCard style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            🌙 {lang === "ar" ? "توليد صوت القصص" : "Generate Story Audio"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            {lang === "ar"
              ? "ينشئ الملفات الصوتية لجميع جمل القصص العشر."
              : "Pre-generates audio for all 10 story sentence segments."}
          </Text>

          {storyGen.running && (
            <View style={{ gap: 6 }}>
              <View style={{ height: 8, backgroundColor: c.muted, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${storyGen.percent}%`, backgroundColor: "#7C3AED", borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 12, color: c.mutedForeground }} numberOfLines={1}>
                {storyGen.percent}% — {storyGen.message}
              </Text>
            </View>
          )}

          {storyGen.done && !storyGen.running && (
            <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 13 }}>
              ✅ {lang === "ar" ? "اكتمل!" : "Done!"}
            </Text>
          )}
          {storyGen.error !== "" && (
            <Text style={{ color: c.destructive, fontSize: 12 }}>⚠️ {storyGen.error}</Text>
          )}

          <Pressable
            disabled={storyGen.running}
            onPress={() => runGeneration("/api/admin/generate-stories", storyAbortRef, setStoryGen)}
            style={({ pressed }) => ({
              backgroundColor: storyGen.running ? c.muted : "#7C3AED",
              paddingVertical: 12, borderRadius: 12, alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
              {storyGen.running
                ? (lang === "ar" ? "جاري التوليد…" : "Generating…")
                : (lang === "ar" ? "ابدأ التوليد" : "Start Generation")}
            </Text>
          </Pressable>
        </SoftCard>

        {/* Pre-warm Chat Cache */}
        <SoftCard style={{ gap: 10, borderColor: "#059669", borderWidth: 1.5 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            🧠 {lang === "ar" ? "تسخين ذاكرة التخزين المؤقت" : "Pre-warm Chat Cache"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            {lang === "ar"
              ? "يولّد إجابات لأكثر من 1800 سؤال شامل في الرياضيات والجبر والفيزياء والفضاء والمحيطات والعلوم ويحفظها — بعد ذلك تظهر الإجابات فوراً بدون الاتصال بـ OpenAI."
              : "Generates answers for 1,800+ questions covering math, algebra, physics, space, ocean life, and science for kids under 14 — answers appear instantly after this, no OpenAI call needed."}
          </Text>

          {chatPrewarm.running && (
            <View style={{ gap: 6 }}>
              <View style={{ height: 8, backgroundColor: c.muted, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${chatPrewarm.percent}%`, backgroundColor: "#059669", borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 12, color: c.mutedForeground }} numberOfLines={1}>
                {chatPrewarm.percent}% — {chatPrewarm.message}
              </Text>
            </View>
          )}

          {chatPrewarm.done && !chatPrewarm.running && (
            <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 13 }}>
              ✅ {lang === "ar" ? "اكتمل!" : "Done!"}
            </Text>
          )}
          {chatPrewarm.error !== "" && (
            <Text style={{ color: c.destructive, fontSize: 12 }}>⚠️ {chatPrewarm.error}</Text>
          )}

          <Pressable
            disabled={chatPrewarm.running}
            onPress={() => runGeneration("/api/admin/prewarm-chat", chatAbortRef, setChatPrewarm)}
            style={({ pressed }) => ({
              backgroundColor: chatPrewarm.running ? c.muted : "#059669",
              paddingVertical: 12, borderRadius: 12, alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
              {chatPrewarm.running
                ? (lang === "ar" ? "جاري التوليد…" : "Generating…")
                : (lang === "ar" ? "ابدأ التسخين" : "Start Pre-warming")}
            </Text>
          </Pressable>
        </SoftCard>

      </ScrollView>
    </SafeAreaView>
  );
}
