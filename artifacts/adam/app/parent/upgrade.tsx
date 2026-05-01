import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/lib/revenuecat";
import type { PurchasesPackage } from "react-native-purchases";

// ─── Plan definitions ───────────────────────────────────────────────────────
const PLAN_KEYS = {
  monthly:  "$rc_monthly",
  "6months": "$rc_six_month",
  yearly:   "$rc_annual",
} as const;

type PlanKey = keyof typeof PLAN_KEYS;

const FALLBACK_PRICES: Record<PlanKey, string> = {
  monthly:  "$24.99/mo",
  "6months": "$135.99",
  yearly:   "$236.99/yr",
};

const BENEFITS = [
  { emoji: "🤖", label: "18 Technology & AI lessons — robots, coding, cybersecurity & more" },
  { emoji: "📚", label: "Unlimited homework help & AI tutor" },
  { emoji: "🎤", label: "Voice chat with your hero character" },
  { emoji: "📷", label: "Photo homework upload & explain" },
  { emoji: "🌍", label: "Full English curriculum — vocab, grammar & more" },
  { emoji: "🎮", label: "All 8 educational games unlocked" },
  { emoji: "🌙", label: "20+ bedtime stories with audio" },
  { emoji: "⏱️", label: "Parent controls & screen time limits" },
  { emoji: "🏆", label: "Rewards, badges & achievement shop" },
];

const SOCIAL_PROOF = [
  { stars: "⭐⭐⭐⭐⭐", text: "My son asks to use it every night!", name: "Sarah M." },
  { stars: "⭐⭐⭐⭐⭐", text: "Best investment for my daughter's learning", name: "Ahmed K." },
];

// ─── Helper: get price string from RC package ───────────────────────────────
function rcPrice(pkg: PurchasesPackage | undefined, fallback: string): string {
  if (!pkg) return fallback;
  return pkg.product.priceString ?? fallback;
}

