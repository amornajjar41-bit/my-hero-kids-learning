import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT, useLang } from "@/hooks/useT";
import { curriculum } from "@/constants/curriculum";

export default function LearnTab() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { progress } = useApp();

  const enDone = progress.englishLessons;
  const arDone = progress.arabicLessons;
  const enTotal = curriculum.english.length;
  const arTotal = curriculum.arabic.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: c.text }}>
          📚 {t("startLearning")}
        </Text>
        <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
          {t("pickLanguage")}
        </Text>

        <Pressable
          onPress={() => router.push("/learn/english")}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View
            style={{
              backgroundColor: c.blue,
              borderRadius: c.radius,
              padding: 22,
            }}
          >
            <Text style={{ fontSize: 44 }}>🇬🇧</Text>
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 22,
                marginTop: 8,
              }}
            >
              {t("learnEnglish")}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.9, marginTop: 4 }}>
              {enDone} / {enTotal} {lang === "ar" ? "درس" : "lessons"} • 3 {lang === "ar" ? "وحدات" : "units"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/learn/arabic")}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View
            style={{
              backgroundColor: c.green,
              borderRadius: c.radius,
              padding: 22,
            }}
          >
            <Text style={{ fontSize: 44 }}>🇸🇦</Text>
            <Text
              style={{
                color: "#FFF",
                fontWeight: "800",
                fontSize: 22,
                marginTop: 8,
              }}
            >
              {t("learnArabic")}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.9, marginTop: 4 }}>
              {arDone} / {arTotal} {lang === "ar" ? "درس" : "lessons"} • 3 {lang === "ar" ? "وحدات" : "units"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/learn/dictionary")}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <SoftCard color={c.purple}>
            <Text style={{ fontSize: 30 }}>📖</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 18, marginTop: 6 }}>
              {t("pictureDictionary")}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.9, marginTop: 4, fontSize: 13 }}>
              {t("tapToHear")}
            </Text>
          </SoftCard>
        </Pressable>

        <Pressable
          onPress={() => router.push("/stories" as any)}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View style={{ backgroundColor: "#1A0F3F", borderRadius: c.radius, padding: 22 }}>
            <Text style={{ fontSize: 44 }}>🌙</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 22, marginTop: 8 }}>
              {lang === "ar" ? "قصص ما قبل النوم" : "Bedtime Stories"}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.8, marginTop: 4, fontSize: 13 }}>
              {lang === "ar" ? "١٠ قصص بالعربي والإنجليزي" : "10 stories · Arabic & English"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
