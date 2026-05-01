import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { playChime } from "@/lib/chime";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
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
import { useT } from "@/hooks/useT";
import { isBirthdayToday, todayISO, trialDaysLeft } from "@/lib/utils";

const { width: SW } = Dimensions.get("window");

// Floating animated orb
function Orb({ style, color, delay = 0 }: { style: any; color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
        ]),
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.7, 0.4] });
  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity, backgroundColor: color, borderRadius: 999 }]} />
  );
}

// Twinkling star
function Star({ style }: { style: any }) {
  const anim = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    const delay = Math.random() * 2000;
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 800 + Math.random() * 1200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 800 + Math.random() * 1200, useNativeDriver: true }),
        ]),
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return <Animated.Text style={[style, { opacity: anim }]}>✦</Animated.Text>;
}

// Pulsing action card
function ActionCard({ colors: gradColors, emoji, title, sub, cta, onPress }: {
  colors: [string, string]; emoji: string; title: string; sub: string; cta: string; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };
  return (
    <Pressable onPress={() => { pulse(); playChime("tap"); onPress(); }} style={{ flex: 1 }}>
      <Animated.View style={{ transform: [{ scale }], borderRadius: 24, overflow: "hidden", flex: 1 }}>
        <LinearGradient colors={gradColors} style={{ padding: 18, flex: 1 }}>
          <Text style={{ fontSize: 38 }}>{emoji}</Text>
          <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, marginTop: 8 }}>{title}</Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 3, fontSize: 11, lineHeight: 15 }}>{sub}</Text>
          <View style={{ marginTop: 12, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12 }}>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 11 }}>▶ {cta}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const ORBS = [
  { top: -40, left: SW * 0.1, size: 120, color: "#FF8A4C", delay: 0 },
  { top: 60, left: SW * 0.75, size: 80, color: "#FF6FB5", delay: 400 },
  { top: 180, left: SW * 0.05, size: 60, color: "#7C3AED", delay: 800 },
  { top: 280, left: SW * 0.8, size: 50, color: "#F59E0B", delay: 200 },
];

