import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: `My Hero is an educational application designed for children aged 4–14, operated by My Hero Education Ltd. By using My Hero, you (the parent or guardian) agree to these Terms and Conditions on behalf of yourself and your child. Please read them carefully before using the app.`,
  },
  {
    title: "2. Account and Subscription",
    body: `Parents or legal guardians must create and manage the My Hero account. Children must not create accounts independently.\n\n• Monthly plan: $24.99/month\n• 6-Month plan: $135.99 (save ~10%)\n• Annual plan: $236.99/year (save ~21%)\n• Free trial: 3 days — no credit card required\n• Subscriptions can be cancelled at any time through your device's App Store or Play Store settings\n• After cancellation, you will continue to have access until the end of your billing period\n• No refunds are issued for partial subscription periods, except where required by law`,
  },
  {
    title: "3. Children's Privacy",
    body: `We take your child's privacy extremely seriously:\n\n• We collect only the minimum information necessary to provide the educational service\n• We do NOT sell any personal data to third parties — ever\n• We do NOT show advertisements to children\n• All data is stored securely with industry-standard encryption\n• Parents can request complete deletion of all their child's data at any time by contacting support@myheroapp.org\n• My Hero complies with COPPA and GDPR`,
  },
  {
    title: "4. Appropriate Use",
    body: `My Hero is designed for educational purposes only:\n\n• Parents are responsible for supervising their child's use of the application\n• The app includes a screen time limit feature — we strongly encourage parents to use it\n• We monitor AI conversations for safety purposes using automated systems\n• Parents will be alerted immediately if any concerning content is detected\n• You agree not to attempt to circumvent any safety systems in the app`,
  },
  {
    title: "5. AI-Powered Content",
    body: `My Hero uses advanced AI to power hero character responses:\n\n• While we work hard to ensure accuracy and age-appropriateness, AI responses should be verified for critical academic work\n• AI can occasionally make mistakes — always encourage your child to verify important facts with teachers\n• The AI is designed to guide children to discover answers, not simply provide them\n• All AI conversations are subject to safety monitoring`,
  },
  {
    title: "6. Intellectual Property",
    body: `All content in My Hero — including characters, stories, games, lesson content, and design — is owned by My Hero Education Ltd and protected by copyright. You may not reproduce, distribute, or create derivative works from any app content without written permission.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `My Hero provides an educational service on an "as is" basis. While we strive for 100% uptime and accuracy, we cannot guarantee uninterrupted service. My Hero Education Ltd is not liable for any indirect, incidental, or consequential damages arising from use of the app.`,
  },
  {
    title: "8. Changes to Terms",
    body: `We may update these Terms from time to time. We will notify you of significant changes via email and within the app. Continued use after notification constitutes acceptance of the updated Terms.`,
  },
  {
    title: "9. Contact Us",
    body: `For any questions, concerns, data deletion requests, or support:\n\n📧 support@myheroapp.org\n🌐 www.myheroapp.org\n\nWe respond to all inquiries within 48 hours.`,
  },
];

export default function TermsPage() {
  const c = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "900", fontSize: 20, color: c.text, flex: 1 }}>
          📋 Terms & Conditions
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={{ backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#BFDBFE" }}>
          <Text style={{ color: "#1D4ED8", fontWeight: "700", fontSize: 13, lineHeight: 20 }}>
            🔒 My Hero is committed to the highest standards of children's privacy and safety. Last updated: April 2026
          </Text>
        </View>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={{ gap: 8 }}>
            <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>{sec.title}</Text>
            <Text style={{ color: c.mutedForeground, fontSize: 14, lineHeight: 22 }}>{sec.body}</Text>
            {i < SECTIONS.length - 1 && (
              <View style={{ height: 1, backgroundColor: c.muted, marginTop: 4 }} />
            )}
          </View>
        ))}

        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: "center", gap: 6 }}>
          <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: "center" }}>
            © 2026 My Hero Education Ltd. All rights reserved.
          </Text>
          <Text style={{ color: "#3B82F6", fontSize: 12, textAlign: "center" }}>support@myheroapp.org</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
