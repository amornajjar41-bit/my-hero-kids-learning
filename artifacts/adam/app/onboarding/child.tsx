import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import type { Profile, AgeGroup } from "@/lib/storage";

// ── Helpers ────────────────────────────────────────────────────────────────────
const MONTHS_EN = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 13 }, (_, i) => currentYear - 3 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function calcAgeGroup(year: number, month: number, day: number): "4-6" | "7-9" | "10-12" | "13-14" {
  const dob = new Date(year, month, day);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age <= 6) return "4-6";
  if (age <= 9) return "7-9";
  if (age <= 12) return "10-12";
  return "13-14";
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// ── Dropdown Picker ─────────────────────────────────────────────────────────
function DropdownPicker({
  label,
  value,
  options,
  onSelect,
  c,
}: {
  label: string;
  value: string;
  options: { label: string; value: number }[];
  onSelect: (v: number) => void;
  c: ReturnType<typeof useColors>;
}) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selectedIndex = options.findIndex(o => o.label === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: c.input,
          borderRadius: 14,
          padding: 14,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 56,
          opacity: pressed ? 0.8 : 1,
          borderWidth: 2,
          borderColor: value ? c.primary : "transparent",
        })}
      >
        <Text style={{ fontSize: 11, color: c.mutedForeground, fontWeight: "600", marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, color: value ? c.text : c.mutedForeground, fontWeight: "700" }}>
          {value || "—"}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={{
              backgroundColor: c.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: 420,
              paddingBottom: 32,
            }}>
              <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
                <View style={{ width: 40, height: 4, backgroundColor: c.muted, borderRadius: 2, marginBottom: 12 }} />
                <Text style={{ fontWeight: "800", fontSize: 16, color: c.text }}>{label}</Text>
              </View>

              <ScrollView
                ref={scrollRef}
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                onLayout={() => {
                  if (selectedIndex > 0) {
                    scrollRef.current?.scrollTo({ y: selectedIndex * 52, animated: false });
                  }
                }}
              >
                {options.map((opt) => {
                  const isSelected = opt.label === value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => { onSelect(opt.value); setOpen(false); }}
                      style={({ pressed }) => ({
                        paddingVertical: 14,
                        paddingHorizontal: 24,
                        backgroundColor: isSelected ? c.primary + "20" : "transparent",
                        borderLeftWidth: isSelected ? 4 : 0,
                        borderLeftColor: c.primary,
                        flexDirection: "row",
                        alignItems: "center",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{
                        fontSize: 17,
                        fontWeight: isSelected ? "800" : "500",
                        color: isSelected ? c.primary : c.text,
                        flex: 1,
                      }}>
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Text style={{ color: c.primary, fontSize: 18 }}>✓</Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ChildInfo() {
  const c = useColors();
  const router = useRouter();
  const { saveProfile } = useApp();
  const params = useLocalSearchParams<{
    lang: string;
    hero: "boy" | "girl";
    parentName: string;
    parentEmail: string;
    password: string;
    country: string;
    currency: string;
    currencySymbol: string;
    currencyRate: string;
  }>();

  const [name, setName] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const maxDays = selectedYear && selectedMonth !== null
    ? daysInMonth(selectedYear, selectedMonth)
    : 31;

  const effectiveDay = selectedDay && selectedDay > maxDays ? maxDays : selectedDay;

  const hasFullDate = effectiveDay !== null && selectedMonth !== null && selectedYear !== null;
  const actualAge = hasFullDate
    ? Math.floor((Date.now() - new Date(selectedYear!, selectedMonth!, effectiveDay!).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const ageInRange = actualAge !== null && actualAge >= 4 && actualAge <= 14;
  const canContinue = name.trim().length >= 2 && hasFullDate && ageInRange;

  const ageGroup = hasFullDate
    ? calcAgeGroup(selectedYear!, selectedMonth!, effectiveDay!)
    : null;

  const dobFormatted = hasFullDate
    ? `${selectedYear}-${pad(selectedMonth! + 1)}-${pad(effectiveDay!)}`
    : "";

  const dayOptions = Array.from({ length: maxDays }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));

  const monthOptions = MONTHS_EN.map((m, i) => ({ label: m, value: i }));
  const yearOptions = YEARS.map(y => ({ label: String(y), value: y }));

  async function handleContinue() {
    if (!canContinue) return;
    const profile: Profile = {
      language: "en",
      hero: params.hero,
      childName: name,
      ageGroup: ageGroup! as AgeGroup,
      parentEmail: params.parentEmail,
      parentName: params.parentName,
      childBirthday: dobFormatted,
      trialStartedAt: new Date().toISOString(),
      isPaid: false,
      screenLimitHours: 2,
      soundOn: true,
    };
    await saveProfile(profile);
    router.replace({
      pathname: "/onboarding/done",
      params: {
        lang: "en",
        hero: params.hero,
        parentEmail: params.parentEmail,
        password: params.password,
        parentName: params.parentName,
        country: params.country,
        currency: params.currency,
        currencySymbol: params.currencySymbol,
        currencyRate: params.currencyRate,
        name,
        age: ageGroup!,
        dob: dobFormatted,
      },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 28, fontWeight: "800", color: c.text, textAlign: "center" }}>
            Tell me about your child
          </Text>

          <SoftCard>
            <Text style={{ fontWeight: "700", marginBottom: 6, color: c.text }}>
              Child's name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Omar"
              placeholderTextColor={c.mutedForeground}
              style={{
                backgroundColor: c.input,
                padding: 14,
                borderRadius: 14,
                color: c.text,
                fontSize: 16,
              }}
            />
          </SoftCard>

          <SoftCard>
            <Text style={{ fontWeight: "700", marginBottom: 10, color: c.text }}>
              Date of birth
            </Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <DropdownPicker
                label="Day"
                value={effectiveDay ? String(effectiveDay) : ""}
                options={dayOptions}
                onSelect={setSelectedDay}
                c={c}
              />
              <View style={{ flex: 1.6 }}>
                <DropdownPicker
                  label="Month"
                  value={selectedMonth !== null ? MONTHS_EN[selectedMonth] : ""}
                  options={monthOptions}
                  onSelect={setSelectedMonth}
                  c={c}
                />
              </View>
              <DropdownPicker
                label="Year"
                value={selectedYear ? String(selectedYear) : ""}
                options={yearOptions}
                onSelect={setSelectedYear}
                c={c}
              />
            </View>

            <View style={{ marginTop: 10, minHeight: 20 }}>
              {!hasFullDate ? (
                <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                  Tap each box to pick day, month, and year
                </Text>
              ) : !ageInRange ? (
                <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "700" }}>
                  ⚠️ Child must be 4–14 years old (calculated age: {actualAge})
                </Text>
              ) : (
                <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "700" }}>
                  ✓ Age group: {ageGroup} years
                </Text>
              )}
            </View>
          </SoftCard>

          <View style={{
            backgroundColor: c.muted,
            borderRadius: 16,
            padding: 14,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 28 }}>{params.hero === "girl" ? "🦸‍♀️" : "🦸‍♂️"}</Text>
            <Text style={{ flex: 1, color: c.mutedForeground, fontSize: 13 }}>
              Your hero is {params.hero === "girl" ? "Sara" : "Adam"} — you can change later
            </Text>
          </View>

          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              title="Continue"
              fullWidth
              disabled={!canContinue}
              onPress={handleContinue}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
