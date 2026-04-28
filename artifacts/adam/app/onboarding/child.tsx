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

function calcAgeGroup(dob: string): "4-6" | "7-9" | "10-12" | "13-14" {
  if (!dob) return "7-9";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "7-9";
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age <= 6) return "4-6";
  if (age <= 9) return "7-9";
  if (age <= 12) return "10-12";
  return "13-14";
}

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  const now = new Date().getFullYear();
  return year >= now - 15 && year <= now - 3;
}

export default function ChildInfo() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    lang: "en" | "ar";
    hero: "boy" | "girl";
    parentName: string;
    parentEmail: string;
    password: string;
    country: string;
    currency: string;
    currencySymbol: string;
    currencyRate: string;
  }>();
  const isAr = params.lang === "ar";
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [dobError, setDobError] = useState("");

  const canContinue = name.trim().length > 0 && isValidDate(dob);

  function handleDobChange(text: string) {
    setDob(text);
    if (text.length === 10) {
      if (!isValidDate(text)) {
        setDobError(isAr ? "تاريخ غير صحيح (٣–١٥ سنة)" : "Invalid date (age 3–15)");
      } else {
        setDobError("");
      }
    } else {
      setDobError("");
    }
  }

  function handleContinue() {
    if (!canContinue) return;
    const ageGroup = calcAgeGroup(dob);
    router.push({
      pathname: "/onboarding/birthday",
      params: {
        ...params,
        name,
        age: ageGroup,
        dob,
      },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 28, fontWeight: "800", color: c.text, textAlign: "center" }}>
            {isAr ? "احكيلي عن طفلك" : "Tell me about your child"}
          </Text>

          {/* Child name */}
          <SoftCard>
            <Text style={{ fontWeight: "700", marginBottom: 6, color: c.text, textAlign: isAr ? "right" : "left" }}>
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

          {/* Date of birth */}
          <SoftCard>
            <Text style={{ fontWeight: "700", marginBottom: 6, color: c.text, textAlign: isAr ? "right" : "left" }}>
              {isAr ? "تاريخ الميلاد" : "Date of birth"}
            </Text>
            <TextInput
              value={dob}
              onChangeText={handleDobChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.mutedForeground}
              keyboardType="numeric"
              maxLength={10}
              style={{
                backgroundColor: c.input,
                padding: 14,
                borderRadius: 14,
                color: c.text,
                fontSize: 16,
                textAlign: isAr ? "right" : "left",
              }}
            />
            {dobError ? (
              <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{dobError}</Text>
            ) : dob.length === 10 && isValidDate(dob) ? (
              <Text style={{ color: "#22C55E", fontSize: 12, marginTop: 4 }}>
                {isAr ? `✓ ${calcAgeGroup(dob)} سنوات` : `✓ Age group: ${calcAgeGroup(dob)}`}
              </Text>
            ) : (
              <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 4 }}>
                {isAr ? "مثال: 2016-05-20" : "Example: 2016-05-20"}
              </Text>
            )}
          </SoftCard>

          {/* Hero reminder */}
          <View style={{
            backgroundColor: c.muted,
            borderRadius: 16,
            padding: 14,
            flexDirection: isAr ? "row-reverse" : "row",
            gap: 10,
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 28 }}>{params.hero === "girl" ? "🦸‍♀️" : "🦸‍♂️"}</Text>
            <Text style={{ flex: 1, color: c.mutedForeground, fontSize: 13, textAlign: isAr ? "right" : "left" }}>
              {isAr
                ? `بطلك هو ${params.hero === "girl" ? "لولو" : "آدم"} — يمكنك تغييره لاحقاً`
                : `Your hero is ${params.hero === "girl" ? "Lulu" : "Adam"} — you can change later`}
            </Text>
          </View>

          <View style={{ marginTop: 6 }}>
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
