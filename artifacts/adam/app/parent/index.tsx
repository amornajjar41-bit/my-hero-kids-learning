import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
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

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

export type { SafetyAlert };

const dayLabelsEn = ["S", "M", "T", "W", "T", "F", "S"];
const dayLabelsAr = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

type AdminJob = "lessons" | "stories" | null;

export default function ParentDashboard() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, progress, resetAll } = useApp();

  // 5A – PIN guard: show PIN screen until verified this session
  const [pinVerified, setPinVerified] = useState(false);

  const [sentMsg, setSentMsg] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);

  // Admin audio generation
  const [adminJob, setAdminJob] = useState<AdminJob>(null);
  const [adminLog, setAdminLog] = useState<string[]>([]);
  const [adminDone, setAdminDone] = useState<{ lessons?: boolean; stories?: boolean }>({});
  const abortRef = useRef<AbortController | null>(null);

  const runAdminJob = async (job: AdminJob) => {
    if (!job || adminJob) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setAdminJob(job);
    setAdminLog([`Starting ${job}…`]);
    const endpoint = job === "lessons" ? "/api/admin/generate-lesson-audio" : "/api/admin/generate-stories";
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { Accept: "text/event-stream" },
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            try {
              const ev = JSON.parse(raw) as { type: string; message?: string; total?: number; done?: number };
              if (ev.type === "progress" && ev.message) {
                setAdminLog((prev) => [...prev.slice(-19), ev.message!]);
              } else if (ev.type === "complete") {
                setAdminLog((prev) => [...prev, "✅ Done!"]);
                setAdminDone((d) => ({ ...d, [job]: true }));
              } else if (ev.type === "error" && ev.message) {
                setAdminLog((prev) => [...prev, `⚠️ ${ev.message}`]);
              }
            } catch { /* ignore non-JSON */ }
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setAdminLog((prev) => [...prev, `Error: ${e?.message}`]);
    } finally {
      setAdminJob(null);
    }
  };

  useEffect(() => {
    getJSON<SafetyAlert[]>(STORAGE_KEYS.safetyAlerts).then((v) => {
      if (v && Array.isArray(v)) setSafetyAlerts(v);
    });
  }, []);

  // Show PIN screen first
  if (!pinVerified) {
    return (
      <ParentPin
        onSuccess={() => setPinVerified(true)}
        onBack={() => router.back()}
      />
    );
  }

  if (!profile) return null;
  const lang = profile.language;
  const dayLabels = lang === "ar" ? dayLabelsAr : dayLabelsEn;

  const trialDays = trialDaysLeft(profile.trialStartedAt);
  const max = Math.max(1, ...progress.weekly);

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
          strengths:
            progress.englishLessons > progress.arabicLessons
              ? ["English vocabulary", "Reading"]
              : ["Arabic letters", "Pronunciation"],
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

  const hasSafetyAlerts = safetyAlerts.length > 0;

  // Screen time today
  const usedMinutes = progress.dailyUsageDate === new Date().toISOString().slice(0, 10)
    ? Math.round(progress.dailyUsageMinutes)
    : 0;
  const limitLabel = profile.screenLimitHours === 0
    ? (lang === "ar" ? "غير محدود" : "Unlimited")
    : `${profile.screenLimitHours}h / ${lang === "ar" ? "يوم" : "day"}`;

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
        {/* Lock icon to require PIN again */}
        <Pressable
          onPress={() => setPinVerified(false)}
          style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
          hitSlop={8}
        >
          <Ionicons name="lock-closed-outline" size={18} color={c.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 40 }}>

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

        {/* Safety Alert panel */}
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

        {/* Stats */}
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

        {/* Navigation buttons */}
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

        <PrimaryButton
          title={sentMsg || t("sendWeeklyReport")}
          variant="secondary"
          fullWidth
          loading={sending}
          onPress={sendReport}
        />

        {/* Admin: Audio Generation */}
        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15, marginBottom: 10 }}>
            🎙️ {lang === "ar" ? "توليد الصوت (للمطور)" : "Audio Generation (Admin)"}
          </Text>
          <View style={{ gap: 10 }}>
            <Pressable
              disabled={!!adminJob}
              onPress={() => runAdminJob("lessons")}
              style={({ pressed }) => ({
                backgroundColor: adminDone.lessons ? c.green : c.primary,
                borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
                flexDirection: "row", alignItems: "center", gap: 8,
                opacity: adminJob && adminJob !== "lessons" ? 0.4 : pressed ? 0.85 : 1,
              })}
            >
              {adminJob === "lessons" && <ActivityIndicator color="#FFF" size="small" />}
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
                {adminDone.lessons ? "✅ " : ""}{lang === "ar" ? "توليد صوت الدروس والألعاب" : "Generate Lesson & Game Audio"}
              </Text>
            </Pressable>
            <Pressable
              disabled={!!adminJob}
              onPress={() => runAdminJob("stories")}
              style={({ pressed }) => ({
                backgroundColor: adminDone.stories ? c.green : "#1A0F3F",
                borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
                flexDirection: "row", alignItems: "center", gap: 8,
                opacity: adminJob && adminJob !== "stories" ? 0.4 : pressed ? 0.85 : 1,
              })}
            >
              {adminJob === "stories" && <ActivityIndicator color="#FFF" size="small" />}
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
                {adminDone.stories ? "✅ " : ""}{lang === "ar" ? "توليد صوت القصص" : "Generate Stories Audio"}
              </Text>
            </Pressable>
          </View>
          {adminLog.length > 0 && (
            <View style={{ marginTop: 10, backgroundColor: c.muted, borderRadius: 10, padding: 10, maxHeight: 140 }}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {adminLog.map((line, i) => (
                  <Text key={i} style={{ color: c.mutedForeground, fontSize: 11, fontFamily: "monospace", lineHeight: 16 }}>
                    {line}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}
        </SoftCard>

        {/* Logout / Switch Profile */}
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
            marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 14, borderRadius: 16,
            borderWidth: 1.5, borderColor: "#EF4444", opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>
            {lang === "ar" ? "تغيير الشخصية / تسجيل خروج" : "Switch Character / Log Out"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
