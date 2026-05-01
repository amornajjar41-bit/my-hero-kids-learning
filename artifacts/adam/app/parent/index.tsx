import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { sendWeeklyReport } from "@/lib/api";
import { clearSessionToken } from "@/lib/auth";
import { getJSON, STORAGE_KEYS, type SafetyAlert } from "@/lib/storage";
import { trialDaysLeft } from "@/lib/utils";
import ParentPin from "./pin";

export type { SafetyAlert };

const dayLabelsEn = ["S", "M", "T", "W", "T", "F", "S"];

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "https://myheroapp.org";
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sentMsg, setSentMsg] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [heroSwitchMsg, setHeroSwitchMsg] = useState("");

  const [lessonGen, setLessonGen] = useState<GenerationState>(GEN_IDLE);
  const [storyGen, setStoryGen] = useState<GenerationState>(GEN_IDLE);
  const [chatPrewarm, setChatPrewarm] = useState<GenerationState>(GEN_IDLE);
  const [techAudioGen, setTechAudioGen] = useState<GenerationState>(GEN_IDLE);
  const lessonAbortRef = useRef<AbortController | null>(null);
  const storyAbortRef = useRef<AbortController | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const techAudioAbortRef = useRef<AbortController | null>(null);

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
  const dayLabels = dayLabelsEn;

  const trialDays = trialDaysLeft(profile.trialStartedAt);
  const max = Math.max(1, ...progress.weekly);

  const usedMinutes = progress.dailyUsageDate === new Date().toISOString().slice(0, 10)
    ? Math.round(progress.dailyUsageMinutes) : 0;
  const limitLabel = profile.screenLimitHours === 0
    ? ("Unlimited")
    : `${profile.screenLimitHours}h / ${"day"}`;

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
          strengths: ["English vocabulary", "Reading"],
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
  // Uses XMLHttpRequest instead of fetch — React Native Android does NOT support
  // ReadableStream from fetch, so res.body.getReader() never yields chunks.
  // XHR onprogress fires with partial responseText as chunks arrive.
  function runGeneration(
    endpoint: string,
    abortRef: React.MutableRefObject<AbortController | null>,
    setState: React.Dispatch<React.SetStateAction<GenerationState>>,
  ) {
    // Cancel any in-flight request first
    (abortRef.current as any)?._xhr?.abort();

    setState({ running: true, percent: 0, message: "Starting…", done: false, error: "" });

    const xhr = new XMLHttpRequest();
    (abortRef.current as any) = { _xhr: xhr };

    let consumed = 0;

    xhr.open("POST", `${getApiBase()}${endpoint}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream");

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(consumed);
      consumed = xhr.responseText.length;

      const lines = chunk.split("\n");
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
    };

    xhr.onload = () => {
      if (xhr.status >= 400) {
        setState((s) => ({ ...s, running: false, error: `HTTP ${xhr.status}` }));
      } else {
        setState((s) => ({ ...s, running: false, done: true, percent: 100 }));
      }
    };

    xhr.onerror = () => {
      setState((s) => ({ ...s, running: false, error: "Network error — check connection" }));
    };

    xhr.ontimeout = () => {
      setState((s) => ({ ...s, running: false, error: "Timed out" }));
    };

    xhr.timeout = 600000; // 10 minutes max for large generation jobs
    xhr.send();
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
              <Text style={{ fontWeight: "800", color: c.text }}>✨ {"See plans"}</Text>
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
                  {"Safety Alert"}
                </Text>
                <Text style={{ color: "#7F1D1D", fontSize: 12 }}>
                  {`${safetyAlerts.length} message${safetyAlerts.length > 1 ? "s" : ""} flagged for review`}
                </Text>
              </View>
            </View>
            {safetyAlerts.slice(-3).map((a, i) => (
              <View key={i} style={{ marginTop: 10, backgroundColor: "rgba(153,27,27,0.08)", borderRadius: 10, padding: 10 }}>
                <Text style={{ color: "#7F1D1D", fontSize: 11, marginBottom: 2 }}>{new Date(a.ts).toLocaleString('en-US')}</Text>
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
                {"No safety alerts — all clear!"}
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
          <Text style={{ fontWeight: "800", color: c.text }}>⏱️ {"Screen Time Today"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "900", color: c.primary }}>{usedMinutes}m</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {`Limit: ${limitLabel}`}
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
          <Text style={{ fontWeight: "800", color: c.text }}>🌙 {"Stories listened"}</Text>
          <Text style={{ color: c.mutedForeground, fontSize: 14, marginTop: 6 }}>
            {`${progress.storiesListened ?? 0} stories listened this week`}
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
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>{"Why My Hero?"}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {"10 reasons to choose it"}
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
                {"Subscription Plans"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {profile.isPaid
                  ? "Subscribed ✅"
                  : "Monthly / 6-Month / Yearly"}
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
                {"Terms & Conditions"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {"Privacy, subscription & children's rights"}
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
                {"Privacy Policy"}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {"How we protect your child's data"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        {/* ── Change Hero ───────────────────────────────────────────────────── */}
        <SoftCard style={{ gap: 12 }}>
          <Text style={{ fontWeight: "800", fontSize: 15, color: c.text, textAlign: "left" }}>
            🦸 {"Change Hero"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: "left" }}>
            {`Current hero: ${profile?.hero === "girl" ? "Sara 👧" : "Adam 👦"}`}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {([
              { val: "boy" as const, emoji: "👦", enLabel: "Adam", color: "#3B82F6" },
              { val: "girl" as const, emoji: "👧", enLabel: "Sara", color: "#EC4899" },
            ] as const).map(({ val, emoji, enLabel, color }) => {
              const sel = profile?.hero === val;
              return (
                <Pressable
                  key={val}
                  onPress={async () => {
                    if (sel) return;
                    await patchProfile({ hero: val });
                    const name = enLabel;
                    setHeroSwitchMsg(`Switched to ${name} ✓`);
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
                    {enLabel}
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
            {"Contact Support 💙"}
          </Text>
        </Pressable>

        {/* Switch / Logout */}
        <Pressable
          onPress={() => setShowLogoutModal(true)}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 14, borderRadius: 16,
            borderWidth: 1.5, borderColor: "#EF4444", opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>
            Log Out
          </Text>
        </Pressable>

        {/* ── Logout Confirmation Modal ───────────────────────────────── */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}>
            <View style={{
              backgroundColor: c.card,
              borderRadius: 24,
              padding: 28,
              width: "100%",
              maxWidth: 340,
              gap: 16,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}>
              <Text style={{ fontSize: 40, textAlign: "center" }}>🚪</Text>
              <Text style={{ fontWeight: "900", fontSize: 20, color: c.text, textAlign: "center" }}>
                Log Out?
              </Text>
              <Text style={{ fontSize: 14, color: c.mutedForeground, textAlign: "center", lineHeight: 20 }}>
                This will sign you out and return to the welcome screen. You can sign back in any time.
              </Text>
              <Pressable
                disabled={loggingOut}
                onPress={async () => {
                  setLoggingOut(true);
                  await clearSessionToken();
                  await resetAll();
                  setShowLogoutModal(false);
                  setLoggingOut(false);
                  router.replace("/onboarding/welcome" as never);
                }}
                style={({ pressed }) => ({
                  backgroundColor: "#EF4444",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: pressed || loggingOut ? 0.8 : 1,
                })}
              >
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>
                  {loggingOut ? "Logging out…" : "Yes, Log Out"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: c.muted,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 15 }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ── Admin: Audio Generation (admin-only) ──────────────────────────── */}
        {profile?.parentEmail === "amornajjar41@gmail.com" && (<>
        <View style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }} />

        <Text style={{ fontWeight: "700", fontSize: 12, color: c.mutedForeground, letterSpacing: 1, textTransform: "uppercase" }}>
          {"Developer Tools"}
        </Text>

        {/* Generate Lesson + Game Audio */}
        <SoftCard style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            🎙️ {"Generate Lesson & Game Audio"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            {"Pre-generates all lesson and game audio using Google WaveNet and uploads to Supabase Storage."}
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
              ✅ {"Done!"}
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
                ? ("Generating…")
                : "Start Generation"}
            </Text>
          </Pressable>
        </SoftCard>

        {/* Generate Story Audio */}
        <SoftCard style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            🌙 {"Generate Story Audio"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            {"Pre-generates audio for all 10 story sentence segments."}
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
              ✅ {"Done!"}
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
                ? ("Generating…")
                : "Start Generation"}
            </Text>
          </Pressable>
        </SoftCard>

        {/* Pre-warm Chat Cache */}
        <SoftCard style={{ gap: 10, borderColor: "#059669", borderWidth: 1.5 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            🧠 {"Pre-warm Chat Cache"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            Generates answers for 1,800+ questions covering math, algebra, physics, space, ocean life, and science for kids under 14 — answers appear instantly after this, no OpenAI call needed.
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
              ✅ {"Done!"}
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
                ? ("Generating…")
                : ("Start Pre-warming")}
            </Text>
          </Pressable>
        </SoftCard>

        {/* Pre-warm Tech Lesson Audio */}
        <SoftCard style={{ gap: 10, borderColor: "#3B82F6", borderWidth: 1.5 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 15 }}>
            💻 {"Generate Tech Lesson Audio"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            Pre-records all 18 Technology & AI lessons (each ~11 slides) using Google Neural2 TTS and uploads to storage — lessons play instantly with no delay after this.
          </Text>

          {techAudioGen.running && (
            <View style={{ gap: 6 }}>
              <View style={{ height: 8, backgroundColor: c.muted, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${techAudioGen.percent}%`, backgroundColor: "#3B82F6", borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 12, color: c.mutedForeground }} numberOfLines={1}>
                {techAudioGen.percent}% — {techAudioGen.message}
              </Text>
            </View>
          )}

          {techAudioGen.done && !techAudioGen.running && (
            <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 13 }}>
              ✅ {"All 18 tech lessons recorded!"}
            </Text>
          )}
          {techAudioGen.error !== "" && (
            <Text style={{ color: c.destructive, fontSize: 12 }}>⚠️ {techAudioGen.error}</Text>
          )}

          <Pressable
            disabled={techAudioGen.running}
            onPress={() => runGeneration("/api/admin/prewarm-tech-audio", techAudioAbortRef, setTechAudioGen)}
            style={({ pressed }) => ({
              backgroundColor: techAudioGen.running ? c.muted : "#3B82F6",
              paddingVertical: 12, borderRadius: 12, alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
              {techAudioGen.running
                ? ("Generating…")
                : ("Start Tech Audio Generation")}
            </Text>
          </Pressable>
        </SoftCard>
        </>)}

      </ScrollView>
    </SafeAreaView>
  );
}
