import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";

export default function ParentInfo() {
  const c = useColors();
  const router = useRouter();
  const { lang, hero } = useLocalSearchParams<{
    lang: "en" | "ar";
    hero: "boy" | "girl";
  }>();
  const isAr = lang === "ar";
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail);

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
            {isAr ? "بيانات ولي الأمر" : "Parent details"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: c.mutedForeground,
              textAlign: "center",
            }}
          >
            {isAr
              ? "آدم بيرسل تقرير تقدّم أسبوعي مجاني 📬"
              : "Adam sends a free weekly progress report 📬"}
          </Text>

          <SoftCard>
            <Text
              style={{
                fontWeight: "700",
                color: c.text,
                marginBottom: 6,
                textAlign: isAr ? "right" : "left",
              }}
            >
              {isAr ? "اسمك" : "Your name (optional)"}
            </Text>
            <TextInput
              value={parentName}
              onChangeText={setParentName}
              placeholder={isAr ? "مثال: ليلى" : "e.g. Sara"}
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
                marginBottom: 6,
                textAlign: isAr ? "right" : "left",
              }}
            >
              {isAr ? "بريد ولي الأمر" : "Parent email"}
            </Text>
            <TextInput
              value={parentEmail}
              onChangeText={setParentEmail}
              placeholder="parent@example.com"
              placeholderTextColor={c.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
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

          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              title={isAr ? "متابعة" : "Continue"}
              fullWidth
              disabled={!validEmail}
              onPress={() =>
                router.push({
                  pathname: "/onboarding/child",
                  params: { lang, hero, parentName, parentEmail },
                })
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
