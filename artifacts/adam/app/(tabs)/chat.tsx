import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useWindowDimensions } from "react-native";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
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

import { AdamCharacter, CharacterPose } from "@/components/AdamCharacter";
import { SoftCard } from "@/components/SoftCard";
import { SoundToggle } from "@/components/SoundToggle";
import { SpeakButton } from "@/components/SpeakButton";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useT, useLang } from "@/hooks/useT";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { chatSend, transcribe, type ChatMessage, type ChatSuggestion } from "@/lib/api";
import { speak, stopAll as stopAudio } from "@/lib/audio";
import { getJSON, setJSON, STORAGE_KEYS, type SafetyAlert, type ChildMemory, defaultChildMemory } from "@/lib/storage";

// ── Typing indicator (3 bouncing dots) ─────────────────────────────────────
function TypingBubble({ lang }: { lang: string }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: -8, duration: 300, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
          Animated.timing(dot, { toValue:  0, duration: 300, useNativeDriver: false, easing: Easing.in(Easing.quad) }),
          Animated.delay(420),
        ]),
      ).start();
    });
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, paddingLeft: 6, paddingVertical: 12 }}>
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "#F3F4F6", borderRadius: 18, borderTopLeftRadius: 4,
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: "#9CA3AF",
              transform: [{ translateY: dot }],
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ── Pulsing ring animation ──────────────────────────────────────────────────
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
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#FF6B35",
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

// ── Animated waveform ───────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = 7;
  const anims = useRef(Array.from({ length: bars }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (active) {
      anims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.3 + (i % 3) * 0.25, duration: 220 + i * 55, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.2, duration: 200 + i * 45, useNativeDriver: false }),
          ]),
        ).start();
      });
    } else {
      anims.forEach((a) => a.stopAnimation(() => a.setValue(0.3)));
    }
  }, [active, anims]);

  if (!active) return null;
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center", height: 36 }}>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: "#FFF", transform: [{ scaleY: anim }] }} />
      ))}
    </View>
  );
}

// ── Voice tutorial modal ────────────────────────────────────────────────────
function VoiceTutorial({ visible, onDismiss, lang, heroName }: { visible: boolean; onDismiss: () => void; lang: string; heroName: string }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    if (visible) Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 80, friction: 8 }).start();
  }, [visible, scale]);

  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Animated.View style={{ transform: [{ scale }], width: "100%", maxWidth: 340 }}>
          <LinearGradient colors={["#FF8A4C", "#FF6B35"]} style={{ borderRadius: 28, padding: 28, alignItems: "center" }}>
            <Text style={{ fontSize: 60 }}>🦸</Text>
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 20, textAlign: "center", marginTop: 12 }}>
              {lang === "ar" ? `أهلاً! أنا ${heroName}!` : `Hey! I'm ${heroName}!`}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 22 }}>
              {lang === "ar"
                ? "شايف الزر البرتقالي الكبير؟ اضغط عليه وسألني أي شي — رياضيات، إنجليزي، عربي، أي شي! 🎤"
                : "See the big orange button? Hold it and ask me ANYTHING — math, science, English, anything! I'm all ears! 🦸🎤"}
            </Text>
            <Pressable onPress={onDismiss} style={({ pressed }) => ({ marginTop: 20, backgroundColor: "#FFF", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, opacity: pressed ? 0.85 : 1 })}>
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

// ── Emoji Opening Buttons ────────────────────────────────────────────────────
const EMOJI_OPENERS = [
  { emoji: "🎒", en: "Help me with homework", ar: "ساعدني بالواجب", color: "#3B82F6" },
  { emoji: "🎮", en: "Let's play a game!", ar: "يلا نلعب!", color: "#10B981" },
  { emoji: "📚", en: "I want to learn something", ar: "بدي أتعلم شي", color: "#8B5CF6" },
  { emoji: "😊", en: "Just saying hi!", ar: "بس أسلم عليك!", color: "#F59E0B" },
];

