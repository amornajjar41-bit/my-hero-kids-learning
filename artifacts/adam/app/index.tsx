import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getSessionToken, validateSession } from "@/lib/auth";

export default function Gate() {
  const c = useColors();
  const { ready, profile, saveProfile, isScreenBlocked } = useApp();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const token = await getSessionToken();
        if (!token) {
          setSessionValid(false);
          setSessionChecked(true);
          return;
        }
        const result = await validateSession(token);
        if (result.valid && result.child && result.user) {
          // Restore profile from server if local is missing
          if (!profile) {
            await saveProfile({
              language: (result.child.languagePreference ?? "en") as "en" | "ar",
              hero: (result.child.characterChoice ?? "boy") as "boy" | "girl",
              childName: result.child.childName,
              ageGroup: (result.child.ageGroup ?? "7-9") as any,
              parentEmail: result.user.parentName ?? "",
              parentName: result.user.parentName ?? "",
              childBirthday: undefined,
              trialStartedAt: result.user.trialStart ?? new Date().toISOString(),
              isPaid: result.user.subscriptionPlan !== "trial",
              screenLimitHours: 4,
              soundOn: true,
              country: result.user.country,
              currency: result.user.currency,
            });
          }
          setSessionValid(true);
        } else {
          setSessionValid(false);
        }
      } catch {
        setSessionValid(false);
      } finally {
        setSessionChecked(true);
      }
    })();
  }, [ready]);

  if (!ready || !sessionChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  // 4B – If screen time limit already reached when app opens, go to blocked
  if ((sessionValid || profile) && isScreenBlocked) {
    return <Redirect href="/blocked" />;
  }

  if (sessionValid || profile) return <Redirect href="/(tabs)" />;
  return <Redirect href="/onboarding/welcome" />;
}
