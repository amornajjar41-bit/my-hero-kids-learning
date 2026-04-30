import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

const BENEFITS = [
  { emoji: "📚", label: "Unlimited homework help & AI tutor" },
  { emoji: "🎤", label: "Voice chat with your hero character" },
  { emoji: "📷", label: "Photo homework upload & explain" },
  { emoji: "🌍", label: "Full English curriculum — vocab, grammar & more" },
  { emoji: "🎮", label: "All 7 educational games unlocked" },
  { emoji: "🌙", label: "20+ bedtime stories with audio" },
  { emoji: "⏱️", label: "Parent controls & screen time limits" },
  { emoji: "🏆", label: "Rewards, badges & achievement shop" },
];

const SOCIAL_PROOF = [
  { stars: "⭐⭐⭐⭐⭐", text: "My son asks to use it every night!", name: "Sarah M." },
  { stars: "⭐⭐⭐⭐⭐", text: "Best investment for my daughter's learning", name: "Ahmed K." },
];

function formatPrice(usd: number, currency: string): string {
  const RATES: Record<string, { symbol: string; rate: number }> = {
    USD: { symbol: "$", rate: 1 }, EUR: { symbol: "€", rate: 0.93 },
    GBP: { symbol: "£", rate: 0.79 }, SAR: { symbol: "SAR ", rate: 3.75 },
    AED: { symbol: "AED ", rate: 3.67 }, KWD: { symbol: "KWD ", rate: 0.31 },
    QAR: { symbol: "QAR ", rate: 3.64 }, EGP: { symbol: "EGP ", rate: 30.9 },
  };
  const c = RATES[currency] ?? RATES.USD!;
  const amount = usd * c.rate;
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10;
  return `${c.symbol}${rounded}`;
}

export default function Upgrade() {
  const c = useColors();
  const router = useRouter();
  const { profile, patchProfile } = useApp();
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<"monthly" | "6months" | "yearly">("yearly");

  const currency = profile?.currency ?? "USD";

  const subscribe = async () => {
    setLoading(true);
    await patchProfile({ isPaid: true, paidPlan: chosen });
    setLoading(false);
    router.back();
  };

  const monthly = formatPrice(24.99, currency);
  const sixMonths = formatPrice(135.99, currency);
  const sixPerMonth = formatPrice(135.99 / 6, currency);
  const yearly = formatPrice(236.99, currency);
  const yearlyPerMonth = formatPrice(236.99 / 12, currency);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0D0826", "#1A1045", "#2D1B69"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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

          <View style={{ alignItems: "center", gap: 8, paddingVertical: 10 }}>
            <Text style={{ fontSize: 72 }}>🦸</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 26, textAlign: "center", lineHeight: 32 }}>
              {"Unlock Your Hero's\nFull Powers"}
            </Text>
            <Text style={{ color: "rgba(167,139,250,0.9)", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
              Safe, fun & unlimited learning — every single day
            </Text>
          </View>

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
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22 }}>{monthly}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>/month</Text>
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
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                {sixPerMonth}/mo
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22 }}>{sixMonths}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>one time</Text>
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

          {/* Yearly */}
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
              <Text style={{ color: "rgba(253,230,138,0.6)", fontSize: 12, marginTop: 2 }}>
                {yearlyPerMonth}/mo
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 22 }}>{yearly}</Text>
              <Text style={{ color: "rgba(253,230,138,0.6)", fontSize: 11 }}>one time</Text>
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
            disabled={loading}
            onPress={subscribe}
            style={({ pressed }) => ({
              borderRadius: 20, paddingVertical: 18, alignItems: "center",
              backgroundColor: "#F59E0B",
              opacity: pressed || loading ? 0.88 : 1,
              shadowColor: "#F59E0B", shadowOpacity: 0.4, shadowRadius: 16, elevation: 6,
            })}
          >
            {loading ? (
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
