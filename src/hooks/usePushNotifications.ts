import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import apiClient from "../api/client";
import {
  storePushToken,
  getStoredPushToken,
  clearStoredPushToken,
} from "../utils/tokenStorage";
import type {
  DeviceRegisterRequest,
  DeviceRevokeRequest,
  SuccessResponse,
} from "../types";

/**
 * Configure notification behavior when app is in foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Retrieve device Expo push token from Expo/APNs/FCM.
 */
export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } })?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;

    // Android-specific notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
      });
    }

    await storePushToken(token);
    return token;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

/**
 * Register push token with Mailflare backend.
 */
export async function registerPushTokenWithServer(
  token: string
): Promise<boolean> {
  try {
    const platform: DeviceRegisterRequest["platform"] =
      Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
        ? "android"
        : "web";

    await apiClient.post<SuccessResponse>("/api/devices/register", {
      token,
      platform,
    } satisfies DeviceRegisterRequest);
    return true;
  } catch (error) {
    console.error("Failed to register push token with server:", error);
    return false;
  }
}

/**
 * Revoke push token from Mailflare backend and remove from local storage.
 */
export async function revokePushTokenFromServer(
  token?: string
): Promise<boolean> {
  try {
    const tokenToRevoke = token || (await getStoredPushToken());
    if (!tokenToRevoke) {
      return true;
    }

    await apiClient.post<SuccessResponse>("/api/devices/revoke", {
      token: tokenToRevoke,
    } satisfies DeviceRevokeRequest);

    await clearStoredPushToken();
    return true;
  } catch (error) {
    console.error("Failed to revoke push token from server:", error);
    await clearStoredPushToken();
    return false;
  }
}

/**
 * Full registration pipeline: request permission -> obtain push token -> save locally -> register on server.
 */
export async function registerDevicePushPipeline(): Promise<string | null> {
  const token = await getDevicePushToken();
  if (token) {
    await registerPushTokenWithServer(token);
  }
  return token;
}

export interface PushNotificationState {
  /** The Expo push token (null if not registered) */
  expoPushToken: string | null;

  /** The last received notification */
  notification: Notifications.Notification | null;

  /** Whether push notifications are supported on this device */
  isSupported: boolean;

  /** Whether permissions have been granted */
  hasPermission: boolean;

  /** Register for push notifications and sync with backend */
  registerForPushNotifications: () => Promise<string | null>;

  /** Revoke push token from server and clear locally */
  revokeCurrentToken: () => Promise<boolean>;
}

export function usePushNotifications(): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const isSupported = Device.isDevice;

  // Check stored push token on mount
  useEffect(() => {
    getStoredPushToken().then((stored) => {
      if (stored) {
        setExpoPushToken(stored);
      }
    });
  }, []);

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    const token = await registerDevicePushPipeline();
    if (token) {
      setExpoPushToken(token);
      setHasPermission(true);
    } else {
      setHasPermission(false);
    }
    return token;
  }, []);

  const revokeCurrentToken = useCallback(async (): Promise<boolean> => {
    const success = await revokePushTokenFromServer(expoPushToken ?? undefined);
    setExpoPushToken(null);
    return success;
  }, [expoPushToken]);

  useEffect(() => {
    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
      });

    // Listen for notification interactions (taps)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    isSupported,
    hasPermission,
    registerForPushNotifications,
    revokeCurrentToken,
  };
}
