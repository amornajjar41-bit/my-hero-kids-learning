/**
 * Contact Us — parent dashboard support form.
 * Change 3 — contact form with email confirmation.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";

const SUPPORT_EMAIL = "support@myheroapp.org";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "https://myheroapp.org";
}

const SUBJECTS_EN = ["Suggestion", "Complaint", "Technical Issue", "Billing", "Other"] as const;
const SUBJECTS_AR = ["اقتراح", "شكوى", "مشكلة تقنية", "الفواتير", "أخرى"] as const;

export default function ContactUs() {
  const c = useColors();
  const router = useRouter();
  const { profile } = useApp();
  const lang = profile?.language ?? "en";
  const isAr = lang === "ar";

  const subjects = isAr ? SUBJECTS_AR : SUBJECTS_EN;

  const [name, setName] = useState(profile?.parentName ?? "");
  const [email, setEmail] = useState(profile?.parentEmail ?? "");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const canSend = email.includes("@") && message.trim().length >= 10 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        Alert.alert(
          isAr ? "حدث خطأ" : "Error",
          isAr ? "حاول مجدداً لاحقاً" : "Please try again later"
        );
      }
    } catch {
      Alert.alert(
        isAr ? "لا يوجد اتصال" : "Connection error",
        isAr ? "تحقق من اتصالك بالإنترنت" : "Check your internet connection"
      );
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    backgroundColor: c.input,
    padding: 14,
    borderRadius: 14,
    color: c.text,
    fontSize: 15,
    textAlign: (isAr ? "right" : "left") as "right" | "left",
  };

  const labelStyle = {
    fontWeight: "700" as const,
    color: c.text,
    marginBottom: 6,
    fontSize: 13,
    textAlign: (isAr ? "right" : "left") as "right" | "left",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={{ padding: 14, flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: c.card, alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name={isAr ? "chevron-forward" : "chevron-back"} size={20} color={c.text} />
          </Pressable>
          <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1, textAlign: isAr ? "right" : "left" }}>
            💙 {isAr ? "تواصل معنا" : "Contact Us"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

          {done ? (
            /* Success State */
            <View style={{ flex: 1, alignItems: "center", paddingTop: 40, gap: 16 }}>
              <Text style={{ fontSize: 72, textAlign: "center" }}>💙</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: c.text, textAlign: "center" }}>
                {isAr ? "شكراً لك!" : "Thank you!"}
              </Text>
              <Text style={{ fontSize: 15, color: c.mutedForeground, textAlign: "center", lineHeight: 24, maxWidth: 300 }}>
                {isAr
                  ? "سنرد عليك خلال 24 ساعة 💙"
                  : "We'll get back to you within 24 hours 💙"}
              </Text>
              <SoftCard style={{ alignItems: "center", gap: 6, width: "100%" }}>
                <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                  {isAr ? "يمكنك أيضاً التواصل عبر" : "Or reach us directly at"}
                </Text>
                <Text style={{ color: c.primary, fontWeight: "700", fontSize: 14 }}>
                  {SUPPORT_EMAIL}
                </Text>
                <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                  {isAr ? "نرد خلال يوم عمل واحد" : "Response within 1 business day"}
                </Text>
              </SoftCard>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({
                  backgroundColor: c.primary, paddingVertical: 14, paddingHorizontal: 32,
                  borderRadius: 14, opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15 }}>
                  {isAr ? "رجوع" : "Go Back"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <SoftCard>
                <Text style={{ color: c.mutedForeground, fontSize: 13, lineHeight: 20, textAlign: isAr ? "right" : "left" }}>
                  {isAr
                    ? `نحن هنا للمساعدة! أرسل رسالتك وسنرد خلال 24 ساعة. يمكنك أيضاً مراسلتنا على ${SUPPORT_EMAIL}`
                    : `We're here to help! Send us a message and we'll reply within 24 hours. You can also email us at ${SUPPORT_EMAIL}`}
                </Text>
              </SoftCard>

              {/* Name */}
              <SoftCard style={{ gap: 6 }}>
                <Text style={labelStyle}>{isAr ? "الاسم" : "Name"}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={isAr ? "اسمك" : "Your name"}
                  placeholderTextColor={c.mutedForeground}
                  style={inputStyle}
                />
              </SoftCard>

              {/* Email */}
              <SoftCard style={{ gap: 6 }}>
                <Text style={labelStyle}>{isAr ? "البريد الإلكتروني" : "Email"}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={c.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={inputStyle}
                />
              </SoftCard>

              {/* Subject */}
              <SoftCard style={{ gap: 6 }}>
                <Text style={labelStyle}>{isAr ? "الموضوع" : "Subject"}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {subjects.map((s) => {
                    const sel = s === subject;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setSubject(s)}
                        style={({ pressed }) => ({
                          paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                          backgroundColor: sel ? c.primary : c.muted,
                          borderWidth: sel ? 0 : 1, borderColor: c.border,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text style={{ color: sel ? "#FFF" : c.text, fontWeight: "700", fontSize: 13 }}>
                          {s}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </SoftCard>

              {/* Message */}
              <SoftCard style={{ gap: 6 }}>
                <Text style={labelStyle}>{isAr ? "رسالتك" : "Message"}</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."}
                  placeholderTextColor={c.mutedForeground}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={[inputStyle, { minHeight: 120 }]}
                />
                {message.length > 0 && message.trim().length < 10 && (
                  <Text style={{ color: "#EF4444", fontSize: 12 }}>
                    {isAr ? "* الرسالة قصيرة جداً (10 حروف على الأقل)" : "* Message too short (at least 10 characters)"}
                  </Text>
                )}
              </SoftCard>

              <PrimaryButton
                title={sending
                  ? (isAr ? "جاري الإرسال…" : "Sending…")
                  : (isAr ? "إرسال الرسالة" : "Send Message")}
                fullWidth
                disabled={!canSend}
                loading={sending}
                onPress={handleSend}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
