import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import type { Profile } from "@/lib/storage";

function pad(n: number) { return String(n).padStart(2, "0"); }

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

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
    age: "4-6" | "7-9" | "10-12" | "13-14";
    dob: string;
    childMonth: string;
    childDay: string;
  }>();
  const isAr = params.lang === "ar";
  const months = isAr ? MONTHS_AR : MONTHS_EN;

  // Pre-populate from DOB entered on previous screen
  const preMonth = params.childMonth !== undefined ? parseInt(params.childMonth, 10) : 0;
  const preDay   = params.childDay   !== undefined ? parseInt(params.childDay,   10) : 1;

  const [month, setMonth] = useState(preMonth); // 0-based
  const [day, setDay]     = useState(preDay);

  const finalize = async () => {
    // Use the actual DOB year from the previous screen, not a hardcoded offset
    const dobYear = params.dob ? parseInt(params.dob.split("-")[0], 10) : new Date().getFullYear() - 8;
    const childBirthday = `${dobYear}-${pad(month + 1)}-${pad(day)}`;

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

        <Text style={{ fontSize: 24, fontWeight: "800", color: c.text, textAlign: "center" }}>
          {isAr
            ? "شي أخير يا بطل! 🎂 امتى عيد ميلادك؟"
            : "One last thing hero! 🎂 When is YOUR birthday?"}
        </Text>
        <Text style={{ fontSize: 14, color: c.mutedForeground, textAlign: "center" }}>
          {isAr
            ? "بدي أعملك أكبر احتفال بالتاريخ! 🎉🎊"
            : "I want to throw you the BIGGEST celebration ever! 🎉🎊"}
        </Text>

        {/* Month grid */}
        <SoftCard>
          <Text style={{ fontWeight: "700", color: c.text, marginBottom: 8, textAlign: isAr ? "right" : "left" }}>
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
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    opacity: pressed ? 0.8 : 1,
                    borderWidth: sel ? 0 : 1,
                    borderColor: c.muted,
                  })}
                >
                  <Text style={{ color: sel ? "#FFF" : c.text, fontWeight: "700", fontSize: 13 }}>
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SoftCard>

        {/* Day grid */}
        <SoftCard>
          <Text style={{ fontWeight: "700", color: c.text, marginBottom: 8, textAlign: isAr ? "right" : "left" }}>
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
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: sel ? c.primary : c.muted,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: sel ? "#FFF" : c.text, fontWeight: "700", fontSize: 14 }}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SoftCard>

        {/* Confirmation hint */}
        <View style={{
          backgroundColor: c.primary + "15",
          borderRadius: 14,
          padding: 14,
          flexDirection: isAr ? "row-reverse" : "row",
          alignItems: "center",
          gap: 10,
        }}>
          <Text style={{ fontSize: 28 }}>🎂</Text>
          <Text style={{ flex: 1, color: c.text, fontSize: 13, fontWeight: "600", textAlign: isAr ? "right" : "left" }}>
            {isAr
              ? `عيد ميلادك: ${months[month]} ${day} 🎉`
              : `Birthday: ${months[month]} ${day} 🎉`}
          </Text>
        </View>

        <PrimaryButton
          title={isAr ? "تم! يلا نبدأ 🚀" : "Done! Let's go 🚀"}
          fullWidth
          onPress={finalize}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
