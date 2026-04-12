/**
 * Push notification registration — requests permission, gets Expo push token,
 * and registers it with the backend.
 */
import { Platform } from "react-native";
import { notifications as notificationsApi } from "@/lib/api";

let _registered = false;

async function ensurePushChannel(Notifications: any): Promise<void> {
  if (Platform.OS !== "android" || !Notifications?.setNotificationChannelAsync) {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Protocol reminders",
    importance: Notifications.AndroidImportance?.HIGH ?? 4,
  });
}

export async function registerPushToken(): Promise<string | null> {
  if (_registered) return null;

  try {
    // Dynamic import so builds work even without expo-notifications installed
    // @ts-ignore — expo-notifications may not be installed
    const Notifications = await import("expo-notifications").catch(() => null) as any;
    if (!Notifications) return null;
    await ensurePushChannel(Notifications);

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Register with backend
    const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    await notificationsApi.registerPushToken({
      token,
      platform,
    });

    _registered = true;
    return token;
  } catch {
    // Push notifications not available (e.g., web without service worker, simulator)
    return null;
  }
}

export async function deregisterPushToken(): Promise<void> {
  try {
    // @ts-ignore — expo-notifications may not be installed
    const Notifications = await import("expo-notifications").catch(() => null) as any;
    if (!Notifications) return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await notificationsApi.removePushToken(tokenData.data);
    _registered = false;
  } catch {
    // Best effort
  }
}
