import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
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

import { AdamCharacter } from "@/components/AdamCharacter";
import { SoftCard } from "@/components/SoftCard";
import { SoundToggle } from "@/components/SoundToggle";
import { SpeakButton } from "@/components/SpeakButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT, useLang } from "@/hooks/useT";
import { chatSend, transcribe, type ChatMessage } from "@/lib/api";
import { speak } from "@/lib/audio";
import { getJSON, setJSON, STORAGE_KEYS } from "@/lib/storage";

/** Pulsing ring animation for PTT button */
function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.7, duration: 800, useNativeDriver: false, easing: Easing.out(Easing.ease) }),
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.4, duration: 100, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: false }),
          ]),
        ]),
      ).start();
    } else {
      scale.setValue(1);
      opacity.setValue(0);
    }
  }, [active, scale, opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#FF6B35",
        transform: [{ scale }],
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}

/** Animated waveform bars */
function Waveform({ active }: { active: boolean }) {
  const bars = 7;
  const anims = useRef(Array.from({ length: bars }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (active) {
      anims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 200 + i * 60,
              useNativeDriver: false,
              easing: Easing.inOut(Easing.sin),
            }),
            Animated.timing(anim, {
              toValue: 0.2,
              duration: 200 + i * 50,
              useNativeDriver: false,
              easing: Easing.inOut(Easing.sin),
            }),
          ]),
        ).start();
      });
    } else {
      anims.forEach((a) => {
        a.setValue(0.3);
      });
    }
    return () => anims.forEach((a) => a.stopAnimation());
  }, [active, anims]);

  if (!active) return null;
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center", height: 36 }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            height: 36,
            borderRadius: 2,
            backgroundColor: "#FFF",
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
}