const STARS = [
  { top: 30, left: "18%", fontSize: 10, color: "#FDE68A" },
  { top: 70, left: "65%", fontSize: 7, color: "#FF8A4C" },
  { top: 120, left: "85%", fontSize: 12, color: "#FF6FB5" },
  { top: 200, left: "8%", fontSize: 9, color: "#F59E0B" },
  { top: 250, left: "55%", fontSize: 8, color: "#FDE68A" },
  { top: 320, left: "78%", fontSize: 11, color: "#FF8A4C" },
];

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, progress, saveProgress, addPoints, isScreenBlocked } = useApp();
  const { showTour, completeTour } = useTour();

  useFocusEffect(
    useCallback(() => {
      if (isScreenBlocked) { router.replace("/blocked"); return; }

      const today = todayISO();
      if (progress.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = progress.lastActiveDate === yesterday
          ? progress.streak + 1
          : progress.lastActiveDate === today ? progress.streak : 1;
        saveProgress((prev) => ({
          ...prev, streak: newStreak, lastActiveDate: today,
          monthlyActiveDays: prev.monthlyActiveDays.includes(today)
            ? prev.monthlyActiveDays : [...prev.monthlyActiveDays, today],
        }));
        if (newStreak === 3) addPoints(50);
        else if (newStreak === 7) addPoints(150);
      }

      if (profile?.childBirthday && isBirthdayToday(profile.childBirthday)) {
        const lastShown = (globalThis as any).__bday;
        if (lastShown !== today) {
          const hour = new Date().getHours();
          if (hour >= 8) { (globalThis as any).__bday = today; router.push("/birthday-celebration"); }
        }
      }
    }, [profile, progress, saveProgress, router, isScreenBlocked]),
  );

  const suggestion = useMemo(() => {
    const lessons = curriculum.english;
    return lessons.find((l) => !progress.lessonsCompleted.includes(l.id)) ?? lessons[0];
  }, [progress.lessonsCompleted]);

  const trialDays = profile ? trialDaysLeft(profile.trialStartedAt) : 3;
  const trialEnded = profile && !profile.isPaid && trialDays <= 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Rich gradient background */}
      <LinearGradient
        colors={["#1A0533", "#2D1264", "#1A2A6C", "#0D4F8C"]}
        locations={[0, 0.3, 0.65, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Animated orbs */}
      {ORBS.map((o, i) => (
        <Orb key={i} color={o.color} delay={o.delay}
          style={{ position: "absolute", top: o.top, left: o.left, width: o.size, height: o.size, opacity: 0.15 }}
        />
      ))}

      {/* Twinkling stars */}
      {STARS.map((s, i) => (
        <Star key={i} style={{ position: "absolute", top: s.top, left: s.left, fontSize: s.fontSize, color: s.color }} />
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
          <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SoundToggle />
              <Pressable
                onPress={() => { playChime("tap"); router.push("/parent"); }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14, height: 44, borderRadius: 22,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  opacity: pressed ? 0.85 : 1,
                  borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
                })}
              >
                <Text style={{ fontWeight: "800", color: "#FFF", fontSize: 13 }}>
                  👨‍👩‍👧 {t("parents")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Greeting — white card */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
            <Greeting />
          </View>

          <DailyTip />
          <TrialBanner onUpgrade={() => router.push("/parent/upgrade")} />
          <StreakCard streak={progress.streak} stars={progress.starsTotal} />

          {!trialEnded && (
            <TodaySuggestion
              emoji={suggestion.emoji}
              title={lessonTitle(suggestion)}
              subtitle={progress.lessonsCompleted.includes(suggestion.id) ? t("continueWhereLeftOff") : t("startLearning")}
              cta={t("playNow")}
              onPress={() => router.push(`/learn/lesson/${suggestion.id}`)}
            />
          )}

          {/* Main action cards */}
          <View style={{ flexDirection: "row", gap: 12, height: 180 }}>
            <ActionCard
              colors={["#FF8A4C", "#FF4D00"]}
              emoji="📚" title={t("homeworkHelper")} sub={t("homeworkHelperSub")} cta={t("playNow")}
              onPress={() => router.push("/(tabs)/chat")}
            />
            <ActionCard
              colors={["#FF6FB5", "#C2185B"]}
              emoji="🎮" title={t("playAndLearn")} sub="10 fun games" cta={t("playNow")}
              onPress={() => router.push("/(tabs)/games")}
            />
          </View>

          {/* Stories card */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/(tabs)/stories"); }}
            style={({ pressed }) => ({ borderRadius: 24, overflow: "hidden", opacity: pressed ? 0.88 : 1 })}
          >
            <LinearGradient colors={["#7C3AED", "#4338CA"]} style={{ padding: 20 }}>
              <Star style={{ position: "absolute", top: 12, right: 20, fontSize: 10, color: "rgba(255,255,255,0.5)" }} />
              <Star style={{ position: "absolute", top: 32, right: 48, fontSize: 7, color: "rgba(255,255,255,0.35)" }} />
              <Star style={{ position: "absolute", bottom: 14, right: 28, fontSize: 9, color: "rgba(255,255,255,0.4)" }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Text style={{ fontSize: 40 }}>🌙</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>Bedtime Stories</Text>
                  <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
                    {progress.storiesListened} stories listened
                  </Text>
                </View>
                <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13 }}>▶ Play</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Learn English */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/learn/english"); }}
            style={({ pressed }) => ({ borderRadius: 24, overflow: "hidden", opacity: pressed ? 0.88 : 1 })}
          >
            <LinearGradient colors={["#00B4D8", "#0077B6"]} style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Text style={{ fontSize: 38 }}>🇬🇧</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>{t("learnEnglish")}</Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>
                  {progress.lessonsCompleted.length} lessons completed
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 28, fontWeight: "300" }}>›</Text>
            </LinearGradient>
          </Pressable>

          {/* Trophy Room — single entry via BadgeShelf */}
          <BadgeShelf />

          {/* Coming soon */}
          <View style={{ borderRadius: 24, overflow: "hidden" }}>
            <LinearGradient colors={["#7c3aed", "#4f46e5", "#2563eb"]} style={{ padding: 20 }}>
              <View style={{ position: "absolute", top: 14, right: 14, backgroundColor: "#F59E0B", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: "#000", fontWeight: "900", fontSize: 11 }}>COMING SOON 🚀</Text>
              </View>
              <Text style={{ fontSize: 34, marginBottom: 8 }}>🏅</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18, marginBottom: 4 }}>Learning Competitions</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 18 }}>
                Challenge friends in fun learning contests! 🥇
              </Text>
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.32)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 40 }}>🔒</Text>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 13, marginTop: 6 }}>In development…</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Dictionary card */}
          <Pressable
            onPress={() => { playChime("tap"); router.push("/learn/dictionary"); }}
            style={({ pressed }) => ({ borderRadius: 24, overflow: "hidden", opacity: pressed ? 0.88 : 1 })}
          >
            <LinearGradient colors={["#F59E0B", "#D97706"]} style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Text style={{ fontSize: 36 }}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 17 }}>{t("pictureDictionary")}</Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 3, fontSize: 12 }}>{t("tapToHear")}</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 28, fontWeight: "300" }}>›</Text>
            </LinearGradient>
          </Pressable>

          {/* Stats footer */}
          <View style={{ alignItems: "center", marginTop: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {progress.wordsLearned} {t("wordsLearned").toLowerCase()} · {progress.lessonsCompleted.length} {t("lessonsCompleted").toLowerCase()}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 }}>
              {allBadges.length} trophies to collect ✦
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