function EmojiButton({ item, lang, onTap, delay }: {
  item: typeof EMOJI_OPENERS[0]; lang: string; onTap: (t: string) => void; delay: number;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 120, friction: 8 }).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onTap(lang === "ar" ? item.ar : item.en)}
        style={({ pressed }) => ({
          backgroundColor: item.color + "18",
          borderRadius: 20,
          borderWidth: 2,
          borderColor: item.color + "60",
          padding: 16,
          alignItems: "center",
          gap: 8,
          minWidth: 130,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
        <Text style={{ color: "#374151", fontWeight: "700", fontSize: 13, textAlign: "center" }}>
          {lang === "ar" ? item.ar : item.en}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function EmojiOpening({ lang, heroName, hero, onTap }: {
  lang: string; heroName: string; hero?: string; onTap: (text: string) => void;
}) {
  return (
    <View style={{ padding: 8, gap: 12 }}>
      <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: "#6B7280", marginBottom: 4 }}>
        {lang === "ar" ? `مرحباً! أنا ${heroName} 👋 كيف أساعدك اليوم؟` : `Hey! I'm ${heroName} 👋 What shall we do?`}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {EMOJI_OPENERS.map((item, i) => (
          <EmojiButton key={item.en} item={item} lang={lang} onTap={onTap} delay={i * 100} />
        ))}
      </View>
    </View>
  );
}

// ── Suggestion Buttons ────────────────────────────────────────────────────────
function SuggestionButtons({ suggestions, onTap }: {
  suggestions: ChatSuggestion[]; onTap: (text: string) => void;
}) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 8, marginTop: 4 }}>
      {suggestions.map((s) => (
        <Pressable
          key={s.key}
          onPress={() => onTap(s.text)}
          style={({ pressed }) => ({
            backgroundColor: "#F3F4F6",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 14,
            paddingVertical: 8,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text style={{ color: "#374151", fontSize: 13, fontWeight: "600" }}>{s.text}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── High Five Sticker ─────────────────────────────────────────────────────────
function HighFiveSticker({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const slide = useRef(new Animated.Value(300)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slide, { toValue: 0, useNativeDriver: false, tension: 80, friction: 8 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 100, friction: 7 }),
      ]).start();
    } else {
      slide.setValue(300);
      scale.setValue(0.5);
    }
  }, [visible, slide, scale]);

  if (!visible) return null;
  return (
    <Animated.View
      style={{
        position: "absolute",
        right: 16,
        bottom: 160,
        transform: [{ translateX: slide }, { scale }],
        zIndex: 100,
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          backgroundColor: "#FFF",
          borderRadius: 24,
          padding: 16,
          alignItems: "center",
          shadowColor: "#FF6B35",
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          minWidth: 120,
          borderWidth: 2,
          borderColor: "#FF6B35",
        }}
      >
        <Text style={{ fontSize: 48 }}>🤚</Text>
        <Text style={{ fontWeight: "900", color: "#FF6B35", fontSize: 14, marginTop: 4 }}>High Five!</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Native recorder (imperative, module-level) ──────────────────────────────
let _nativeRec: any = null;

async function nativeStartRecording(): Promise<void> {
  const { AudioModule, AudioRecorder, RecordingPresets } = await import("expo-audio");
  // Always request — on iOS this shows the system dialog first time
  const perm = await AudioModule.requestRecordingPermissionsAsync();
  if (!perm.granted) throw Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });
  await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  _nativeRec = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await _nativeRec.prepareToRecordAsync();
  _nativeRec.record();
}

async function nativeStopRecording(): Promise<{ base64: string; mimeType: string }> {
  if (!_nativeRec) throw new Error("no native recorder");
  const result = await _nativeRec.stop();
  _nativeRec = null;
  const uri: string = result?.uri ?? result;
  const { readAsStringAsync, EncodingType } = await import("expo-file-system");
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  const mimeType = uri.endsWith(".mp3") ? "audio/mp3" : "audio/m4a";
  return { base64, mimeType };
}

// ── Web WAV recorder using Web Audio API ─────────────────────────────────────
// MediaRecorder produces webm/opus which causes conversion issues.
// Instead we capture raw PCM via ScriptProcessorNode and encode as WAV.
let _wavCtx: AudioContext | null = null;
let _wavStream: MediaStream | null = null;
let _wavProcessor: ScriptProcessorNode | null = null;
let _wavSource: MediaStreamAudioSourceNode | null = null;
let _wavChunks: Float32Array[] = [];
let _wavSR = 16000;

function _encodeWAV(samples: Float32Array, sr: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true);
  ws(8, "WAVE"); ws(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

async function webStartRecording(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    _wavChunks = [];
    // FIX 4: Better audio constraints — explicit 16kHz mono for best Whisper accuracy
    _wavStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const track = _wavStream.getAudioTracks()[0];
    _wavSR = (track.getSettings().sampleRate) || 16000;
    // @ts-ignore — AudioContext is available in web
    _wavCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: _wavSR });
    _wavSource = _wavCtx.createMediaStreamSource(_wavStream);
    _wavProcessor = _wavCtx.createScriptProcessor(4096, 1, 1);
    _wavProcessor.onaudioprocess = (e) => {
      _wavChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    _wavSource.connect(_wavProcessor);
    _wavProcessor.connect(_wavCtx.destination);
  } catch (e) {
    console.warn("[ptt] getUserMedia failed", e);
    throw e;
  }
}

async function webStopRecording(): Promise<{ base64: string; mimeType: string }> {
  _wavSource?.disconnect();
  _wavProcessor?.disconnect();
  _wavStream?.getTracks().forEach((t) => t.stop());
  _wavCtx?.close().catch(() => {});

  // Merge all captured PCM chunks
  const total = _wavChunks.reduce((a, c) => a + c.length, 0);
  const merged = new Float32Array(total);
  let off = 0;
  for (const c of _wavChunks) { merged.set(c, off); off += c.length; }

  const wavBuf = _encodeWAV(merged, _wavSR);

  // base64-encode in chunks to avoid stack overflow on large audio
  const u8 = new Uint8Array(wavBuf);
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < u8.length; i += CHUNK) {
    binary += String.fromCharCode(...(u8.subarray(i, i + CHUNK) as unknown as number[]));
  }
  const base64 = btoa(binary);

  _wavCtx = null; _wavStream = null; _wavProcessor = null; _wavSource = null; _wavChunks = [];

  return { base64, mimeType: "audio/wav" };
}

