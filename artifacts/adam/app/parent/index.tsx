import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { sendWeeklyReport } from "@/lib/api";
import { trialDaysLeft } from "@/lib/utils";

const dayLabelsEn = ["S", "M", "T", "W", "T", "F", "S"];
const dayLabelsAr = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

export default function ParentDashboard() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, progress } = useApp();
  const [sentMsg, setSentMsg] = useState<string>("");
  const [sending, setSending] = useState(false);

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
    } catch (e) {
      setSentMsg("⚠️");
    } finally {
      setSending(false);
      setTimeout(() => setSentMsg(""), 3000);
    }
  };

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
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 22, color: c.text, flex: 1 }}>
          👨‍👩‍👧 {t("parentDashboard")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        {!profile.isPaid && (
          <SoftCard color={trialDays > 0 ? c.yellow : c.destructive}>
            <Text style={{ fontWeight: "800", color: trialDays > 0 ? "#5B3700" : "#FFF" }}>
              {trialDays > 0
                ? `🎁 ${trialDays} free days remaining`
                : "🔒 Free trial ended"}
            </Text>
            <Pressable
              onPress={() => router.push("/parent/upgrade")}
              style={({ pressed }) => ({
                marginTop: 10,
                backgroundColor: "#FFF",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontWeight: "800", color: c.text }}>
                ✨ See plans
              </Text>
            </Pressable>
          </SoftCard>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <SoftCard style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>📚</Text>
            <Text style={{ fontWeight: "800", fontSize: 22, color: c.text }}>
              {progress.wordsLearned}
            </Text>
            <Text style={{ fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>
              {t("wordsLearned")}
            </Text>
          </SoftCard>
          <SoftCard style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>❓</Text>
            <Text style={{ fontWeight: "800", fontSize: 22, color: c.text }}>
              {progress.chatSessions}
            </Text>
            <Text style={{ fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>
              {t("questionsAsked")}
            </Text>
          </SoftCard>
          <SoftCard style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text style={{ fontWeight: "800", fontSize: 22, color: c.text }}>
              {progress.monthlyActiveDays.length}
            </Text>
            <Text style={{ fontSize: 11, color: c.mutedForeground, textAlign: "center" }}>
              {t("activeDays")}
            </Text>
          </SoftCard>
        </View>

        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>
            📊 {t("weeklyChart")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 14,
              alignItems: "flex-end",
              height: 140,
            }}
          >
            {progress.weekly.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: "100%",
                    height: Math.max(6, (v / max) * 110),
                    backgroundColor: c.primary,
                    borderRadius: 8,
                  }}
                />
                <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                  {dayLabels[i]}
                </Text>
              </View>
            ))}
          </View>
        </SoftCard>

        <Pressable
          onPress={() => router.push("/parent/controls")}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <SoftCard
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Text style={{ fontSize: 30 }}>⏱️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
                {t("parentControls")}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {profile.screenLimitHours === 0
                  ? t("unlimited")
                  : `${profile.screenLimitHours} ${t("hours")}/day`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
          </SoftCard>
        </Pressable>

        <Pressable
          onPress={() => router.push("/parent/why-adam")}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <SoftCard
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Text style={{ fontSize: 30 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
                {t("whyAdam")}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                {t("sampleAnswers")}
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
      </ScrollView>
    </SafeAreaView>
  );
}
