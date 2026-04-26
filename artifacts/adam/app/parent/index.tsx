import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export type { SafetyAlert };

const dayLabelsEn = ["S", "M", "T", "W", "T", "F", "S"];
const dayLabelsAr = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

export default function ParentDashboard() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, progress, resetAll } = useApp();
  const [sentMsg, setSentMsg] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);

  useEffect(() => {
    getJSON<SafetyAlert[]>(STORAGE_KEYS.safetyAlerts).then((v) => {
      if (v && Array.isArray(v)) setSafetyAlerts(v);
    });
  }, []);

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
              <Text style={{ fontWeight: "800", color: c.text }}>✨ See plans</Text>
            </Pressable>
          </SoftCard>
        )}

        {/* Safety Alert panel */}
        {hasSafetyAlerts && (
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
                <Text style={{ color: "#7F1D1D", fontSize: 11, marginBottom: 2 }}>
                  {new Date(a.ts).toLocaleString()}
                </Text>
                <Text style={{ color: "#991B1B", fontSize: 13, fontWeight: "700" }}>
                  "{a.message.slice(0, 80)}{a.message.length > 80 ? "…" : ""}"
                </Text>
              </View>
            ))}
          </SoftCard>
        )}

        {!hasSafetyAlerts && (
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
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{t("sampleAnswers")}</Text>
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

        {/* Logout / Switch Profile */}
        <Pressable
          onPress={() => {
            Alert.alert(
              lang === "ar" ? "تسجيل الخروج" : "Switch Profile",
              lang === "ar"
                ? "هل تريد مسح البيانات والبدء من جديد؟"
                : "This will clear all data and return to the welcome screen so you can set up a new profile.",
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
            marginTop: 4,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: "#EF4444",
            opacity: pressed ? 0.7 : 1,
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
