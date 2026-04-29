/**
 * Push Notification helpers — Expo Notifications
 *
 * Layers:
 *  1. requestPermissions + registerForPushNotifications (call on first app launch)
 *  2. scheduleDailyReminder() — local notification at 17:00 and 20:00 daily
 *  3. cancelAllReminders() — called when parent disables notifications
 *
 * Token registration is sent to the API server which stores it in Supabase
 * so the backend can send targeted push notifications in the future.
 */
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

// ── How to display notifications when the app is foregrounded ─────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

// ── Warm, friendly reminder messages (rotated randomly) ───────────────────────
export const REMINDER_MESSAGES = [
  { title: "⭐ Adam is waiting!", body: "Let's learn something amazing together today!" },
  { title: "🦸 Hero time!", body: "Your hero has a new challenge for you — come see!" },
  { title: "🧠 Brain boost time!", body: "5 minutes of learning = 5 points + something awesome!" },
  { title: "🌟 Keep your streak alive!", body: "One quick lesson is all it takes. You've got this!" },
  { title: "🎮 Game challenge!", body: "Can you beat your best score today? Let's play!" },
  { title: "💫 Good morning, champion!", body: "Today is full of amazing things to discover! 🚀" },
  { title: "🌈 Something new is waiting!", body: "Open the app to find today's surprise adventure!" },
  { title: "🏆 Badge alert!", body: "You're SO close to earning your next hero badge!" },
  { title: "🔬 Did you know?", body: "There's a cool fun fact waiting just for you today!" },
  { title: "🚀 3, 2, 1... Learning time!", body: "Your hero Adam is ready and waiting for you!" },
] as const;

const BEDTIME_REMINDER = {
  title: "📚 Story time!",
  body: "Let Adam read you a magical bedtime story tonight 🌙",
} as const;

// ── Request permissions + get Expo push token ─────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // Must be a physical device (push tokens don't work on simulators)
  const isDevice = Constants.isDevice;
  if (!isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("learning-reminders", {
      name: "Learning reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF7A45",
    });
    await Notifications.setNotificationChannelAsync("story-time", {
      name: "Bedtime stories",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100],
      lightColor: "#7C3AED",
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenObj = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenObj.data;
  } catch {
    return null;
  }
}

// ── Schedule daily local reminders ────────────────────────────────────────────
export async function scheduleDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;

  // Cancel any existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Pick a random daytime message
  const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)]!;

  // 17:00 learning reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: true,
      data: { screen: "chat" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 17,
      minute: 0,
    },
  });

  // 20:00 bedtime story reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: BEDTIME_REMINDER.title,
      body: BEDTIME_REMINDER.body,
      sound: true,
      data: { screen: "stories" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

// ── Cancel all reminders (parent control) ─────────────────────────────────────
export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Send push token to server ─────────────────────────────────────────────────
export async function savePushToken(token: string, userId?: string): Promise<void> {
  try {
    const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string | undefined)
      ?? "https://myheroapp.org";
    await fetch(`${apiUrl}/api/notifications/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId, platform: Platform.OS }),
    });
  } catch {
    // Non-fatal — local reminders still work without server registration
  }
}
