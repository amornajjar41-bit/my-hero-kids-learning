import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";

export default function PrivacyPolicy() {
  const c = useColors();
  const router = useRouter();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <SoftCard style={{ gap: 10 }}>
      <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>{title}</Text>
      {children}
    </SoftCard>
  );

  const P = ({ text }: { text: string }) => (
    <Text style={{ color: c.mutedForeground, fontSize: 14, lineHeight: 22 }}>{text}</Text>
  );

  const Bullet = ({ text }: { text: string }) => (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Text style={{ color: c.primary, fontWeight: "800", marginTop: 3 }}>•</Text>
      <Text style={{ flex: 1, color: c.mutedForeground, fontSize: 14, lineHeight: 22 }}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: c.card, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>
          🔒 Privacy Policy
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 60 }}>

        <View style={{ gap: 4 }}>
          <Text style={{ fontWeight: "900", fontSize: 22, color: c.text }}>
            Privacy Policy — My Hero App
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
            Last updated: April 2026
          </Text>
        </View>

        <Section title="1. What We Collect">
          <P text="We collect only the information necessary to provide a personalized learning experience:" />
          <Bullet text="Child name, age, and gender" />
          <Bullet text="Learning progress and lesson performance" />
          <Bullet text="Homework questions to provide answers" />
          <Bullet text="Parent email and name — to send progress reports" />
          <Bullet text="We never collect sensitive personal data or any information beyond what is needed" />
        </Section>

        <Section title="2. What We Never Do">
          <Bullet text="We never sell your child's or your data to anyone" />
          <Bullet text="We never show ads of any kind" />
          <Bullet text="We never share data with third parties for commercial purposes" />
          <Bullet text="Data is used only to improve your child's learning experience" />
        </Section>

        <Section title="3. Children's Safety">
          <P text="Your child's safety is our highest priority:" />
          <Bullet text="All conversations are monitored by an automatic safety detection system" />
          <Bullet text="Parents are alerted immediately to any concerning content" />
          <Bullet text="The system is designed exclusively for children ages 4–14" />
          <Bullet text="Children cannot share personal information through the chat" />
        </Section>

        <Section title="4. Data Storage">
          <P text="All data is encrypted and stored securely on protected servers. We use industry-standard encryption protocols to protect your information." />
        </Section>

        <Section title="5. Parent Rights">
          <Bullet text="You can request complete deletion of all your data at any time" />
          <Bullet text="You can request to view all stored data related to your child" />
          <Bullet text="You can cancel your subscription at any time with no penalties" />
          <P text="To request data deletion, email us at:" />
          <Text style={{ color: c.primary, fontWeight: "700", fontSize: 14 }}>
            support@myheroapp.org
          </Text>
        </Section>

        <Section title="6. Contact Us">
          <P text="If you have any questions or concerns about your child's data privacy, please reach out to us:" />
          <Text style={{ color: c.primary, fontWeight: "700", fontSize: 14 }}>
            support@myheroapp.org
          </Text>
          <P text="We respond within 24 hours on business days." />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
