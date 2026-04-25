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
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
  const scrollRef = useRef<ScrollView>(null);

  // Load saved history on mount
  useEffect(() => {
    (async () => {
      const saved = await getJSON<ChatMessage[]>(STORAGE_KEYS.chatHistory);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setMessages(saved);
      }
      setHistoryLoaded(true);
    })();
  }, []);

  // Persist history whenever it changes
  useEffect(() => {
    if (!historyLoaded) return;
    setJSON(STORAGE_KEYS.chatHistory, messages).catch(() => {});
  }, [messages, historyLoaded]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  useEffect(() => {
    (async () => {
      try {
        await AudioModule.requestRecordingPermissionsAsync();
        await AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (historyLoaded && messages.length === 0) {
      setMessages([{ role: "assistant", text: t("chatHello") }]);
    }
  }, [historyLoaded, messages.length, t]);

  const voice = profile?.hero === "girl" ? "nova" : "echo";

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
      try {
        const { reply } = await chatSend({
          language: lang,
          childName: profile?.childName ?? "hero",
          ageGroup: profile?.ageGroup ?? "7-9",
          history: newHistory,
        });
        setMessages((m) => [...m, { role: "assistant", text: reply }]);
        speak(reply, voice).catch(() => {});
        saveProgress((p) => ({
          ...p,
          chatSessions: p.chatSessions + 1,
          weekly: p.weekly.map((v, i) =>
            i === new Date().getDay() ? v + 1 : v,
          ),
        }));
      } catch (e: any) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text:
              lang === "ar"
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
      ? await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.6,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.6,
          mediaTypes: "images",
        });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (asset?.base64) setPendingImage(asset.base64);
  };

  const startRec = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync().catch(() => {});
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      console.warn("rec start", e);
    }
  };

  const stopRec = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setBusy(true);
      const { text } = await transcribe({ audioBase64: b64, mimeType: "audio/m4a" });
      setBusy(false);
      if (text?.trim()) await send(text);
    } catch (e) {
      console.warn("rec stop", e);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <AdamCharacter hero={profile?.hero} size={48} bobbing={false} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "800", color: c.text, fontSize: 16 }}>
            {profile?.hero === "girl" ? "Lulu" : "Adam"}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 20 }}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "86%",
              }}
            >
              {m.imageBase64 && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${m.imageBase64}` }}
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 14,
                    marginBottom: 6,
                  }}
                  resizeMode="cover"
                />
              )}
              <LinearGradient
                colors={
                  m.role === "user"
                    ? [c.primary, "#FFA76A"]
                    : [c.card, c.card]
                }
                style={{
                  padding: 14,
                  borderRadius: 18,
                  borderTopLeftRadius: m.role === "user" ? 18 : 4,
                  borderTopRightRadius: m.role === "user" ? 4 : 18,
                }}
              >
                <Text
                  style={{
                    color: m.role === "user" ? "#FFF" : c.text,
                    fontSize: 16,
                    lineHeight: 22,
                    textAlign: lang === "ar" ? "right" : "left",
                  }}
                >
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
                {recState.isRecording ? t("listening") : t("thinking")}
              </Text>
            </View>
          )}
        </ScrollView>

        {pendingImage && (
          <SoftCard
            style={{
              marginHorizontal: 14,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
            padded={false}
          >
            <Image
              source={{ uri: `data:image/jpeg;base64,${pendingImage}` }}
              style={{ width: 60, height: 60, borderRadius: 14, margin: 8 }}
            />
            <Text style={{ flex: 1, color: c.text, fontWeight: "700" }}>
              📸 {lang === "ar" ? "صورة جاهزة للإرسال" : "Photo ready to send"}
            </Text>
            <Pressable onPress={() => setPendingImage(null)} style={{ padding: 14 }}>
              <Ionicons name="close" size={20} color={c.mutedForeground} />
            </Pressable>
          </SoftCard>
        )}

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            paddingBottom: Platform.OS === "ios" ? 16 : 10,
            backgroundColor: c.card,
            borderTopColor: c.border,
            borderTopWidth: 1,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => pickImage(true)}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="camera" size={22} color={c.text} />
          </Pressable>
          <Pressable
            onPress={() => pickImage(false)}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="image" size={22} color={c.text} />
          </Pressable>
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
              maxHeight: 120,
              color: c.text,
              fontSize: 15,
              textAlign: lang === "ar" ? "right" : "left",
            }}
          />
          {input.trim() || pendingImage ? (
            <Pressable
              onPress={() =>
                send(input, pendingImage ?? undefined)
              }
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="send" size={20} color="#FFF" />
            </Pressable>
          ) : (
            <Pressable
              onPressIn={startRec}
              onPressOut={stopRec}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: recState.isRecording ? c.destructive : c.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name={recState.isRecording ? "stop" : "mic"}
                size={22}
                color="#FFF"
              />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
