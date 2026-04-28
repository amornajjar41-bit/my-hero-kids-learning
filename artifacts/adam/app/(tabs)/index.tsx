import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { playChime } from "@/lib/chime";
import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BadgeShelf } from "@/components/BadgeShelf";
import { DailyTip } from "@/components/DailyTip";
import { Greeting } from "@/components/Greeting";
import { HeroLogo } from "@/components/HeroLogo";
import { SoftCard } from "@/components/SoftCard";
import { SoundToggle } from "@/components/SoundToggle";
import { StreakCard } from "@/components/StreakCard";
import { TodaySuggestion } from "@/components/TodaySuggestion";
import { TrialBanner } from "@/components/TrialBanner";
import { Tour, useTour } from "@/components/Tour";
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
  const { profile, progress, saveProgress, isScreenBlocked } = useApp();

  // 4C – First-time tour
  const { showTour, completeTour } = useTour();

  // Streak update + screen time check + birthday
  useFocusEffect(
    useCallback(() => {
      // 4B – Block if screen time limit reached
      if (isScreenBlocked) {
        router.replace("/blocked");
        return;
      }

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

      // 4D – Birthday celebration at 8am+ (once per day)
      if (profile?.childBirthday && isBirthdayToday(profile.childBirthday)) {
        const lastShown = (globalThis as any).__bday;
        if (lastShown !== today) {
          const hour = new Date().getHours();
          if (hour >= 8) {
            (globalThis as any).__bday = today;
            router.push("/birthday-celebration");
          }
        }
      }
    }, [profile, progress, saveProgress, router, isScreenBlocked]),
  );

  const suggestion = useMemo(() => {
    const lessons = lang === "ar" ? curriculum.arabic : curriculum.english;
    const next = lessons.find((l) => !progress.lessonsCompleted.includes(l.id)) ?? lessons[0];
    return next;
  }, [lang, progress.lessonsCompleted]);

  const trialDays = profile ? trialDaysLeft(profile.trialStartedAt) : 3;
  const trialEnded = profile && !profile.isPaid && trialDays <= 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>

      {/* 4C – First-time tour overlay */}
      <Tour visible={showTour} onDone={completeTour} />

      <ScrollView
        contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo row */}
        <View style={{ alignItems: "center", paddingVertical: 4 }}>
          <HeroLogo size="md" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SoundToggle />
            <Pressable
              onPress={() => { playChime("tap"); router.push("/parent"); }}
              style={({ pressed }) => ({
                paddingHorizontal: 14, height: 44, borderRadius: 22,
                alignItems: "center", justifyContent: "center",
                backgroundColor: c.card, opacity: pressed ? 0.85 : 1,
                shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 }, elevation: 2,
              })}
            >
              <Text style={{ fontWeight: "800", color: c.text }}>
                👨‍👩‍👧 {t("parents")}
              </Text>
            </Pressable>
          </View>
        </View>

        <Greeting />

        {/* 4D – Daily tip by time of day */}
        <DailyTip />

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
            onPress={() => router.push(`/learn/lesson/${suggestion.id}`)}
          />
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => { playChime("tap"); router.push("/(tabs)/chat"); }}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: c.primary, borderRadius: c.radius, padding: 16, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 32 }}>📚</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16, marginTop: 6 }}>{t("homeworkHelper")}</Text>
            <Text style={{ color: "#FFF", opacity: 0.85, marginTop: 4, fontSize: 12 }}>{t("homeworkHelperSub")}</Text>
          </Pressable>
          <Pressable
            onPress={() => { playChime("tap"); router.push("/(tabs)/games"); }}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: c.pink, borderRadius: c.radius, padding: 16, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 32 }}>🎮</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16, marginTop: 6 }}>{t("playAndLearn")}</Text>
            <Text style={{ color: "#FFF", opacity: 0.85, marginTop: 4, fontSize: 12 }}>4 fun games</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => { playChime("tap"); router.push("/learn/english"); }}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: c.blue, borderRadius: c.radius, padding: 16, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 28 }}>🇬🇧</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", marginTop: 6 }}>{t("learnEnglish")}</Text>
          </Pressable>
          <Pressable
            onPress={() => { playChime("tap"); router.push("/learn/arabic"); }}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: c.green, borderRadius: c.radius, padding: 16, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 28 }}>🇸🇦</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", marginTop: 6 }}>{t("learnArabic")}</Text>
          </Pressable>
        </View>

        <BadgeShelf />

        {/* Learning Competitions – Coming Soon */}
        <View style={{ borderRadius: 24, overflow: "hidden" }}>
          <LinearGradient colors={["#7c3aed", "#4f46e5", "#2563eb"]} style={{ padding: 20 }}>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, backgroundColor: "#000" }} />
            <View style={{ position: "absolute", top: 14, right: 14, backgroundColor: "#F59E0B", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 11 }}>
                {lang === "ar" ? "قريباً 🚀" : "COMING SOON 🚀"}
              </Text>
            </View>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>🏅</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 20, marginBottom: 6 }}>
              {lang === "ar" ? "منافسات التعلم" : "Learning Competitions"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
              {lang === "ar"
                ? "تحدَّ أصدقاءك في مسابقات تعليمية ممتعة! 🥇"
                : "Challenge friends in fun learning contests! 🥇"}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {["🧮", "📖", "🔤", "🌍"].map((e, i) => (
                <View key={i} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </View>
              ))}
            </View>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 44 }}>🔒</Text>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14, marginTop: 6 }}>
                {lang === "ar" ? "يتم التطوير..." : "In development..."}
              </Text>
            </View>
          </LinearGradient>
        </View>

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
              marginTop: 12, backgroundColor: c.muted, padding: 12,
              borderRadius: 12, alignItems: "center", opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontWeight: "800", color: c.text }}>
              📖 {lang === "ar" ? "افتح القاموس" : "Open dictionary"}
            </Text>
          </Pressable>
        </SoftCard>

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
