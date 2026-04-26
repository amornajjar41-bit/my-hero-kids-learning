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
import { setJSON, STORAGE_KEYS } from "@/lib/storage";

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
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail);
  const canContinue = validEmail && termsAccepted;

  async function handleContinue() {
    if (!canContinue) return;
    // Persist terms acceptance timestamp
    await setJSON(STORAGE_KEYS.termsAccepted, { acceptedAt: new Date().toISOString() });
    router.push({
      pathname: "/onboarding/child",
      params: { lang, hero, parentName, parentEmail },
    });
  }

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

          {/* Terms and Conditions checkbox */}
          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={{
              flexDirection: isAr ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 12,
              paddingVertical: 4,
            }}
          >
            {/* Checkbox */}
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: termsAccepted ? c.primary : c.mutedForeground,
                backgroundColor: termsAccepted ? c.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              {termsAccepted && (
                <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "800" }}>✓</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, lineHeight: 20, textAlign: isAr ? "right" : "left" }}>
                {isAr ? "أوافق على " : "I agree to the "}
                <Text
                  onPress={() => router.push("/terms" as any)}
                  style={{ color: c.primary, fontWeight: "700", textDecorationLine: "underline" }}
                >
                  {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                </Text>
                {isAr
                  ? " وسياسة الخصوصية لـ My Hero"
                  : " and Privacy Policy of My Hero"}
              </Text>
              {!termsAccepted && (
                <Text style={{ color: "#EF4444", fontSize: 11, marginTop: 4, textAlign: isAr ? "right" : "left" }}>
                  {isAr ? "* مطلوب للمتابعة" : "* Required to continue"}
                </Text>
              )}
            </View>
          </Pressable>

          <View style={{ marginTop: 4 }}>
            <PrimaryButton
              title={isAr ? "متابعة" : "Continue"}
              fullWidth
              disabled={!canContinue}
              onPress={handleContinue}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
