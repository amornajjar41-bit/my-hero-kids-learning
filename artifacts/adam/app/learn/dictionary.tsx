import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { SpeakButton } from "@/components/SpeakButton";
import { curriculum } from "@/constants/curriculum";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";

export default function Dictionary() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile } = useApp();
  const [q, setQ] = useState("");
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const all = useMemo(() => {
    const set = new Map<string, { emoji: string; en: string; ar: string }>();
    curriculum.english.forEach((l) => {
      l.words.forEach((w) => set.set(w.en, w));
    });
    return Array.from(set.values()).sort((a, b) => a.en.localeCompare(b.en));
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const lo = q.toLowerCase();
    return all.filter((w) => w.en.toLowerCase().includes(lo));
  }, [q, all]);

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
        <Text style={{ fontSize: 22, fontWeight: "800", color: c.text, flex: 1 }}>
          📖 {t("pictureDictionary")}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 18 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search…"
          placeholderTextColor={c.mutedForeground}
          style={{
            backgroundColor: c.card,
            padding: 14,
            borderRadius: 14,
            color: c.text,
            fontSize: 16,
          }}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {filtered.map((w) => (
          <SoftCard
            key={w.en}
            style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
          >
            <Text style={{ fontSize: 40 }}>{w.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: c.text, fontSize: 18 }}>
                {w.en}
              </Text>
            </View>
            <SpeakButton text={w.en} voice={voice} />
          </SoftCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