// ── Main Chat screen ────────────────────────────────────────────────────────
export default function Chat() {
  const c = useColors();
  const t = useT();
  const lang = useLang();
  const { profile, saveProgress, addPoints } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [tooShort, setTooShort] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [adamPose, setAdamPose] = useState<CharacterPose>("normal");
  const [childMemory, setChildMemory] = useState<ChildMemory>(defaultChildMemory);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [showHighFive, setShowHighFive] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const recStartTime = useRef<number>(0);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pttScale = useRef(new Animated.Value(1)).current;
  const highFiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Device STT (Apple/Google on-device, free) — native only
  const deviceSttActive = useRef(false);
  const sendRef = useRef<((text: string) => Promise<void>) | null>(null);


  useEffect(() => {
    (async () => {
      const saved = await getJSON<ChatMessage[]>(STORAGE_KEYS.chatHistory);
      if (saved && Array.isArray(saved) && saved.length > 0) setMessages(saved);
      setHistoryLoaded(true);
      // Load child memory profile
      const mem = await getJSON<ChildMemory>(STORAGE_KEYS.childMemory);
      if (mem) setChildMemory(mem);
    })();
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    setJSON(STORAGE_KEYS.chatHistory, messages).catch(() => {});
  }, [messages, historyLoaded]);

  // Clear suggestions when chat is cleared
  useEffect(() => {
    if (historyLoaded && messages.length === 0) {
      setSuggestions([]);
    }
  }, [historyLoaded, messages.length]);

  // Auto-play a short greeting when entering chat with no prior messages
  const greetedRef = useRef(false);
  useEffect(() => {
    if (!historyLoaded || messages.length > 0 || greetedRef.current) return;
    greetedRef.current = true;
    const name = profile?.childName ?? "";
    const heroN = profile?.hero === "girl" ? "Sara" : "Adam";
    const greeting = lang === "ar"
      ? `مرحباً ${name}! أنا ${heroN}. كيف أقدر أساعدك اليوم؟`
      : `Hey ${name}! I'm ${heroN}. What can I help you with today?`;
    const timer = setTimeout(() => {
      speak(greeting, profile?.hero === "girl" ? "nova" : "echo", 1.0, undefined, profile?.ageGroup).catch(() => {});
    }, 700);
    return () => clearTimeout(timer);
  }, [historyLoaded, messages.length]);

  // Stop ALL audio the instant the screen loses focus (tab switch, back, any navigation).
  // useFocusEffect fires on every blur — useEffect cleanup only fires on unmount,
  // which never happens for tab screens in React Native.
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopAudio();
        _clearRecTimers();
        setIsRecording(false);
        setRecSeconds(0);
        setTranscribing(false);
        // Also kill any active recording so mic releases immediately
        if (Platform.OS !== "web" && _nativeRec) {
          try { _nativeRec.stop(); } catch { /* ignore */ }
          _nativeRec = null;
        }
        if (Platform.OS === "web") {
          try {
            _wavStream?.getTracks().forEach((t) => t.stop());
            _wavProcessor?.disconnect();
            _wavSource?.disconnect();
            _wavCtx?.close();
          } catch { /* ignore */ }
          _wavStream = null; _wavProcessor = null; _wavSource = null; _wavCtx = null; _wavChunks = [];
        }
      };
    }, [])
  );

  // Request mic permission on native at startup — eagerly, no tutorial gate
  useEffect(() => {
    if (Platform.OS !== "web") {
      (async () => {
        try {
          const { AudioModule } = await import("expo-audio");
          await AudioModule.requestRecordingPermissionsAsync();
          await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        } catch { /* ignore */ }
      })();
    } else if (typeof window !== "undefined" && navigator?.mediaDevices) {
      // Web: pre-warm the mic permission so it's ready immediately on first use
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => { stream.getTracks().forEach((t) => t.stop()); })
        .catch(() => { /* user may deny later — handled in startRec */ });
    }
  }, []);

  // ── Live recording timer via useEffect (avoids double-interval bugs) ────────
  useEffect(() => {
    if (!isRecording) {
      setRecSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const voice = profile?.hero === "girl" ? "nova" : "echo";
  const heroName = profile?.hero === "girl" ? "Sara" : "Adam";


  const send = useCallback(async (text: string, imageBase64?: string) => {
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
      const { reply, safetyAlert, suggestions: newSuggestions, highFive } = await chatSend({
        language: lang,
        childName: profile?.childName ?? "hero",
        heroName,
        ageGroup: (profile?.ageGroup ?? "7-9") as any,
        history: newHistory,
        childMemory,
        gender: profile?.hero ?? "boy",
      });

      // Update child memory with recent topic
      const userText = userMsg.text.toLowerCase();
      const topicHints: Record<string, string[]> = {
        "math": ["math","number","add","subtract","multiply","divide","fraction","equation","رياضيات","جمع","طرح","ضرب","قسمة"],
        "science": ["science","biology","chemistry","physics","planet","space","علوم","فيزياء","كيمياء","فضاء"],
        "english": ["english","grammar","sentence","word","verb","noun","إنجليزي","grammar","جملة"],
        "arabic": ["arabic","عربي","نحو","صرف","قراءة"],
        "history": ["history","تاريخ"],
        "geography": ["geography","جغرافيا"],
      };
      let detectedTopic: string | null = null;
      for (const [topic, keywords] of Object.entries(topicHints)) {
        if (keywords.some(k => userText.includes(k))) { detectedTopic = topic; break; }
      }
      if (detectedTopic) {
        setChildMemory(prev => {
          const updated = {
            ...prev,
            recentTopics: [...(prev.recentTopics ?? []).filter(t => t !== detectedTopic).slice(-4), detectedTopic!],
            lastUpdated: new Date().toISOString(),
          };
          setJSON(STORAGE_KEYS.childMemory, updated).catch(() => {});
          return updated;
        });
      }

      // Save safety alerts silently to AsyncStorage for parent review
      if (safetyAlert && userMsg.text) {
        const newAlert: SafetyAlert = {
          ts: new Date().toISOString(),
          message: userMsg.text,
          alertType: safetyAlert,
        };
        const prev = await getJSON<SafetyAlert[]>(STORAGE_KEYS.safetyAlerts);
        await setJSON(STORAGE_KEYS.safetyAlerts, [...(prev ?? []).slice(-49), newAlert]);
      }

      // Update suggestions
      setSuggestions(newSuggestions ?? []);

      // High Five sticker
      if (highFive) {
        setShowHighFive(true);
        if (highFiveTimer.current) clearTimeout(highFiveTimer.current);
        highFiveTimer.current = setTimeout(() => setShowHighFive(false), 3500);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      }

      Keyboard.dismiss();
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      setAdamPose("talking");
      speak(reply, voice, 1.0, undefined, profile?.ageGroup)
        .then(() => {
          setAdamPose("happy");
          setTimeout(() => setAdamPose("normal"), 1800);
        })
        .catch(() => {
          setAdamPose("happy");
          setTimeout(() => setAdamPose("normal"), 1800);
        });
      saveProgress((p) => ({
        ...p,
        chatSessions: p.chatSessions + 1,
        weekly: p.weekly.map((v, i) => (i === new Date().getDay() ? v + 1 : v)),
      }));
      addPoints(10);
    } catch {
      setAdamPose("normal");
      setMessages((m) => [...m, { role: "assistant", text: lang === "ar" ? "في مشكلة بالاتصال 😢 جرب مرة ثانية" : "Connection issue 😢 try again" }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages, lang, profile, saveProgress, voice, heroName]);

  // Keep sendRef current so device STT event handlers can call send()
  useEffect(() => { sendRef.current = send; }, [send]);

  // ── Device STT event handlers (native only, Apple/Google on-device — free) ──
  useSpeechRecognitionEvent("result", (event) => {
    if (!deviceSttActive.current) return;
    const transcript = event.results[0]?.transcript ?? "";
    if (event.isFinal && transcript.trim()) {
      deviceSttActive.current = false;
      setTranscribing(false);
      setIsRecording(false);
      sendRef.current?.(transcript.trim());
    }
  });
  useSpeechRecognitionEvent("error", () => {
    if (!deviceSttActive.current) return;
    deviceSttActive.current = false;
    setTranscribing(false);
    setIsRecording(false);
    setAdamPose("normal");
    setMicError("⚠️ Couldn't understand, try again");
    setTimeout(() => setMicError(null), 3000);
  });
  useSpeechRecognitionEvent("end", () => {
    if (!deviceSttActive.current) return;
    // No result came back before recognition ended
    deviceSttActive.current = false;
    setTranscribing(false);
    setIsRecording(false);
    setAdamPose("normal");
    setTooShort(true);
    setTimeout(() => setTooShort(false), 2500);
  });

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: false, quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ base64: false, quality: 1, mediaTypes: "images" });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset?.uri) return;
    try {
      // Compress: resize to max 800px longest side, 60% JPEG quality
      const w = asset.width ?? 1200;
      const h = asset.height ?? 1200;
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        scale < 1 ? [{ resize: { width: Math.round(w * scale), height: Math.round(h * scale) } }] : [],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (compressed.base64) setPendingImage(compressed.base64);
    } catch {
      // Fallback: try reading the original file as base64
      if (asset.base64) {
        setPendingImage(asset.base64);
      }
    }
  };

  const _clearRecTimers = () => {
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  };

  const startRec = async () => {
    setMicError(null);
    setTooShort(false);
    setAdamPose("excited");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    recStartTime.current = Date.now();
    setRecSeconds(0);
    Animated.spring(pttScale, { toValue: 0.88, useNativeDriver: false, tension: 200 }).start();

    try {
      if (Platform.OS === "web") {
        await webStartRecording();
      } else {
        // Try device STT first — free (Apple on iOS, Google on Android)
        const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
        if (available) {
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
          deviceSttActive.current = true;
          ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: false, continuous: false });
        } else {
          // Fallback: record audio and send to Whisper on server
          await nativeStartRecording();
        }
      }
      setIsRecording(true);

      // Auto-stop after 20 seconds (kids ask short questions)
      autoStopRef.current = setTimeout(() => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }
        stopRec();
      }, 20000);

    } catch (e: any) {
      _clearRecTimers();
      const denied = e?.name === "NotAllowedError" || e?.message?.includes("permission") || e?.message?.includes("denied");
      setMicError(denied
        ? "📵 Please allow microphone access in Settings"
        : "⚠️ Mic failed, try again");
      setAdamPose("normal");
      setTimeout(() => setMicError(null), 4000);
    }
  };

  const stopRec = async () => {
    _clearRecTimers();
    Animated.spring(pttScale, { toValue: 1, useNativeDriver: false, tension: 200 }).start();
    const duration = Date.now() - recStartTime.current;
    setRecSeconds(0);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Device STT path — stop and wait for result/end events
    if (deviceSttActive.current) {
      setIsRecording(false);
      setTranscribing(true);
      setAdamPose("thinking");
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    setIsRecording(false);

    // Need at least 1.2 seconds of audio for reliable transcription
    if (duration < 1200) {
      setTooShort(true);
      setTimeout(() => setTooShort(false), 3000);
      if (Platform.OS !== "web" && _nativeRec) {
        try { await _nativeRec.stop(); } catch { /* ignore */ }
        _nativeRec = null;
      }
      if (Platform.OS === "web") {
        try { _wavStream?.getTracks().forEach((t) => t.stop()); _wavProcessor?.disconnect(); _wavSource?.disconnect(); _wavCtx?.close(); } catch { /* ignore */ }
        _wavStream = null; _wavProcessor = null; _wavSource = null; _wavCtx = null; _wavChunks = [];
      }
      return;
    }

    try {
      setTranscribing(true);
      setAdamPose("thinking");
      const { base64, mimeType } = Platform.OS === "web"
        ? await webStopRecording()
        : await nativeStopRecording();

      if (!base64) {
        setTooShort(true);
        setTranscribing(false);
        setTimeout(() => setTooShort(false), 2200);
        return;
      }

      const { text } = await transcribe({ audioBase64: base64, mimeType, language: lang });
      setTranscribing(false);
      if (text?.trim()) {
        await send(text);
      } else {
        setTooShort(true);
        setAdamPose("normal");
        setTimeout(() => setTooShort(false), 2500);
      }
    } catch (e) {
      setTranscribing(false);
      setBusy(false);
      setAdamPose("normal");
      setMicError("⚠️ Couldn't understand audio, please try again");
      setTimeout(() => setMicError(null), 3500);
    }
  };

  const { height: screenH } = useWindowDimensions();
  const charSize = Math.min(Math.max(screenH * 0.11, 80), 95);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>

      {/* Top bar: name + controls */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "900", color: c.text, fontSize: 18 }}>{heroName}</Text>
          <Text style={{ color: "#22C55E", fontSize: 12, fontWeight: "700" }}>
            ● {lang === "ar" ? "متصل" : "Online"}
          </Text>
        </View>
        <SoundToggle />
        <Pressable
          onPress={() => setMessages([])}
          style={({ pressed }) => ({ paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: c.muted, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: c.text, fontWeight: "700", fontSize: 12 }}>{t("newChat")}</Text>
        </Pressable>
      </View>

      {/* ── CHARACTER STAGE ─────────────────────────────── */}
      <LinearGradient
        colors={
          profile?.hero === "girl"
            ? ["#FDF2F8", "#FCE7F3", "#F3E8FF"]
            : ["#EFF6FF", "#DBEAFE", "#EDE9FE"]
        }
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          height: charSize + 20,
          overflow: "visible",
          paddingBottom: 0,
          borderRadius: 24,
          marginHorizontal: 12,
          marginBottom: 6,
          position: "relative",
        }}
      >
        {/* Recording pulse ring behind character */}
        {isRecording && (
          <View style={{ position: "absolute", bottom: 10, alignItems: "center", justifyContent: "center" }}>
            <PulseRing active />
          </View>
        )}

        <AdamCharacter
          hero={profile?.hero}
          size={charSize}
          pose={adamPose}
          style={{ marginBottom: -10 }}
        />

        {/* Pose label badge */}
        <View style={{
          position: "absolute", top: 10, left: 14,
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
        }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: c.text }}>
            {transcribing ? "⏳ Transcribing..." :
             busy ? "💭 Thinking..." :
             isRecording ? "🎤 Listening..." :
             adamPose === "happy" ? "😊 Happy!" :
             adamPose === "excited" ? "🎉 Excited!" :
             "💚 Ready"}
          </Text>
        </View>

        {/* Recording indicator — shows live timer */}
        {isRecording && (
          <View style={{ position: "absolute", top: 10, right: 14, flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: "rgba(0,0,0,0.70)", borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#EF4444" }} />
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 12 }}>
              {`0:${recSeconds < 10 ? "0" : ""}${recSeconds}`}
            </Text>
          </View>
        )}
      </LinearGradient>
      {/* ──────────────────────────────────────────────── */}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        {/* High Five Sticker Overlay */}
        <HighFiveSticker visible={showHighFive} onDismiss={() => setShowHighFive(false)} />

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 20 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Emoji opening when no messages */}
          {messages.length === 0 && historyLoaded && !busy && (
            <EmojiOpening
              lang={lang}
              heroName={heroName}
              hero={profile?.hero}
              onTap={(text) => send(text)}
            />
          )}

          {messages.map((m, i) => {
            const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
            return (
              <View key={i}>
                <View style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "86%" }}>
                  {m.imageBase64 && (
                    <Image source={{ uri: `data:image/jpeg;base64,${m.imageBase64}` }} style={{ width: 180, height: 180, borderRadius: 14, marginBottom: 6 }} resizeMode="cover" />
                  )}
                  <LinearGradient
                    colors={m.role === "user" ? [c.primary, "#FFA76A"] : [c.card, c.card]}
                    style={{ padding: 14, borderRadius: 18, borderTopLeftRadius: m.role === "user" ? 18 : 4, borderTopRightRadius: m.role === "user" ? 4 : 18 }}
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
                {/* Suggestion buttons after last AI message */}
                {isLastAssistant && !busy && suggestions.length > 0 && (
                  <SuggestionButtons
                    suggestions={suggestions}
                    onTap={(text) => { setSuggestions([]); send(text); }}
                  />
                )}
              </View>
            );
          })}

          {busy && <TypingBubble lang={lang} />}

          {tooShort && (
            <View style={{ alignSelf: "flex-start", backgroundColor: "#FEF3C7", borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🎤</Text>
              <View>
                <Text style={{ color: "#92400E", fontWeight: "800", fontSize: 14 }}>Hold a bit longer!</Text>
                <Text style={{ color: "#92400E", fontSize: 12, marginTop: 2 }}>Keep holding while you speak</Text>
              </View>
            </View>
          )}

          {micError && (
            <View style={{ alignSelf: "flex-start", backgroundColor: "#FEE2E2", borderRadius: 16, padding: 12 }}>
              <Text style={{ color: "#991B1B", fontWeight: "700" }}>{micError}</Text>
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
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 24 : 12, backgroundColor: c.card, borderTopColor: c.border, borderTopWidth: 1, gap: 8 }}>
          {/* Text input */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t("typeMessage")}
              placeholderTextColor={c.mutedForeground}
              multiline
              style={{ flex: 1, backgroundColor: c.muted, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, maxHeight: 100, color: c.text, fontSize: 15, textAlign: lang === "ar" ? "right" : "left" }}
            />
            {(input.trim() || pendingImage) && (
              <Pressable onPress={() => send(input, pendingImage ?? undefined)} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
                <Ionicons name="send" size={20} color="#FFF" />
              </Pressable>
            )}
          </View>

          {/* Camera + PTT row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
            {/* Camera buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => pickImage(true)} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: c.muted, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
                <Ionicons name="camera" size={22} color={c.text} />
              </Pressable>
              <Pressable onPress={() => pickImage(false)} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: c.muted, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
                <Ionicons name="image" size={22} color={c.text} />
              </Pressable>
            </View>

            {/* Big PTT button */}
            <View style={{ alignItems: "center", gap: 4 }}>
              {isRecording && <Waveform active />}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <PulseRing active={isRecording} />
                <Animated.View style={{ transform: [{ scale: pttScale }] }}>
                  <Pressable
                    onPressIn={startRec}
                    onPressOut={stopRec}
                    disabled={transcribing || busy}
                    style={{
                      width: 88, height: 88, borderRadius: 44,
                      backgroundColor: transcribing || busy ? "#9CA3AF" : isRecording ? "#EF4444" : "#FF6B35",
                      alignItems: "center", justifyContent: "center",
                      shadowColor: isRecording ? "#EF4444" : "#FF6B35",
                      shadowOpacity: transcribing || busy ? 0.2 : 0.55,
                      shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
                      elevation: 8,
                    }}
                  >
                    {transcribing ? (
                      <Text style={{ fontSize: 26 }}>⏳</Text>
                    ) : (
                      <Ionicons name={isRecording ? "stop" : "mic"} size={36} color="#FFF" />
                    )}
                  </Pressable>
                </Animated.View>
              </View>
              {/* Label below button */}
              {transcribing ? (
                <Text style={{ color: "#6B7280", fontWeight: "700", fontSize: 11 }}>Transcribing...</Text>
              ) : isRecording ? (
                <Text style={{ color: "#EF4444", fontWeight: "800", fontSize: 13 }}>
                  {`0:${recSeconds < 10 ? "0" : ""}${recSeconds}  Release to send`}
                </Text>
              ) : (
                <Text style={{ color: c.mutedForeground, fontWeight: "700", fontSize: 11 }}>
                  Hold to talk 🎤
                </Text>
              )}
            </View>

            {/* Balance spacer */}
            <View style={{ width: 44 + 10 + 44 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
