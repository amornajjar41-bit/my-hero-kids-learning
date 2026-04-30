import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Confetti } from "@/components/Confetti";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { playChime } from "@/lib/chime";

type StoryNode = {
  text: string;
  fact?: string;
  choices: {
    label: string;
    next: string | "end";
    isGoodChoice?: boolean;
  }[];
};

const STORY_NODES: Record<string, StoryNode> = {
  start: {
    text: "🚀 You and your hero are walking in the park when you spot a tiny glowing rock near the pond. It seems to come from space! What do you do?",
    choices: [
      { label: "Pick it up immediately!", next: "grabbed" },
      { label: "Study it carefully with a magnifying glass 🔍", next: "studied", isGoodChoice: true },
      { label: "Ask a scientist nearby 👩‍🔬", next: "scientist", isGoodChoice: true },
    ],
  },
  grabbed: {
    text: "⚡ WOAH! The rock zaps you with static electricity! It's hot! Adam quickly puts it in a special container. Did you know: meteorites can be 4.5 BILLION years old — older than the Earth itself! That's 4,500,000,000 years! Can you count how many zeros that has? 🔢",
    choices: [
      { label: "Take it to the lab 🔬", next: "lab", isGoodChoice: true },
      { label: "Show it to friends 🏃", next: "friends" },
    ],
  },
  studied: {
    text: "🔬 Smart choice! Through the magnifying glass, you see tiny crystals and dots. Adam explains: 'This is a meteorite — a rock from outer space! Did you know Mars is about 225 MILLION km from Earth? If you drove a car non-stop, it would take 3,700 years to get there!' How long is that compared to your age?",
    choices: [
      { label: "Take it to the lab 🔬", next: "lab", isGoodChoice: true },
      { label: "Try to keep it as a pet rock 🪨", next: "friends" },
    ],
  },
  scientist: {
    text: "👩‍🔬 Excellent! The scientist is amazed! 'You were right to ask!' she says. 'This is a real meteorite! Asking for help when you're not sure is the wisest thing you can do — even scientists do it every day. The solar system has 8 planets — can you name them all?' 🪐",
    choices: [
      { label: "Name all 8 planets together! 🚀", next: "lab", isGoodChoice: true },
      { label: "Ask if there are aliens 👽", next: "friends" },
    ],
  },
  lab: {
    text: "🏆 At the lab, scientists discover the meteorite contains iron and nickel — the same materials in Earth's core! Adam gives you a high five: 'You made a real scientific discovery today! Scientists solve problems step by step, just like you. You've earned 5 stars!' ⭐⭐⭐⭐⭐\n\n🌟 LESSON: Curiosity + careful thinking = real discoveries! Always study something before touching it.",
    fact: "Science fact: Earth's core is made of iron and nickel — the same as some meteorites! 🌍",
    choices: [],
  },
  friends: {
    text: "😊 Your friends are amazed! But the meteorite starts glowing brighter... Adam says 'Maybe we should have studied it more carefully first! Scientists say: always observe, then act. But you still discovered something wonderful today! Here are 3 stars for your curiosity! ⭐⭐⭐\n\n💡 LESSON: Curiosity is great — just add patience and careful observation!",
    fact: "Did you know: Scientists use the scientific method — observe, question, experiment, conclude!",
    choices: [],
  },
};

const GOOD_ENDING_NODES = ["lab"];

export default function StoryBuilder() {
  const c = useColors();
  const router = useRouter();
  const { saveProgress, addPoints } = useApp();

  const [currentNode, setCurrentNode] = useState<string>("start");
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const node = STORY_NODES[currentNode];
  const isEnd = node.choices.length === 0;

  function handleChoice(next: string, isGood?: boolean) {
    playChime(isGood ? "success" : "tap");
    setHistory([...history, currentNode]);
    if (next === "end") {
      finish(5);
    } else {
      setCurrentNode(next);
    }
  }

  function finish(earnedStars: number) {
    const isGoodEnd = GOOD_ENDING_NODES.includes(currentNode);
    const finalStars = isGoodEnd ? 5 : 3;
    setStars(finalStars);
    setDone(true);
    setShowConfetti(true);
    playChime("celebration");
    saveProgress((p) => ({
      ...p,
      gamesPlayed: p.gamesPlayed + 1,
      starsTotal: p.starsTotal + finalStars,
    }));
    addPoints(15);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1a0533" }} edges={["top"]}>
      {showConfetti && <Confetti />}

      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 10 }}>
        <Pressable
          onPress={() => { playChime("tap"); router.back(); }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#FFF", fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 20, flex: 1 }}>
          📖 Story Builder
        </Text>
        <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: "#FDE68A", fontWeight: "800" }}>
            Step {history.length + 1}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
        <LinearGradient
          colors={["#2d1b69", "#1e0a4a"]}
          style={{ borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}
        >
          <Text style={{ color: "#FFF", fontSize: 16, lineHeight: 26, fontWeight: "500" }}>
            {node.text}
          </Text>
          {node.fact && (
            <View style={{ marginTop: 16, backgroundColor: "rgba(253,230,138,0.15)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(253,230,138,0.3)" }}>
              <Text style={{ color: "#FDE68A", fontSize: 13, lineHeight: 20, fontWeight: "700" }}>
                💡 {node.fact}
              </Text>
            </View>
          )}
        </LinearGradient>

        {!isEnd && !done && (
          <View style={{ gap: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
              What do you choose?
            </Text>
            {node.choices.map((choice, i) => (
              <Pressable
                key={i}
                onPress={() => handleChoice(choice.next, choice.isGoodChoice)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)",
                  borderRadius: 18, padding: 18,
                  borderWidth: 1.5,
                  borderColor: choice.isGoodChoice ? "rgba(253,230,138,0.3)" : "rgba(255,255,255,0.2)",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700" }}>
                  {["🅐", "🅑", "🅒"][i]} {choice.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {isEnd && !done && (
          <Pressable
            onPress={() => finish(stars)}
            style={({ pressed }) => ({
              backgroundColor: "#f97316", borderRadius: 20, padding: 18,
              alignItems: "center", opacity: pressed ? 0.88 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
              🏆 Story Complete!
            </Text>
          </Pressable>
        )}

        {done && (
          <LinearGradient colors={["#F59E0B", "#f97316"]} style={{ borderRadius: 24, padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 48 }}>{"⭐".repeat(stars)}</Text>
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 22, marginTop: 10, textAlign: "center" }}>
              Amazing! You earned {stars} stars!
            </Text>
            <Pressable
              onPress={() => { playChime("tap"); router.back(); }}
              style={({ pressed }) => ({
                marginTop: 20, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 16,
                paddingVertical: 14, paddingHorizontal: 28, opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 16 }}>
                ← Play Again
              </Text>
            </Pressable>
          </LinearGradient>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
