import React from "react";
import { ScrollView, Text, View } from "react-native";

import { SoftCard } from "./SoftCard";
import { allBadges, badgeName } from "@/constants/badges";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT, useLang } from "@/hooks/useT";

export function BadgeShelf() {
  const c = useColors();
  const { progress } = useApp();
  const t = useT();
  const lang = useLang();
  return (
    <SoftCard>
      <Text style={{ fontSize: 18, fontWeight: "800", color: c.text }}>
        {t("trophyShelf")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12, gap: 14 }}
      >
        {allBadges.map((b) => {
          const earned = b.earned({
            streak: progress.streak,
            lessonsCompleted: progress.lessonsCompleted.length,
            chatSessions: progress.chatSessions,
            arabicLessons: progress.arabicLessons,
            englishLessons: progress.englishLessons,
            gamesPlayed: progress.gamesPlayed,
          });
          return (
            <View key={b.id} style={{ alignItems: "center", width: 78 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: earned ? c.yellow : c.muted,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: earned ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 32 }}>{b.emoji}</Text>
              </View>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11,
                  color: c.mutedForeground,
                  textAlign: "center",
                  marginTop: 6,
                }}
              >
                {badgeName(b, lang)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SoftCard>
  );
}
