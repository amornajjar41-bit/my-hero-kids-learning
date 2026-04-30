/**
 * 5A – Parent 4-digit PIN screen.
 * Used for both SETUP (first access) and VERIFY (every subsequent access).
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdamCharacter } from "@/components/AdamCharacter";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

type Props = {
  onSuccess: () => void;
  onBack?: () => void;
};

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function ParentPin({ onSuccess, onBack }: Props) {
  const c = useColors();
  const { profile } = useApp();
  const hero = profile?.hero ?? "boy";

  const [mode, setMode] = useState<"loading" | "setup" | "setup2" | "verify" | "verify-temp">("loading");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [shake] = useState(new Animated.Value(0));

  useEffect(() => {
    (async () => {
      const stored = await getJSON<string>(STORAGE_KEYS.parentPin);
      setMode(stored ? "verify" : "setup");
    })();
  }, []);

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (d: string) => {
    if (d === "⌫") { setPin((p) => p.slice(0, -1)); return; }
    if (d === "" || pin.length >= 4) return;

    const next = pin + d;
    setPin(next);
    if (next.length < 4) return;

    if (mode === "setup") {
      setFirstPin(next);
      setPin("");
      setMode("setup2");
      return;
    }

    if (mode === "setup2") {
      if (next === firstPin) {
        await setJSON(STORAGE_KEYS.parentPin, next);
        setPin("");
        onSuccess();
      } else {
        doShake();
        setPin("");
        setMode("setup");
        setFirstPin("");
        Alert.alert("PINs don't match", "Please try again");
      }
      return;
    }

    if (mode === "verify-temp") {
      const email = profile?.parentEmail ?? "";
      try {
        const base = process.env.EXPO_PUBLIC_API_URL ?? (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "https://myheroapp.org");
        const res = await fetch(`${base}/api/auth/verify-temp-pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, pin: next }),
        });
        const { valid } = await res.json() as { valid: boolean };
        if (valid) {
          await setJSON(STORAGE_KEYS.parentPin, null);
          setPin("");
          setMode("setup");
        } else {
          doShake();
          setPin("");
        }
      } catch {
        doShake();
        setPin("");
      }
      return;
    }

    const stored = await getJSON<string>(STORAGE_KEYS.parentPin);
    if (next === stored) {
      setPin("");
      onSuccess();
    } else {
      doShake();
      setPin("");
    }
  };

  const handleForgot = () => {
    const email = profile?.parentEmail ?? "";
    Alert.alert(
      "Forgot PIN?",
      `We'll email a temporary 4-digit PIN to:\n${email}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            if (!email) { Alert.alert("No email on file"); return; }
            setForgotSending(true);
            try {
              const base = process.env.EXPO_PUBLIC_API_URL ?? (process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "https://myheroapp.org");
              await fetch(`${base}/api/auth/reset-pin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
            } catch { } finally {
              setForgotSending(false);
            }
            setPin("");
            setMode("verify-temp");
          },
        },
      ],
    );
  };

  const resetPin = async () => {
    Alert.alert(
      "Reset PIN",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            await setJSON(STORAGE_KEYS.parentPin, null);
            setMode("setup");
            setPin("");
            setFirstPin("");
          },
        },
      ],
    );
  };

  if (mode === "loading") {
    return <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={{ flex: 1 }} />;
  }

  const title = {
    setup: "Create your PIN",
    setup2: "Confirm your PIN",
    verify: "Enter parent PIN",
    "verify-temp": "Enter temporary PIN",
  }[mode];

  const subtitle = {
    setup: "4 digits to protect the parent dashboard",
    setup2: "Enter the PIN again to confirm",
    verify: "To access parent settings",
    "verify-temp": "Check your email for the 4-digit code",
  }[mode];

  return (
    <LinearGradient colors={["#7C3AED", "#4F46E5"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {onBack && (
          <View style={{ padding: 14 }}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={20} color="#FFF" />
            </Pressable>
          </View>
        )}

        <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "space-between" }}>

          <View style={{ alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
              👨‍👩‍👧 Parent Dashboard
            </Text>
            <AdamCharacter hero={hero} size={90} />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#FFF", textAlign: "center" }}>
              {title}
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
              {subtitle}
            </Text>
          </View>

          <Animated.View style={{
            flexDirection: "row", gap: 16, justifyContent: "center",
            transform: [{ translateX: shake }],
          }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: i < pin.length ? "#FFF" : "rgba(255,255,255,0.3)",
                borderWidth: 2, borderColor: "#FFF",
              }} />
            ))}
          </Animated.View>

          <View style={{ width: "100%" }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {PAD.map((d, i) => (
                <Pressable
                  key={i}
                  onPress={() => d !== "" && handleDigit(d)}
                  style={({ pressed }) => ({
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: d === "" ? "transparent" : pressed ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                    alignItems: "center", justifyContent: "center",
                  })}
                  disabled={d === ""}
                >
                  <Text style={{ fontSize: d === "⌫" ? 22 : 28, color: "#FFF", fontWeight: "700" }}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: 8, alignItems: "center" }}>
            {mode === "verify" && (
              <Pressable onPress={handleForgot}>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" }}>
                  Forgot PIN?
                </Text>
              </Pressable>
            )}
            {mode === "verify" && (
              <Pressable onPress={resetPin}>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                  Reset PIN
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
