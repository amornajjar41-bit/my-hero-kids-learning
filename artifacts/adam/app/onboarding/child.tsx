import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";

const ageGroups: Array<{ value: "4-6" | "7-9" | "10-12"; en: string; ar: string; emoji: string }> = [
  { value: "4-6", en: "4 – 6 years", ar: "٤ – ٦ سنوات", emoji: "🧸" },
  { value: "7-9", en: "7 – 9 years", ar: "٧ – ٩ سنوات", emoji: "🦄" },
  { value: "10-12", en: "10 – 12 years", ar: "١٠ – ١٢ سنة", emoji: "🚀" },
];

export default function ChildInfo() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    lang: "en" | "ar";
    hero: "boy" | "girl";
    parentName: string;
    parentEmail: string;
  }>();
  const isAr = params.lang === "ar";
  const [name, setName] = useState("");
  const [age, setAge] = useState<"4-6" | "7-9" | "10-12">("7-9");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: c.text,
              textAlign: "center",
            }}
          >
            {isAr ? "احكيلي عن طفلك" : "Tell me about your child"}
          </Text>

          <SoftCard>
            <Text
              style={{
                fontWeight: "700",
                marginBottom: 6,
                color: c.text,
                textAlign: isAr ? "right" : "left",
              }}
            >
              {isAr ? "اسم الطفل" : "Child's name"}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={isAr ? "مثال: عمر" : "e.g. Omar"}
              placeholderTextColor={c.mutedForeground}
              style={{
                backgroundColor: c.input,
                padding: 14,
                borderRadius: 14,
                color: c.text,
                fontSize: 16,
                textAlign: isAr ? "right" : "left",
              }}
            />
          </SoftCard>

          <SoftCard>
            <Text
              style={{
                fontWeight: "700",
                color: c.text,
                marginBottom: 10,
                textAlign: isAr ? "right" : "left",
              }}
            >
              {isAr ? "الفئة العمرية" : "Age group"}
            </Text>
            <View style={{ gap: 10 }}>
              {ageGroups.map((g) => {
                const selected = age === g.value;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => setAge(g.value)}
                    style={({ pressed }) => ({
                      backgroundColor: selected ? c.primary : c.muted,
                      padding: 16,
                      borderRadius: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 26 }}>{g.emoji}</Text>
                    <Text
                      style={{
                        flex: 1,
                        fontWeight: "700",
                        fontSize: 16,
                        color: selected ? "#FFF" : c.text,
                      }}
                    >
                      {isAr ? g.ar : g.en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SoftCard>

          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              title={isAr ? "متابعة" : "Continue"}
              fullWidth
              disabled={!name.trim()}
              onPress={() =>
                router.push({
                  pathname: "/onboarding/birthday",
                  params: { ...params, name, age },
                })
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