/** First-time voice tutorial modal */
function VoiceTutorial({
  visible,
  onDismiss,
  lang,
  heroName,
  t,
}: {
  visible: boolean;
  onDismiss: () => void;
  lang: string;
  heroName: string;
  t: (k: string) => string;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 80, friction: 8 }).start();
    }
  }, [visible, scale]);

  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient
            colors={["#FF8A4C", "#FF6B35"]}
            style={{ borderRadius: 28, padding: 28, alignItems: "center", maxWidth: 340 }}
          >
            <Text style={{ fontSize: 60 }}>🦸</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 20, textAlign: "center", marginTop: 12 }}>
              {lang === "ar"
                ? `أهلاً! أنا ${heroName}!`
                : `Hey! I'm ${heroName}!`}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 22 }}>
              {lang === "ar"
                ? "شايف الزر البرتقالي الكبير؟ اضغط عليه وسألني أي شي — رياضيات، إنجليزي، عربي، أي شي! أنا كلي آذان! 🎤"
                : "See the big orange button? Hold it and ask me ANYTHING — math, English, Arabic, anything! I'm all ears! 🦸🎤"}
            </Text>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => ({
                marginTop: 20,
                backgroundColor: "#FFF",
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 30,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: "#FF6B35", fontWeight: "800", fontSize: 16 }}>
                {lang === "ar" ? "فهمت! يلا نبدأ! 🚀" : "Got it! Let's go! 🚀"}
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function Chat() {
  const c = useColors();
  const t = useT();
  const lang = useLang();
  const { profile, saveProgress } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const [adamPose, setAdamPose] = useState<"normal" | "thinking" | "happy">("normal");
  const scrollRef = useRef<ScrollView>(null);
  const recStartTime = useRef<number>(0);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const isRecording = recState.isRecording;

  // PTT pulse animation
  const pttScale = useRef(new Animated.Value(1)).current;

  // Load history
  useEffect(() => {
    (async () => {
      const saved = await getJSON<ChatMessage[]>(STORAGE_KEYS.chatHistory);
      if (saved && Array.isArray(saved) && saved.length > 0) setMessages(saved);
      setHistoryLoaded(true);
      // First time tutorial
      const tutDone = await getJSON<boolean>(STORAGE_KEYS.voiceTutorialDone);
      if (!tutDone) setShowTutorial(true);
    })();
  }, []);

  // Persist history
  useEffect(() => {
    if (!historyLoaded) return;
    setJSON(STORAGE_KEYS.chatHistory, messages).catch(() => {});
  }, [messages, historyLoaded]);

  // Auto-greet
  useEffect(() => {
    if (historyLoaded && messages.length === 0) {
      setMessages([{ role: "assistant", text: t("chatHello") }]);
    }
  }, [historyLoaded, messages.length, t]);

  // Audio permissions
  useEffect(() => {
    (async () => {
      try {
        await AudioModule.requestRecordingPermissionsAsync();
        await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      } catch { /* ignore */ }
    })();
  }, []);

  const voice = profile?.hero === "girl" ? "nova" : "echo";
  const heroName = profile?.hero === "girl" ? "Lulu" : "Adam";

  const dismissTutorial = async () => {
    setShowTutorial(false);
    await setJSON(STORAGE_KEYS.voiceTutorialDone, true);
  };

  const send = useCallback(
    async (text: string, imageBase64?: string) => {
      if (!text.trim() && !imageBase64) return;
      const userMsg: ChatMessage = {
        role: "user",
        text: text.trim() || (lang === "ar" ? "ساعدني بهالواجب" : "Help me with this"),
        imageBase64,
      };
      const newHistory = [...messages, userMsg];
      setMessages(newHistory);
      setInput("");
      setPendingImage(null);
      setBusy(true);
      setAdamPose("thinking");
      try {
        const { reply } = await chatSend({
          language: lang,
          childName: profile?.childName ?? "hero",
          ageGroup: profile?.ageGroup ?? "7-9",
          history: newHistory,
        });
        setAdamPose("happy");
        setTimeout(() => setAdamPose("normal"), 1200);
        setMessages((m) => [...m, { role: "assistant", text: reply }]);
        speak(reply, voice).catch(() => {});
        saveProgress((p) => ({
          ...p,
          chatSessions: p.chatSessions + 1,
          weekly: p.weekly.map((v, i) => (i === new Date().getDay() ? v + 1 : v)),
        }));
      } catch {
        setAdamPose("normal");
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: lang === "ar"
              ? "في مشكلة بالاتصال 😢 جرب مرة ثانية"
              : "Connection issue 😢 try again",
          },
        ]);
      } finally {
        setBusy(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }
    },
    [messages, lang, profile, saveProgress, voice],
  );

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6, mediaTypes: "images" });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (asset?.base64) setPendingImage(asset.base64);
  };

  const startRec = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    recStartTime.current = Date.now();
    Animated.spring(pttScale, { toValue: 0.92, useNativeDriver: false, tension: 200 }).start();
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) { console.warn("rec start", e); }
  };

  const stopRec = async () => {
    Animated.spring(pttScale, { toValue: 1, useNativeDriver: false, tension: 200 }).start();
    try {
      await recorder.stop();
      const duration = Date.now() - recStartTime.current;
      if (duration < 1000) {
        setTooShort(true);
        setTimeout(() => setTooShort(false), 2000);
        return;
      }
      const uri = recorder.uri;
      if (!uri) return;
      if (Platform.OS === "web") {
        // Web: use blob recording
        setBusy(true);
        // transcribe is skipped on web since FileSystem is not available;
        // fall back to typed input hint
        setBusy(false);
        return;
      }
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setBusy(true);
      const { text } = await transcribe({ audioBase64: b64, mimeType: "audio/m4a" });
      setBusy(false);
      if (text?.trim()) await send(text);
      else {
        setTooShort(true);
        setTimeout(() => setTooShort(false), 2500);
      }
    } catch (e) {
      console.warn("rec stop", e);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <VoiceTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        lang={lang}
        heroName={heroName}
        t={t}
      />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Adam character with poses */}
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          {adamPose === "thinking" ? (
            <Text style={{ fontSize: 38 }}>🤔</Text>
          ) : adamPose === "happy" ? (
            <Text style={{ fontSize: 38 }}>🎉</Text>
          ) : (
            <AdamCharacter hero={profile?.hero} size={48} bobbing={false} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
            {heroName}
          </Text>
          <Text style={{ color: c.green, fontSize: 12, fontWeight: "700" }}>
            ● {lang === "ar" ? "متصل" : "Online"}
          </Text>
        </View>
        <SoundToggle />
        <Pressable
          onPress={() => setMessages([])}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.muted,
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: c.text, fontWeight: "700", fontSize: 12 }}>
            {t("newChat")}
          </Text>
        </Pressable>
      </View>

      {/* Recording indicator (red dot top right) */}
      {isRecording && (
        <View style={{ position: "absolute", top: 16, right: 16, zIndex: 100, flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }}>REC</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 20 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "86%" }}
            >
              {m.imageBase64 && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${m.imageBase64}` }}
                  style={{ width: 180, height: 180, borderRadius: 14, marginBottom: 6 }}
                  resizeMode="cover"
                />
              )}
              <LinearGradient
                colors={m.role === "user" ? [c.primary, "#FFA76A"] : [c.card, c.card]}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  borderTopLeftRadius: m.role === "user" ? 18 : 4,
                  borderTopRightRadius: m.role === "user" ? 4 : 18,
                }}
              >
                <Text style={{ color: m.role === "user" ? "#FFF" : c.text, fontSize: 16, lineHeight: 22, textAlign: lang === "ar" ? "right" : "left" }}>
                  {m.text}
                </Text>
                {m.role === "assistant" && (
                  <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <SpeakButton text={m.text} voice={voice} size={32} />
                  </View>
                )}
              </LinearGradient>
            </View>
          ))}

          {busy && (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <ActivityIndicator color={c.primary} />
              <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                {isRecording ? t("listening") : t("thinking")}
              </Text>
            </View>
          )}

          {tooShort && (
            <View style={{ alignSelf: "flex-start", backgroundColor: "#FEF3C7", borderRadius: 16, padding: 12 }}>
              <Text style={{ color: "#92400E", fontWeight: "700" }}>
                {lang === "ar" ? "حاول مرة ثانية، ما سمعتك! 🎤" : "Try again, I didn't hear you! 🎤"}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Pending image preview */}
        {pendingImage && (
          <SoftCard style={{ marginHorizontal: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }} padded={false}>
            <Image source={{ uri: `data:image/jpeg;base64,${pendingImage}` }} style={{ width: 60, height: 60, borderRadius: 14, margin: 8 }} />
            <Text style={{ flex: 1, color: c.text, fontWeight: "700" }}>
              📸 {lang === "ar" ? "صورة جاهزة للإرسال" : "Photo ready to send"}
            </Text>
            <Pressable onPress={() => setPendingImage(null)} style={{ padding: 14 }}>
              <Ionicons name="close" size={20} color={c.mutedForeground} />
            </Pressable>
          </SoftCard>
        )}

        {/* Input area */}
        <View style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          backgroundColor: c.card,
          borderTopColor: c.border,
          borderTopWidth: 1,
          gap: 8,
        }}>
          {/* Text input row */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t("typeMessage")}
              placeholderTextColor={c.mutedForeground}
              multiline
              style={{
                flex: 1,
                backgroundColor: c.muted,
                borderRadius: 22,
                paddingHorizontal: 14,
                paddingVertical: 10,
                minHeight: 44,
                maxHeight: 100,
                color: c.text,
                fontSize: 15,
                textAlign: lang === "ar" ? "right" : "left",
              }}
            />
            {(input.trim() || pendingImage) && (
              <Pressable
                onPress={() => send(input, pendingImage ?? undefined)}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: c.primary,
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </Pressable>
            )}
          </View>

          {/* Camera/image + PTT row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
            {/* Camera buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => pickImage(true)}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: c.muted,
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="camera" size={22} color={c.text} />
              </Pressable>
              <Pressable
                onPress={() => pickImage(false)}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: c.muted,
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="image" size={22} color={c.text} />
              </Pressable>
            </View>

            {/* Big PTT button */}
            <View style={{ alignItems: "center", gap: 6 }}>
              {isRecording ? (
                <View style={{ alignItems: "center" }}>
                  <Waveform active={isRecording} />
                  <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 2 }}>
                    {lang === "ar" ? "ارفع إصبعك للإرسال" : "Release to send"}
                  </Text>
                </View>
              ) : null}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <PulseRing active={isRecording} />
                <Animated.View style={{ transform: [{ scale: pttScale }] }}>
                  <Pressable
                    onPressIn={startRec}
                    onPressOut={stopRec}
                    style={({ pressed }) => ({
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      backgroundColor: isRecording ? "#EF4444" : "#FF6B35",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: isRecording ? "#EF4444" : "#FF6B35",
                      shadowOpacity: 0.5,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 8,
                    })}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={36}
                      color="#FFF"
                    />
                  </Pressable>
                </Animated.View>
              </View>
              {!isRecording && (
                <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 11 }}>
                  {lang === "ar" ? "اضغط وحكي 🎤" : "Hold to talk 🎤"}
                </Text>
              )}
            </View>

            {/* Spacer to balance */}
            <View style={{ width: 44 + 10 + 44 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
