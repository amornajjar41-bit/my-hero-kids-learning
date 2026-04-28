import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { curriculum } from "@/constants/curriculum";

export default function LearnTab() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { progress } = useApp();

  const enDone = progress.englishLessons;
  const enTotal = curriculum.english.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: c.text }}>
          📚 {t("startLearning")}
        </Text>
        <Text style={{ color: c.mutedForeground, fontSize: 14 }}>
          Choose a subject to start learning
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
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 22, marginTop: 8 }}>
              {t("learnEnglish")}
            </Text>
            <Text style={{ color: "#FFF", opacity: 0.9, marginTop: 4 }}>
              {enDone} / {enTotal} lessons • 3 units
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

      </ScrollView>
    </SafeAreaView>
  );
}
