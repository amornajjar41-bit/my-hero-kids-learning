import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";
import { ensureApiBaseUrl } from "@/lib/api";

SplashScreen.preventAutoHideAsync();

ensureApiBaseUrl();

// Lock LTR for now: forcing RTL requires app reload on native; we handle
// per-screen RTL alignment in components using the active language.
if (Platform.OS !== "web") {
  try {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  } catch {
    // ignore
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="parent/index" options={{ presentation: "card" }} />
      <Stack.Screen name="parent/controls" />
      <Stack.Screen name="parent/upgrade" options={{ presentation: "modal" }} />
      <Stack.Screen name="parent/why-adam" />
      <Stack.Screen name="learn/[language]" />
      <Stack.Screen name="learn/lesson/[id]" />
      <Stack.Screen name="learn/dictionary" />
      <Stack.Screen name="games/word-puzzle" />
      <Stack.Screen name="games/math-blast" />
      <Stack.Screen name="games/letter-match" />
      <Stack.Screen name="games/jigsaw" />
      <Stack.Screen name="blocked" />
      <Stack.Screen name="birthday-celebration" options={{ presentation: "modal" }} />
      <Stack.Screen name="stories/[id]" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
