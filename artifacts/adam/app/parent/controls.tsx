import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import type { ScreenLimit } from "@/lib/storage";

const limits: { value: ScreenLimit; en: string; ar: string }[] = [
  { value: 2, en: "2 hours / day", ar: "ساعتان يومياً" },
  { value: 4, en: "4 hours / day", ar: "٤ ساعات يومياً" },
  { value: 6, en: "6 hours / day", ar: "٦ ساعات يومياً" },
  { value: 0, en: "Unlimited", ar: "غير محدود" },
];

export default function Controls() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, patchProfile } = useApp();
  if (!profile) return null;
  const lang = profile.language;

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
          ⏱️ {t("parentControls")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text, marginBottom: 10 }}>
            {t("screenTimeLimit")}
          </Text>
          {limits.map((l) => {
            const sel = profile.screenLimitHours === l.value;
            return (
              <Pressable
                key={l.value}
                onPress={() => patchProfile({ screenLimitHours: l.value })}
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: sel ? c.primary : c.muted,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons
                  name={sel ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={sel ? "#FFF" : c.text}
                />
                <Text
                  style={{
                    fontWeight: "700",
                    color: sel ? "#FFF" : c.text,
                    fontSize: 15,
                  }}
                >
                  {lang === "ar" ? l.ar : l.en}
                </Text>
              </Pressable>
            );
          })}
        </SoftCard>

        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>
            🔊 {t("sound")}
          </Text>
          <Pressable
            onPress={() => patchProfile({ soundOn: !profile.soundOn })}
            style={({ pressed }) => ({
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              backgroundColor: profile.soundOn ? c.green : c.muted,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons
              name={profile.soundOn ? "volume-high" : "volume-mute"}
              size={20}
              color={profile.soundOn ? "#FFF" : c.text}
            />
            <Text
              style={{
                fontWeight: "700",
                color: profile.soundOn ? "#FFF" : c.text,
              }}
            >
              {profile.soundOn
                ? lang === "ar"
                  ? "الصوت مفعّل"
                  : "Sound is ON"
                : lang === "ar"
                  ? "الصوت مكتوم"
                  : "Sound is OFF"}
            </Text>
          </Pressable>
        </SoftCard>

        <SoftCard>
          <Text style={{ fontWeight: "800", color: c.text }}>
            🌍 {t("language")}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            {(["en", "ar"] as const).map((l) => {
              const sel = profile.language === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => patchProfile({ language: l })}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: sel ? c.primary : c.muted,
                    alignItems: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: sel ? "#FFF" : c.text,
                      fontWeight: "800",
                    }}
                  >
                    {l === "en" ? "🇬🇧 English" : "🇸🇦 العربية"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SoftCard>
      </ScrollView>
    </SafeAreaView>
  );
}
