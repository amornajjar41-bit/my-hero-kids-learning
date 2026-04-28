import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { pad } from "@/lib/utils";
import type { Profile } from "@/lib/storage";

const monthsEn = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthsAr = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export default function Birthday() {
  const c = useColors();
  const router = useRouter();
  const { saveProfile } = useApp();
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
    name: string;
    age: "4-6" | "7-9" | "10-12";
    dob: string;
  }>();
  const isAr = params.lang === "ar";
  const [month, setMonth] = useState(0); // 0..11
  const [day, setDay] = useState(1);

  const months = isAr ? monthsAr : monthsEn;

  const finalize = async () => {
    const year = new Date().getFullYear() - 8;
    const childBirthday = `${year}-${pad(month + 1)}-${pad(day)}`;
    const profile: Profile = {
      language: params.lang,
      hero: params.hero,
      childName: params.name,
      ageGroup: params.age,
      parentEmail: params.parentEmail,
      parentName: params.parentName,
      childBirthday,
      trialStartedAt: new Date().toISOString(),
      isPaid: false,
      screenLimitHours: 2,
      soundOn: true,
    };
    await saveProfile(profile);
    router.replace({
      pathname: "/onboarding/done",
      params: {
        lang: params.lang,
        hero: params.hero,
        parentEmail: params.parentEmail,
        password: params.password,
        parentName: params.parentName,
        country: params.country,
        currency: params.currency,
        currencySymbol: params.currencySymbol,
        currencyRate: params.currencyRate,
        name: params.name,
        age: params.age,
        dob: params.dob || childBirthday,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <AdamCharacter hero={params.hero} size={100} />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: c.text,
            textAlign: "center",
          }}
        >
          {isAr
            ? "شي أخير يا بطل! 🎂 امتى عيد ميلادك؟"
            : "One last thing hero! 🎂 When is YOUR birthday?"}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: c.mutedForeground,
            textAlign: "center",
          }}
        >
          {isAr
            ? "بدي أعملك أكبر احتفال بالتاريخ! 🎉🎊"
            : "I want to throw you the BIGGEST celebration ever! 🎉🎊"}
        </Text>

        <SoftCard>
          <Text style={{ fontWeight: "700", color: c.text, marginBottom: 8 }}>
            {isAr ? "الشهر" : "Month"}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {months.map((m, idx) => {
              const sel = month === idx;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMonth(idx)}
                  style={({ pressed }) => ({
                    backgroundColor: sel ? c.primary : c.muted,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: sel ? "#FFF" : c.text,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SoftCard>

        <SoftCard>
          <Text style={{ fontWeight: "700", color: c.text, marginBottom: 8 }}>
            {isAr ? "اليوم" : "Day"}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {Array.from({ length: 31 }).map((_, i) => {
              const d = i + 1;
              const sel = day === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDay(d)}
                  style={({ pressed }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: sel ? c.primary : c.muted,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: sel ? "#FFF" : c.text,
                      fontWeight: "700",
                    }}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SoftCard>

        <PrimaryButton
          title={isAr ? "تم" : "Done"}
          fullWidth
          onPress={finalize}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
