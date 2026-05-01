import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { PLANS_USD, convertPrice } from "@/constants/countries";
import { registerUser, saveSessionToken } from "@/lib/auth";
import { useApp } from "@/contexts/AppContext";

type PlanKey = "free" | "monthly" | "biannual" | "yearly";

const BENEFITS_EN = [
  "18 Technology & AI lessons — robots, coding, cybersecurity & the future 🤖",
  "Homework help in Math, English, Science and more",
  "Learns at your child's pace — adapts from age 4 to 14",
  "AI voice chat — your child speaks, their hero listens and teaches",
  "You control screen time and monitor progress",
  "Safe, ad-free, and built for children",
  "Costs less than one private tutoring session",
];

export default function Done() {
  const c = useColors();
  const router = useRouter();
  const { profile } = useApp();
  const params = useLocalSearchParams<{
    lang: string;
    hero: "boy" | "girl";
    parentEmail: string;
    password: string;
    parentName: string;
    country: string;
    currency: string;
    currencySymbol: string;
    currencyRate: string;
    name: string;
    age: string;
    dob: string;
  }>();

  const symbol = params.currencySymbol ?? "$";
  const rate = parseFloat(params.currencyRate ?? "1") || 1;
  const heroName = (params.hero ?? profile?.hero) === "girl" ? "Sara" : "Adam";
  const childName = params.name || profile?.childName || "your child";

  const [loading, setLoading] = useState(false);

  async function handleStart(plan: PlanKey) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);
    try {
      const email = params.parentEmail;
      const password = params.password;
      if (email && password) {
        const result = await registerUser({
          email,
          password,
          parentName: params.parentName ?? "",
          country: params.country ?? "US",
          currency: params.currency ?? "USD",
          language: "en",
          childName: params.name ?? profile?.childName ?? "",
          childGender: (params.hero ?? profile?.hero ?? "boy") as "boy" | "girl",
          childDob: params.dob ?? "",
          characterChoice: (params.hero ?? profile?.hero ?? "boy") as "boy" | "girl",
          languagePreference: "en",
        });
        if (result.sessionToken) {
          await saveSessionToken(result.sessionToken);
        }
      }
    } catch {
      // Non-fatal
    }
    setLoading(false);
    router.replace("/(tabs)/chat");
  }

  const planPrice = (key: "monthly" | "biannual" | "yearly") =>
    convertPrice(PLANS_USD[key].usd, rate, symbol);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60, gap: 20 }}>

        <LinearGradient
          colors={["#1A0F3F", "#2D1B69"]}
          style={{ borderRadius: 24, padding: 28, alignItems: "center", gap: 12 }}
        >
          <Text style={{ fontSize: 64 }}>🦸</Text>
          <Text style={{
            color: "#FFF", fontWeight: "900", fontSize: 24, textAlign: "center", lineHeight: 32,
          }}>
            Give {childName} the smartest learning companion 🦸
          </Text>
          <Text style={{
            color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 22,
          }}>
            Join thousands of families helping their children learn, grow, and love school
          </Text>
          <View style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8, marginTop: 4,
          }}>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>
              {heroName} is ready to help {childName}! 🚀
            </Text>
          </View>
        </LinearGradient>

        <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 20, gap: 12 }}>
          <Text style={{ fontWeight: "900", fontSize: 18, color: c.text }}>
            What your child gets:
          </Text>
          {BENEFITS_EN.map((b, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: "#10B981", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>
                <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13 }}>✓</Text>
              </View>
              <Text style={{ flex: 1, color: c.text, fontSize: 14, lineHeight: 22 }}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Tech & AI feature block */}
        <LinearGradient
          colors={["#050B1A", "#0A1628", "#0D2347"]}
          style={{ borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: "rgba(59,130,246,0.35)" }}
        >
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12,
          }}>
            <Text style={{ fontSize: 32 }}>🤖</Text>
            <View>
              <Text style={{ color: "#60A5FA", fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>
                EXCLUSIVE NEW FEATURE
              </Text>
              <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "900" }}>
                Technology & AI for Kids
              </Text>
            </View>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 21, marginBottom: 14 }}>
            18 engaging lessons covering computers, robots, AI, coding, cybersecurity and the future of technology — adapted for every age from 5 to 14.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {["🖥️ Computers", "🤖 Robots", "💻 Coding", "🧠 How AI Thinks", "🔐 Cybersecurity", "🚀 The Future"].map((t) => (
              <View key={t} style={{
                backgroundColor: "rgba(96,165,250,0.15)",
                borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                borderWidth: 1, borderColor: "rgba(96,165,250,0.25)",
              }}>
                <Text style={{ color: "#93C5FD", fontSize: 11, fontWeight: "600" }}>{t}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <Text style={{ fontWeight: "900", fontSize: 18, color: c.text }}>
          Choose your plan:
        </Text>

        {/* FREE TRIAL */}
        <View style={{
          backgroundColor: "#ECFDF5", borderRadius: 20, padding: 20,
          borderWidth: 2, borderColor: "#10B981", gap: 10,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "900", fontSize: 18, color: "#065F46" }}>Free Trial</Text>
              <Text style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}>
                3 days · No credit card needed
              </Text>
            </View>
            <View style={{
              backgroundColor: "#10B981", borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 6,
            }}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>FREE</Text>
            </View>
          </View>
          <Text style={{ color: "#065F46", fontSize: 12, lineHeight: 18 }}>
            All features with daily limits — discover the full experience
          </Text>
          <Pressable
            onPress={() => handleStart("free")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: "#10B981",
              borderRadius: 14, paddingVertical: 14, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 16 }}>
                Start Free Trial 🚀
              </Text>
            )}
          </Pressable>
        </View>

        {/* MONTHLY */}
        <View style={{
          backgroundColor: c.card, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: c.border, gap: 10,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: c.text }}>Monthly</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                Full unlimited access · Cancel anytime
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: c.text }}>{planPrice("monthly")}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 11 }}>/month</Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleStart("monthly")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: c.primary,
              borderRadius: 14, paddingVertical: 13, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                Choose Monthly
              </Text>
            )}
          </Pressable>
        </View>

        {/* 6 MONTHS */}
        <LinearGradient
          colors={["#7C3AED", "#A78BFA"]}
          style={{ borderRadius: 20, padding: 20, gap: 10 }}
        >
          <View style={{ position: "absolute", top: -12, alignSelf: "center", zIndex: 1 }}>
            <View style={{
              backgroundColor: "#5B21B6", borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 4,
            }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>🔥 SAVE 10%</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF" }}>6 Months</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                Best for committed learners
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: "#FFF" }}>{planPrice("biannual")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                {convertPrice(PLANS_USD.biannual.usd / 6, rate, symbol)}/mo
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleStart("biannual")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 14, paddingVertical: 13, alignItems: "center",
              borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
              opacity: pressed || loading ? 0.85 : 1,
            })}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                Choose 6 Months
              </Text>
            )}
          </Pressable>
        </LinearGradient>

        {/* YEARLY */}
        <LinearGradient
          colors={["#FF6B35", "#FFA76A"]}
          style={{ borderRadius: 20, padding: 20, gap: 10 }}
        >
          <View style={{ position: "absolute", top: -12, alignSelf: "center", zIndex: 1 }}>
            <View style={{
              backgroundColor: "#C2410C", borderRadius: 20,
              paddingHorizontal: 14, paddingVertical: 4,
            }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
                ⭐ MOST POPULAR · SAVE 21%
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", fontSize: 17, color: "#FFF" }}>Yearly</Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
                Best value — pay once a year
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "900", fontSize: 22, color: "#FFF" }}>{planPrice("yearly")}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>
                {convertPrice(PLANS_USD.yearly.usd / 12, rate, symbol)}/mo
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleStart("yearly")}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: "#FFF",
              borderRadius: 14, paddingVertical: 13, alignItems: "center",
              opacity: pressed || loading ? 0.85 : 1,
              shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
            })}
          >
            {loading ? <ActivityIndicator color="#FF6B35" /> : (
              <Text style={{ color: "#FF6B35", fontWeight: "900", fontSize: 15 }}>
                Choose Yearly ⭐
              </Text>
            )}
          </Pressable>
        </LinearGradient>

        <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: "center", lineHeight: 20 }}>
          No hidden fees. Cancel anytime. Your child's data is always safe and private.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
