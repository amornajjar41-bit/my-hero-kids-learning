import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { playChime } from "@/lib/chime";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BadgeShelf } from "@/components/BadgeShelf";
import { DailyTip } from "@/components/DailyTip";
import { Greeting } from "@/components/Greeting";
import { HeroLogo } from "@/components/HeroLogo";
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
import { isBirthdayToday, todayISO, trialDaysLeft } from "@/lib/utils";

// Floating sparkle that twinkles
function Sparkle({ style }: { style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = Math.random() * 2000;
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1400 + Math.random() * 1000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.15, duration: 1400 + Math.random() * 1000, useNativeDriver: true }),
        ]),
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [anim]);
  return (
    <Animated.Text style={[style, { opacity: anim }]}>✦</Animated.Text>
  );
}

const SPARKLES = [
  { top: 30, left: "15%", fontSize: 9, color: "#F59E0B" },
  { top: 55, left: "72%", fontSize: 7, color: "#FF8A4C" },
  { top: 90, left: "88%", fontSize: 11, color: "#FDE68A" },
  { top: 140, left: "5%", fontSize: 8, color: "#FF6FB5" },
  { top: 200, left: "60%", fontSize: 10, color: "#F59E0B" },
  { top: 260, left: "25%", fontSize: 7, color: "#FDE68A" },
  { top: 320, left: "80%", fontSize: 9, color: "#FF8A4C" },
];

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { profile, progress, saveProgress, addPoints, isScreenBlocked } = useApp();

  const { showTour, completeTour } = useTour();

  useFocusEffect(
    useCallback(() => {
      if (isScreenBlocked) {
        router.replace("/blocked");
        return;
      }

      const today = todayISO();
      if (progress.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = progress.lastActiveDate === yesterday
          ? progress.streak + 1
          : progress.lastActiveDate === today
            ? progress.streak
            : 1;
        saveProgress((prev) => ({
          ...prev,
          streak: newStreak,
          lastActiveDate: today,
          monthlyActiveDays: prev.monthlyActiveDays.includes(today)
            ? prev.monthlyActiveDays
            : [...prev.monthlyActiveDays, today],
        }));
        if (newStreak === 3) addPoints(50);
        else if (newStreak === 7) addPoints(150);
      }

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
    <View style={{ flex: 1 }}>
      {/* Warm gradient background */}
      <LinearGradient
        colors={["#FFF6E5", "#FFF0D0", "#FFE8B8"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Warm ambient glow top */}
      <View style={{
        position: "absolute", top: -80, alignSelf: "center",
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: "#FF8A4C", opacity: 0.08,
      }} />
      {/* Bottom warm glow */}
      <View style={{
        position: "absolute", bottom: -60, right: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: "#FF6FB5", opacity: 0.07,
      }} />

      {/* Floating sparkles */}
      {SPARKLES.map((s, i) => (
        <Sparkle
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            fontSize: s.fontSize,
            color: s.color,
          }}
        />
      ))}

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <Tour visible={showTour} onDone={completeTour} />

        <ScrollView
          contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo row */}
          <View style={{ alignItems: "center", paddingVertical: 6 }}>
            <HeroLogo size="md" layout="column" />
          </View>

          {/* Top actions */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SoundToggle />
              <Pressable
                onPress={() => { playChime("tap"); router.push("/parent"); }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14, height: 44, borderRadius: 22,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "#FFF",
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: "#FF8A4C", shadowOpacity: 0.2, shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 }, elevation: 3,
                  borderWidth: 1.5, borderColor: "#FFE2BC",
                })}
              >
                <Text style={{ fontWeight: "800", color: c.text, fontSize: 13 }}>
                  👨‍👩‍👧 {t("parents")}
                </Text>
              </Pressable>
            </View>
          </View>

          <Greeting />
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

          {/* Main action cards — warm rounded */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => { playChime("tap"); router.push("/(tabs)/chat"); }}
              style={({ pressed }) => ({
                flex: 1, borderRadius: 22, padding: 18, opacity: pressed ? 0.88 : 1,
                overflow: "hidden",
              })}
            >
              <LinearGradient
                colors={["#FF8A4C", "#FF6B2B"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <Text style={{ fontSize: 34 }}>📚</Text>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15, marginTop: 8 }}>{t("homeworkHelper")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 11, lineHeight: 16 }}>{t("homeworkHelperSub")}</Text>
              <View style={{ marginTop: 10, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.22)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 10 }}>▶ {t("playNow")}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => { playChime("tap"); router.push("/(tabs)/games"); }}
              style={({ pressed }) => ({
                flex: 1, borderRadius: 22, padding: 18, opacity: pressed ? 0.88 : 1,
                overflow: "hidden",
              })}
            >
              <LinearGradient
                colors={["#FF6FB5", "#E8429A"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <Text style={{ fontSize: 34 }}>🎮</Text>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15, marginTop: 8 }}>{t("playAndLearn")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 11, lineHeight: 16 }}>7 fun games</Text>
              <View style={{ marginTop: 10, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.22)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 10 }}>▶ {t("playNow")}</Text>
              </View>
            </Pressable>
          </View>

          {/* Stories card */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/(tabs)/stories"); }}
            style={({ pressed }) => ({
              borderRadius: 22, padding: 20, opacity: pressed ? 0.88 : 1, overflow: "hidden",
            })}
          >
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {/* Decorative stars in card */}
            <Text style={{ position: "absolute", top: 12, right: 20, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>✦</Text>
            <Text style={{ position: "absolute", top: 30, right: 50, fontSize: 7, color: "rgba(255,255,255,0.3)" }}>✦</Text>
            <Text style={{ position: "absolute", bottom: 14, right: 30, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>✦</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Text style={{ fontSize: 38 }}>🌙</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 17 }}>
                  {lang === "ar" ? "قصص وقت النوم" : "Bedtime Stories"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
                  {progress.storiesListened} {lang === "ar" ? "قصة مسموعة" : "stories listened"}
                </Text>
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>▶ {t("playNow")}</Text>
              </View>
            </View>
          </Pressable>

          {/* Learn English */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/learn/english"); }}
            style={({ pressed }) => ({
              borderRadius: 22, padding: 18, opacity: pressed ? 0.88 : 1, overflow: "hidden",
              flexDirection: "row", alignItems: "center", gap: 14,
            })}
          >
            <LinearGradient
              colors={["#4ECDC4", "#26A69A"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Text style={{ fontSize: 36 }}>🇬🇧</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 17 }}>{t("learnEnglish")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
                {progress.lessonsCompleted.length} {lang === "ar" ? "درس مكتمل" : "lessons completed"}
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 24 }}>›</Text>
          </Pressable>

          <BadgeShelf />

          {/* Rewards teaser */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/rewards"); }}
            style={({ pressed }) => ({
              borderRadius: 22, overflow: "hidden", opacity: pressed ? 0.9 : 1,
            })}
          >
            <LinearGradient colors={["#1A0F3F", "#2D1B69", "#3D2480"]} style={{ padding: 20 }}>
              <View style={{ position: "absolute", top: 10, right: 14, opacity: 0.5 }}>
                <Text style={{ fontSize: 8, color: "#FDE68A" }}>✦✦✦</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Text style={{ fontSize: 38 }}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 17 }}>
                    {lang === "ar" ? "غرفة الجوائز" : "Rewards Room"}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                    ⭐ {progress.pointsTotal ?? 0} {lang === "ar" ? "نقطة" : "pts"} · {allBadges.length} {lang === "ar" ? "شارة" : "badges"}
                  </Text>
                </View>
                <View style={{ backgroundColor: "#F59E0B", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: "#000", fontWeight: "900", fontSize: 12 }}>
                    {lang === "ar" ? "افتح" : "Open"}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Coming soon */}
          <View style={{ borderRadius: 22, overflow: "hidden" }}>
            <LinearGradient colors={["#7c3aed", "#4f46e5", "#2563eb"]} style={{ padding: 20 }}>
              <View style={{ position: "absolute", top: 14, right: 14, backgroundColor: "#F59E0B", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: "#000", fontWeight: "900", fontSize: 11 }}>COMING SOON 🚀</Text>
              </View>
              <Text style={{ fontSize: 34, marginBottom: 8 }}>🏅</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18, marginBottom: 4 }}>
                {lang === "ar" ? "مسابقات التعلم" : "Learning Competitions"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 18 }}>
                {lang === "ar" ? "تحدّ أصدقاءك في مسابقات ممتعة! 🥇" : "Challenge friends in fun learning contests! 🥇"}
              </Text>
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.32)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 40 }}>🔒</Text>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13, marginTop: 6 }}>In development…</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Dictionary card */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/learn/dictionary"); }}
            style={({ pressed }) => ({
              backgroundColor: "#FFF", borderRadius: 22, padding: 18, opacity: pressed ? 0.88 : 1,
              flexDirection: "row", alignItems: "center", gap: 14,
              shadowColor: "#FF8A4C", shadowOpacity: 0.15, shadowRadius: 10, elevation: 3,
              borderWidth: 1.5, borderColor: "#FFE2BC",
            })}
          >
            <Text style={{ fontSize: 34 }}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>{t("pictureDictionary")}</Text>
              <Text style={{ color: c.mutedForeground, marginTop: 3, fontSize: 12 }}>{t("tapToHear")}</Text>
            </View>
            <Text style={{ color: c.mutedForeground, fontSize: 22 }}>›</Text>
          </Pressable>

          {/* Stats footer */}
          <View style={{ alignItems: "center", marginTop: 6 }}>
            <Text style={{ color: "#B58B60", fontSize: 12 }}>
              {progress.wordsLearned} {t("wordsLearned").toLowerCase()} ·{" "}
              {progress.lessonsCompleted.length} {t("lessonsCompleted").toLowerCase()}
            </Text>
            <Text style={{ color: "#C9A070", fontSize: 11, marginTop: 4 }}>
              {allBadges.length} badges to collect ✦
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
