import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { setJSON, STORAGE_KEYS } from "@/lib/storage";
import { COUNTRIES } from "@/constants/countries";

export default function ParentInfo() {
  const c = useColors();
  const router = useRouter();
  const { lang, hero } = useLocalSearchParams<{ lang: "en" | "ar"; hero: "boy" | "girl" }>();
  const isAr = lang === "ar";

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]!);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail);
  const validPassword = password.length >= 8 && /\d/.test(password);
  const canContinue = validEmail && validPassword && termsAccepted;

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return q
      ? COUNTRIES.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.nameAr.includes(q) ||
            c.code.toLowerCase().includes(q)
        )
      : COUNTRIES;
  }, [countrySearch]);

  async function handleContinue() {
    if (!canContinue) return;
    await setJSON(STORAGE_KEYS.termsAccepted, { acceptedAt: new Date().toISOString() });
    router.push({
      pathname: "/onboarding/child",
      params: {
        lang,
        hero,
        parentName,
        parentEmail,
        password,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.symbol,
        currencyRate: String(selectedCountry.rate),
      },
    });
  }

  const inputStyle = {
    backgroundColor: c.input,
    padding: 14,
    borderRadius: 14,
    color: c.text,
    fontSize: 16,
    textAlign: (isAr ? "right" : "left") as "right" | "left",
  };

  const labelStyle = {
    fontWeight: "700" as const,
    color: c.text,
    marginBottom: 6,
    textAlign: (isAr ? "right" : "left") as "right" | "left",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 28, fontWeight: "800", color: c.text, textAlign: "center" }}>
            {isAr ? "بيانات ولي الأمر" : "Parent details"}
          </Text>
          <Text style={{ fontSize: 14, color: c.mutedForeground, textAlign: "center" }}>
            {isAr ? "آدم يرسل تقرير تقدّم أسبوعي مجاني 📬" : "Adam sends a free weekly progress report 📬"}
          </Text>

          {/* Parent Name */}
          <SoftCard>
            <Text style={labelStyle}>{isAr ? "اسمك (اختياري)" : "Your name (optional)"}</Text>
            <TextInput
              value={parentName}
              onChangeText={setParentName}
              placeholder={isAr ? "مثال: ليلى" : "e.g. Sara"}
              placeholderTextColor={c.mutedForeground}
              style={inputStyle}
            />
          </SoftCard>

          {/* Email */}
          <SoftCard>
            <Text style={labelStyle}>{isAr ? "البريد الإلكتروني" : "Parent email"}</Text>
            <TextInput
              value={parentEmail}
              onChangeText={setParentEmail}
              placeholder="parent@example.com"
              placeholderTextColor={c.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle}
            />
          </SoftCard>

          {/* Password */}
          <SoftCard>
            <Text style={labelStyle}>{isAr ? "كلمة المرور" : "Password"}</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={isAr ? "٦ أحرف على الأقل" : "8+ chars with a number"}
                placeholderTextColor={c.mutedForeground}
                secureTextEntry={!showPassword}
                style={[inputStyle, { paddingRight: 48 }]}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 14, top: 14 }}
              >
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={c.mutedForeground} />
              </Pressable>
            </View>
            {password.length > 0 && !validPassword && (
              <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>
                {isAr ? "* كلمة المرور قصيرة جداً" : "* Needs 8+ chars and 1 number"}
              </Text>
            )}
          </SoftCard>

          {/* Country */}
          <SoftCard>
            <Text style={labelStyle}>{isAr ? "البلد" : "Country"}</Text>
            <Pressable
              onPress={() => setShowCountryPicker(true)}
              style={{
                backgroundColor: c.input,
                padding: 14,
                borderRadius: 14,
                flexDirection: isAr ? "row-reverse" : "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 24 }}>{selectedCountry.flag}</Text>
              <Text style={{ flex: 1, color: c.text, fontSize: 16 }}>
                {isAr ? selectedCountry.nameAr : selectedCountry.name}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                {selectedCountry.currency}
              </Text>
              <Ionicons name="chevron-down" size={18} color={c.mutedForeground} />
            </Pressable>
          </SoftCard>

          {/* Terms */}
          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, paddingVertical: 4 }}
          >
            <View
              style={{
                width: 24, height: 24, borderRadius: 6, borderWidth: 2,
                borderColor: termsAccepted ? c.primary : c.mutedForeground,
                backgroundColor: termsAccepted ? c.primary : "transparent",
                alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0,
              }}
            >
              {termsAccepted && <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "800" }}>✓</Text>}
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
                {isAr ? " وسياسة الخصوصية لـ My Hero" : " and Privacy Policy of My Hero"}
              </Text>
              {!termsAccepted && (
                <Text style={{ color: "#EF4444", fontSize: 11, marginTop: 4 }}>
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

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: c.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%", paddingBottom: 20 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }}>
                <Ionicons name="close" size={24} color={c.text} />
              </Pressable>
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder={isAr ? "ابحث عن بلدك..." : "Search country..."}
                placeholderTextColor={c.mutedForeground}
                style={{ flex: 1, backgroundColor: c.input, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: c.text, fontSize: 15 }}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setSelectedCountry(item); setShowCountryPicker(false); setCountrySearch(""); }}
                  style={({ pressed }) => ({
                    flexDirection: isAr ? "row-reverse" : "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    gap: 14,
                    backgroundColor: item.code === selectedCountry.code ? c.muted : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 26 }}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: "600", fontSize: 15 }}>
                      {isAr ? item.nameAr : item.name}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{item.currency} · {item.symbol}</Text>
                  </View>
                  {item.code === selectedCountry.code && (
                    <Ionicons name="checkmark" size={20} color={c.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
