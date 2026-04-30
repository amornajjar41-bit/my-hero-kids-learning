import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { loginUser, saveSessionToken } from "@/lib/auth";
import type { AgeGroup, Hero, Profile, ScreenLimit } from "@/lib/storage";

export default function SignIn() {
  const router = useRouter();
  const { saveProfile } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await loginUser(trimmedEmail, password);
      if (result.error) {
        if (result.error === "invalid_credentials") {
          setError("Incorrect email or password. Please try again.");
        } else if (result.error === "network_error") {
          setError("Cannot connect. Please check your internet and try again.");
        } else {
          setError("Sign in failed. Please try again.");
        }
        return;
      }

      if (result.sessionToken) {
        await saveSessionToken(result.sessionToken);
      }

      const u = result.user as Record<string, unknown> | null | undefined;
      const c = result.child as Record<string, unknown> | null | undefined;

      const profile: Profile = {
        language: "en",
        hero: (((c?.characterChoice ?? c?.gender) as string) === "girl" ? "girl" : "boy") as Hero,
        childName: (c?.childName as string) ?? "",
        ageGroup: ((c?.ageGroup as string) ?? "7-9") as AgeGroup,
        parentEmail: trimmedEmail,
        parentName: (u?.parentName as string) ?? "",
        trialStartedAt: (u?.trialStart as string) ?? new Date().toISOString(),
        isPaid: (u?.subscriptionStatus as string) === "active",
        paidPlan: (u?.subscriptionPlan as Profile["paidPlan"]) ?? undefined,
        screenLimitHours: 2 as ScreenLimit,
        soundOn: true,
        country: (u?.country as string) ?? undefined,
        currency: (u?.currency as string) ?? undefined,
      };
      await saveProfile(profile);
      router.replace("/(tabs)/chat" as never);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#1e0a4a", "#3b1a8a", "#6d28d9", "#f97316"]}
      locations={[0, 0.35, 0.65, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Back ─────────────────────────────────────────────────── */}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                marginTop: 12, alignSelf: "flex-start",
                flexDirection: "row", alignItems: "center", gap: 6,
                opacity: pressed ? 0.6 : 1, padding: 4,
              })}
            >
              <Ionicons name="chevron-back" size={22} color="#FFF" />
              <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>Back</Text>
            </Pressable>

            {/* ── Header ───────────────────────────────────────────────── */}
            <View style={{ alignItems: "center", marginTop: 32, marginBottom: 36 }}>
              <Text style={{ fontSize: 52 }}>🦸</Text>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 28, marginTop: 12, textAlign: "center" }}>
                Welcome Back!
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 8, textAlign: "center" }}>
                Sign in to continue your hero's journey
              </Text>
            </View>

            {/* ── Form ─────────────────────────────────────────────────── */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                gap: 16,
              }}
            >
              {/* Email */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 13 }}>
                  Parent Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(""); }}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    padding: 16,
                    color: "#FFF",
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                />
              </View>

              {/* Password */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 13 }}>
                  Password
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(""); }}
                    placeholder="Your password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.12)",
                      borderRadius: 14,
                      padding: 16,
                      paddingRight: 50,
                      color: "#FFF",
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.2)",
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 14, top: 0, bottom: 0,
                      justifyContent: "center", alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Error */}
              {!!error && (
                <View style={{
                  backgroundColor: "rgba(239,68,68,0.2)", borderRadius: 12,
                  padding: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
                }}>
                  <Text style={{ color: "#FCA5A5", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Sign In Button */}
              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                style={({ pressed }) => ({
                  backgroundColor: "#f97316",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: pressed || loading ? 0.85 : 1,
                  shadowColor: "#f97316",
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  marginTop: 4,
                })}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 17 }}>
                    Sign In 🚀
                  </Text>
                )}
              </Pressable>
            </View>

            {/* ── New here ─────────────────────────────────────────────── */}
            <Pressable
              onPress={() => router.replace("/onboarding/hero" as never)}
              style={({ pressed }) => ({
                marginTop: 24, alignItems: "center", opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                New here?{" "}
                <Text style={{ color: "#FFF", fontWeight: "800" }}>
                  Create an account
                </Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
