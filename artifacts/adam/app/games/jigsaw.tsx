import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SoftCard } from "@/components/SoftCard";
import { jigsawImages } from "@/constants/games-data";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT } from "@/hooks/useT";
import { speak, stopAll as stopAudio } from "@/lib/audio";
import {
  preloadJigsawAudio,
  jigsawFunFactPath,
  playPreloaded,
  stopPreloaded,
} from "@/lib/lessonAudio";

const PALETTES: [string, string][] = [
  ["#FF8A4C", "#FFD93D"],
  ["#4FD1C5", "#7CC7FF"],
  ["#A78BFA", "#FF6FB5"],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default function Jigsaw() {
  const c = useColors();
  const router = useRouter();
  const t = useT();
  const { profile, saveProgress, addPoints } = useApp();
  const voice = profile?.hero === "girl" ? "nova" : "echo";

  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [solvedAll, setSolvedAll] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const item = jigsawImages[round % jigsawImages.length]!;
  const palette = PALETTES[round % PALETTES.length]!;

  useEffect(() => {
    preloadJigsawAudio();
    return () => {
      stopPreloaded();
      stopAudio();
    };
  }, []);

  useEffect(() => {
    setTiles(shuffle([0, 1, 2, 3]));
    setDone(false);
    setSelectedIdx(null);
  }, [round]);

  // Speak the puzzle title when a new round starts — short and clear
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(item.title, voice).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [round]);

  const swap = (i: number) => {
    if (done) return;
    if (selectedIdx === null) {
      setSelectedIdx(i);
    } else {
      const j = selectedIdx;
      setSelectedIdx(null);
      setTiles((arr) => {
        const next = [...arr];
        [next[i], next[j]] = [next[j]!, next[i]!];
        const isSolved = next.every((v, idx) => v === idx);
        if (isSolved) {
          setDone(true);
          // Play fun fact from preloaded cache, fall back to short celebration
          const path = jigsawFunFactPath(item.id);
          playPreloaded(path, () =>
            speak("Amazing! You solved it!", voice)
          ).catch(() => {});
          setTimeout(() => {
            if (round + 1 >= jigsawImages.length) setSolvedAll(true);
            else setRound((r) => r + 1);
          }, 2200);
        }
        return next;
      });
    }
  };

  useEffect(() => {
    if (solvedAll) {
      saveProgress((p) => ({
        ...p,
        gamesPlayed: p.gamesPlayed + 1,
        starsTotal: p.starsTotal + jigsawImages.length,
      }));
      addPoints(15);
    }
  }, [solvedAll, saveProgress, addPoints]);

  const tileColors = useMemo(
    () =>
      [
        [palette[0], palette[1]],
        [palette[1], palette[0]],
        [palette[0], "#FFF"],
        [palette[1], "#FFF"],
      ] as [string, string][],
    [palette],
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
          <Ionicons name="close" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>
          🧩 {t("jigsaw")}
        </Text>
        <Text style={{ fontWeight: "800", color: c.text }}>
          {round + 1}/{jigsawImages.length}
        </Text>
      </View>

      {solvedAll ? (
        <View style={{ flex: 1, padding: 18, gap: 16 }}>
          <Confetti count={70} />
          <SoftCard color={c.primary}>
            <Text style={{ fontSize: 60, textAlign: "center" }}>🏆</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 22, textAlign: "center", marginTop: 6 }}>
              {t("correct")}
            </Text>
          </SoftCard>
          <PrimaryButton title={t("done")} fullWidth onPress={() => router.back()} />
        </View>
      ) : (
        <View style={{ flex: 1, padding: 18, gap: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: c.text }}>
            {item.title}
          </Text>

          {selectedIdx !== null && (
            <Text style={{ fontSize: 13, color: c.mutedForeground, fontWeight: "600" }}>
              Now tap another tile to swap 🔄
            </Text>
          )}

          <View
            style={{
              width: 280, height: 280,
              flexDirection: "row", flexWrap: "wrap",
              borderRadius: 18, overflow: "hidden",
              shadowColor: "#000", shadowOpacity: 0.18,
              shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            {tiles.map((v, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <Pressable key={idx} onPress={() => swap(idx)} style={{ width: "50%", height: "50%" }}>
                  <LinearGradient
                    colors={tileColors[v]!}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      borderWidth: isSelected ? 4 : 2,
                      borderColor: isSelected ? "#FFF" : "#FFF",
                      alignItems: "center", justifyContent: "center",
                      opacity: isSelected ? 0.75 : 1,
                    }}
                  >
                    {isSelected && (
                      <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(255,255,255,0.35)",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Text style={{ fontSize: 28 }}>✋</Text>
                      </View>
                    )}
                    {v === 0 && !isSelected && <Text style={{ fontSize: 60 }}>{item.emojiCenter}</Text>}
                    {v === 0 && isSelected && <Text style={{ fontSize: 40, opacity: 0.7 }}>{item.emojiCenter}</Text>}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          <SoftCard color={c.yellow} style={{ width: "100%" }}>
            <Text style={{ fontWeight: "800", color: "#5B3700" }}>💡 {t("funFact")}</Text>
            <Text style={{ color: "#5B3700", marginTop: 6, fontSize: 14, lineHeight: 20 }}>
              {item.fun}
            </Text>
          </SoftCard>

          {done && (
            <Text style={{ color: c.green, fontWeight: "800", fontSize: 18 }}>
              🎉 {t("correct")}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