// ─── Helper: get RC package for plan ───────────────────────────────────────
function rcPkg(
  offerings: import("react-native-purchases").PurchasesOfferings | undefined,
  plan: PlanKey,
): PurchasesPackage | undefined {
  if (!offerings?.current) return undefined;
  const identifier = PLAN_KEYS[plan];
  return offerings.current.availablePackages.find(
    (p) => p.packageType === identifier || p.identifier === identifier,
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function Upgrade() {
  const router = useRouter();
  const { profile, patchProfile } = useApp();
  const { offerings, purchase, restore, isLoading, isPurchasing, isRestoring, isSubscribed } =
    useSubscription();

  const [chosen, setChosen] = useState<PlanKey>("yearly");
  const [restoring, setRestoring] = useState(false);

  // If already subscribed, go back
  React.useEffect(() => {
    if (isSubscribed) {
      patchProfile({ isPaid: true });
      router.back();
    }
  }, [isSubscribed]);

  const monthlyPkg  = rcPkg(offerings, "monthly");
  const sixMonthPkg = rcPkg(offerings, "6months");
  const yearlyPkg   = rcPkg(offerings, "yearly");

  const monthlyPrice  = rcPrice(monthlyPkg,  "$24.99/mo");
  const sixMonthPrice = rcPrice(sixMonthPkg, "$135.99");
  const yearlyPrice   = rcPrice(yearlyPkg,   "$236.99/yr");

  const subscribe = async () => {
    const targetPkg = rcPkg(offerings, chosen);

    if (!targetPkg) {
      // RevenueCat not yet connected — dev/admin shortcut
      await patchProfile({ isPaid: true, paidPlan: chosen });
      router.back();
      return;
    }

    try {
      await purchase(targetPkg);
      await patchProfile({ isPaid: true, paidPlan: chosen });
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("userCancelled") && !msg.includes("1")) {
        Alert.alert("Purchase failed", msg);
      }
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restore();
      Alert.alert("Restored!", "Your subscription has been restored.");
    } catch {
      Alert.alert("Restore failed", "No previous purchases found for this account.");
    } finally {
      setRestoring(false);
    }
  };

  const busy = isPurchasing || isRestoring || restoring || isLoading;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0D0826", "#1A1045", "#2D1B69"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={{ backgroundColor: "#F59E0B", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 }}>
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 11 }}>
                🏅 #1 PARENT-APPROVED APP
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 10 }}>
            <Text style={{ fontSize: 72 }}>🦸</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 26, textAlign: "center", lineHeight: 32 }}>
              {"Unlock Your Hero's\nFull Powers"}
            </Text>
            <Text style={{ color: "rgba(167,139,250,0.9)", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
              Safe, fun & unlimited learning — every single day
            </Text>
          </View>

          {/* Tech & AI feature banner */}
          <LinearGradient
            colors={["#050F20", "#0A1E3D", "#0D2A5A"]}
            style={{
              borderRadius: 24, padding: 20,
              borderWidth: 1.5, borderColor: "rgba(59,130,246,0.4)",
            }}
          >
            <View style={{
              position: "absolute", top: -1, right: -1,
              backgroundColor: "#3B82F6", borderTopRightRadius: 23, borderBottomLeftRadius: 16,
              paddingHorizontal: 12, paddingVertical: 5,
            }}>
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "900" }}>✨ NEW</Text>
            </View>
            <Text style={{ color: "#60A5FA", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 }}>
              🤖 TECHNOLOGY & AI LESSONS
            </Text>
            <Text style={{ color: "#FFF", fontSize: 19, fontWeight: "900", marginBottom: 6 }}>
              18 Exclusive Tech Lessons
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 22, marginBottom: 14 }}>
              Your child will explore computers, robots, artificial intelligence, coding, cybersecurity, and the future — in a way that's fun and engaging for ages 5 to 14.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                { e: "🖥️", t: "Computers" }, { e: "🤖", t: "Robots" },
                { e: "🧠", t: "How AI Thinks" }, { e: "💻", t: "Coding" },
                { e: "🔐", t: "Cybersecurity" }, { e: "🚗", t: "Self-Driving" },
                { e: "🏥", t: "AI in Medicine" }, { e: "⚖️", t: "AI Ethics" },
              ].map((item) => (
                <View key={item.t} style={{
                  backgroundColor: "rgba(59,130,246,0.15)",
                  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                  flexDirection: "row", alignItems: "center", gap: 5,
                  borderWidth: 1, borderColor: "rgba(59,130,246,0.3)",
                }}>
                  <Text style={{ fontSize: 13 }}>{item.e}</Text>
                  <Text style={{ color: "#93C5FD", fontSize: 11, fontWeight: "600" }}>{item.t}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Benefits */}
          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "rgba(167,139,250,0.2)", gap: 10 }}>
            <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 14, marginBottom: 4 }}>
              ✦ Everything included
            </Text>
            {BENEFITS.map((b) => (
              <View key={b.label} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 20, width: 26, textAlign: "center" }}>{b.emoji}</Text>
                <Text style={{ flex: 1, color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 20 }}>
                  {b.label}
                </Text>
                <Text style={{ color: "#10B981", fontSize: 16 }}>✓</Text>
              </View>
            ))}
          </View>

          {/* Social proof */}
          <View style={{ gap: 10 }}>
            {SOCIAL_PROOF.map((r, i) => (
              <View key={i} style={{
                backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 14,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
              }}>
                <Text style={{ fontSize: 12 }}>{r.stars}</Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>"{r.text}"</Text>
                <Text style={{ color: "#A78BFA", fontSize: 11, marginTop: 4 }}>— {r.name}</Text>
              </View>
            ))}
          </View>

          <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 14, textAlign: "center" }}>
            Choose your plan
          </Text>

          {/* Monthly */}
          <Pressable
            onPress={() => setChosen("monthly")}
            style={{
              borderRadius: 20, borderWidth: 2.5,
              borderColor: chosen === "monthly" ? "#A78BFA" : "rgba(255,255,255,0.12)",
              backgroundColor: chosen === "monthly" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              padding: 18, flexDirection: "row", alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 17 }}>Monthly</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Cancel anytime</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22 }}>{monthlyPrice}</Text>
            </View>
            <View style={{
              width: 24, height: 24, borderRadius: 12, borderWidth: 2,
              borderColor: chosen === "monthly" ? "#A78BFA" : "rgba(255,255,255,0.3)",
              backgroundColor: chosen === "monthly" ? "#A78BFA" : "transparent",
              alignItems: "center", justifyContent: "center", marginLeft: 12,
            }}>
              {chosen === "monthly" && <Text style={{ color: "#FFF", fontSize: 12 }}>✓</Text>}
            </View>
          </Pressable>

          {/* 6 months */}
          <Pressable
            onPress={() => setChosen("6months")}
            style={{
              borderRadius: 20, borderWidth: 2.5,
              borderColor: chosen === "6months" ? "#A78BFA" : "rgba(255,255,255,0.12)",
              backgroundColor: chosen === "6months" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              padding: 18, flexDirection: "row", alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 17 }}>6 Months</Text>
                <View style={{ backgroundColor: "rgba(245,158,11,0.3)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: "#FDE68A", fontSize: 10, fontWeight: "800" }}>SAVE 10%</Text>
                </View>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Billed every 6 months</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22 }}>{sixMonthPrice}</Text>
            </View>
            <View style={{
              width: 24, height: 24, borderRadius: 12, borderWidth: 2,
              borderColor: chosen === "6months" ? "#A78BFA" : "rgba(255,255,255,0.3)",
              backgroundColor: chosen === "6months" ? "#A78BFA" : "transparent",
              alignItems: "center", justifyContent: "center", marginLeft: 12,
            }}>
              {chosen === "6months" && <Text style={{ color: "#FFF", fontSize: 12 }}>✓</Text>}
            </View>
          </Pressable>

          {/* Yearly — highlighted */}
          <Pressable
            onPress={() => setChosen("yearly")}
            style={{
              borderRadius: 20, borderWidth: 2.5, borderColor: "#FDE68A",
              backgroundColor: chosen === "yearly" ? "rgba(253,230,138,0.1)" : "rgba(253,230,138,0.05)",
              padding: 18, flexDirection: "row", alignItems: "center",
              shadowColor: "#FDE68A", shadowOpacity: chosen === "yearly" ? 0.25 : 0, shadowRadius: 12, elevation: chosen === "yearly" ? 6 : 0,
            }}
          >
            <View style={{ position: "absolute", top: -12, right: 16, backgroundColor: "#F59E0B", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 10 }}>⭐ BEST VALUE · SAVE 21%</Text>
            </View>
            <View style={{ flex: 1, marginTop: 4 }}>
              <Text style={{ color: "#FDE68A", fontWeight: "800", fontSize: 17 }}>Yearly</Text>
              <Text style={{ color: "rgba(253,230,138,0.6)", fontSize: 12, marginTop: 2 }}>Best value · billed annually</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 22 }}>{yearlyPrice}</Text>
            </View>
            <View style={{
              width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#FDE68A",
              backgroundColor: chosen === "yearly" ? "#F59E0B" : "transparent",
              alignItems: "center", justifyContent: "center", marginLeft: 12,
            }}>
              {chosen === "yearly" && <Text style={{ color: "#000", fontSize: 12, fontWeight: "900" }}>✓</Text>}
            </View>
          </Pressable>

          {/* CTA */}
          <Pressable
            disabled={busy}
            onPress={subscribe}
            style={({ pressed }) => ({
              borderRadius: 20, paddingVertical: 18, alignItems: "center",
              backgroundColor: "#F59E0B",
              opacity: pressed || busy ? 0.88 : 1,
              shadowColor: "#F59E0B", shadowOpacity: 0.4, shadowRadius: 16, elevation: 6,
            })}
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: "#000", fontWeight: "900", fontSize: 17 }}>
                🚀 Start Learning Journey
              </Text>
            )}
          </Pressable>

          <Text style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 11, lineHeight: 18 }}>
            No hidden fees · Cancel anytime · Your child's data is always safe
          </Text>

          {/* Restore purchases */}
          <Pressable
            onPress={handleRestore}
            disabled={busy}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: "center", paddingVertical: 4 })}
          >
            <Text style={{ color: "rgba(167,139,250,0.7)", fontSize: 13, textDecorationLine: "underline" }}>
              Restore previous purchase
            </Text>
          </Pressable>

          {/* Legal links */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, paddingBottom: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
              Privacy Policy · Terms of Service
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
