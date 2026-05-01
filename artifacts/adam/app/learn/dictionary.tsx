import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SpeakButton } from "@/components/SpeakButton";
import { curriculum } from "@/constants/curriculum";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";

const CARD_COLORS: [string, string][] = [
  ["#FF8A4C", "#FF4D00"],
  ["#FF6FB5", "#C2185B"],
  ["#7C3AED", "#4338CA"],
  ["#00B4D8", "#0077B6"],
  ["#10B981", "#065F46"],
  ["#F59E0B", "#D97706"],
  ["#EF4444", "#B91C1C"],
  ["#8B5CF6", "#6D28D9"],
  ["#06B6D4", "#0E7490"],
  ["#84CC16", "#3F6212"],
];

function WordCard({ word, index, voice }: { word: { emoji: string; en: string }; index: number; voice: "echo" | "nova" }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = CARD_COLORS[index % CARD_COLORS.length]!;

  useEffect(() => {
    const delay = (index % 15) * 30;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <View style={{ borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
        <LinearGradient colors={colors} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 32 }}>{word.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "900", color: "#FFF", fontSize: 20 }}>{word.en}</Text>
          </View>
          <SpeakButton text={word.en} voice={voice} />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

export default function Dictionary() {
  const router = useRouter();
  const t = useT();
  const { profile } = useApp();
  const [q, setQ] = useState("");
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const all = useMemo(() => {
    const set = new Map<string, { emoji: string; en: string }>();
    curriculum.english.forEach((l) => {
      l.words.forEach((w) => set.set(w.en, { emoji: w.emoji, en: w.en }));
    });
    return Array.from(set.values()).sort((a, b) => a.en.localeCompare(b.en));
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const lo = q.toLowerCase();
    return all.filter((w) => w.en.toLowerCase().includes(lo));
  }, [q, all]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1A0533", "#0D2D6B", "#0A4A7A"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFF", flex: 1 }}>
            📖 {t("pictureDictionary")}
          </Text>
        </View>

        {/* Search bar */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search words…"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={{ flex: 1, paddingVertical: 14, color: "#FFF", fontSize: 16 }}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
          </View>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 6, marginLeft: 4 }}>
            {filtered.length} words
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }} showsVerticalScrollIndicator={false}>
          {filtered.map((w, i) => (
            <WordCard key={w.en} word={w} index={i} voice={voice} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
