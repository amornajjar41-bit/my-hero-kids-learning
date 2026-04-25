import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BadgeShelf } from "@/components/BadgeShelf";
import { Greeting } from "@/components/Greeting";
import { SoftCard } from "@/components/SoftCard";
import { SoundToggle } from "@/components/SoundToggle";
import { StreakCard } from "@/components/StreakCard";
import { TodaySuggestion } from "@/components/TodaySuggestion";
import { TrialBanner } from "@/components/TrialBanner";
import { allBadges } from "@/constants/badges";
import { curriculum, lessonTitle } from "@/constants/curriculum";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT, useLang } from "@/hooks/useT";
import {
  isBirthdayToday,
  todayISO,
  trialDaysLeft,
} from "@/lib/utils";

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { profile, progress, saveProgress } = useApp();

  // Streak update
  useFocusEffect(
    useCallback(() => {
      const today = todayISO();
      if (progress.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .slice(0, 10);
        saveProgress((prev) => ({
          ...prev,
          streak:
            prev.lastActiveDate === yesterday
              ? prev.streak + 1
              : prev.lastActiveDate === today
                ? prev.streak
                : 1,
          lastActiveDate: today,
          monthlyActiveDays: prev.monthlyActiveDays.includes(today)
            ? prev.monthlyActiveDays
            : [...prev.monthlyActiveDays, today],
        }));
      }

      // Birthday celebration
      if (profile?.childBirthday && isBirthdayToday(profile.childBirthday)) {
        const lastShown = (globalThis as any).__bday;
        if (lastShown !== today) {
          (globalThis as any).__bday = today;
          router.push("/birthday-celebration");
        }
      }

      // Screen-time block
      if (
        profile &&
        profile.screenLimitHours > 0 &&
        progress.dailyUsageMinutes >= profile.screenLimitHours * 60
      ) {
        router.replace("/blocked");
      }
    }, [profile, progress, saveProgress, router]),
  );

  const suggestion = useMemo(() => {
    const lessons =
      lang === "ar" ? curriculum.arabic : curriculum.english;
    const next =
      lessons.find((l) => !progress.lessonsCompleted.includes(l.id)) ??
      lessons[0];
    return next;
  }, [lang, progress.lessonsCompleted]);

  const trialDays = profile ? trialDaysLeft(profile.trialStartedAt) : 3;
  const trialEnded = profile && !profile.isPaid && trialDays <= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 12 }}
          >
            {t("appName").toUpperCase()}
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SoundToggle />
            <Pressable
              onPress={() => router.push("/parent")}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.card,
                opacity: pressed ? 0.85 : 1,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              })}
            >
              <Text style={{ fontWeight: "800", color: c.text }}>
                👨‍👩‍👧 {t("parents")}
              </Text>
            </Pressable>
          </View>
        </View>

        <Greeting />

        <TrialBanner onUpgrade={() => router.push("/parent/upgrade")} />

        <StreakCard streak={progress.streak} stars={progress.starsTotal} />

        {!trialEnded && (
          <TodaySuggestion
            emoji={suggestion.emoji}
            title={lessonTitle(suggestion, lang)}
            subtitle={
              progress.lessonsCompleted.includes(suggestion.id)
                ? t("continueWhereLeftOff")
                : t("startLearning")
            }
            cta={t("playNow")}
            onPress={() =>
              router.push(`/learn/lesson/${suggestion.id}`)
            }
          />
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/chat")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: c.primary,
              borderRadius: c.radius,
              padding: 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 32 }}>📚</Text>
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 16,
                marginTop: 6,
              }}
            >
              {t("homeworkHelper")}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.85, marginTop: 4, fontSize: 12 }}>
              {t("homeworkHelperSub")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/games")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: c.pink,
              borderRadius: c.radius,
              padding: 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 32 }}>🎮</Text>
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 16,
                marginTop: 6,
              }}
            >
              {t("playAndLearn")}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.85, marginTop: 4, fontSize: 12 }}>
              4 fun games
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push("/learn/english")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: c.blue,
              borderRadius: c.radius,
              padding: 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 28 }}>🇬🇧</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", marginTop: 6 }}>
              {t("learnEnglish")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/learn/arabic")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: c.green,
              borderRadius: c.radius,
              padding: 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 28 }}>🇸🇦</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", marginTop: 6 }}>
              {t("learnArabic")}
            </Text>
          </Pressable>
        </View>

        <BadgeShelf />

        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
            {t("pictureDictionary")}
          </Text>
          <Text style={{ color: c.mutedForeground, marginTop: 4, fontSize: 13 }}>
            {t("tapToHear")}
          </Text>
          <Pressable
            onPress={() => router.push("/learn/dictionary")}
            style={({ pressed }) => ({
              marginTop: 12,
              backgroundColor: c.muted,
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontWeight: "800", color: c.text }}>
              📖 {lang === "ar" ? "افتح القاموس" : "Open dictionary"}
            </Text>
          </Pressable>
        </SoftCard>

        {/* tiny credits / count info */}
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            {progress.wordsLearned} {t("wordsLearned").toLowerCase()} ·{" "}
            {progress.lessonsCompleted.length} {t("lessonsCompleted").toLowerCase()}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 4 }}>
            {allBadges.length} badges to collect
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
