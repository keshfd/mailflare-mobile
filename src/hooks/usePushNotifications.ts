import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import type { NavigationContainerRef } from "@react-navigation/native";
import apiClient from "../api/client";
import {
  storePushToken,
  getStoredPushToken,
  clearStoredPushToken,
} from "../utils/tokenStorage";
import { incrementBadge } from "../utils/badgeSync";
import type {
  DeviceRegisterRequest,
  DeviceRevokeRequest,
  SuccessResponse,
  RootStackParamList,
} from "../types";

/**
 * Configure notification behavior when app is in foreground.
 * Alerts are shown so the user sees the notification even while
 * actively using the app.
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

// Android notification channel for email notifications
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("email", {
    name: "New Emails",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3B82F6",
    sound: "default",
    description: "Notifications for new incoming emails",
  });
}

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

    // Android-specific default notification channel
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

/**
 * Core push notification hook that handles:
 * 1. Foreground notification display + TanStack Query invalidation
 * 2. Background/killed notification tap → deep link to MessageDetail
 * 3. Cold-start deep linking with navigation-ready guard
 * 4. Badge count increment on foreground push
 *
 * @param navigationRef - Ref to the NavigationContainer, used for deep linking.
 *   Must be provided from App.tsx so the hook can safely navigate even during
 *   cold start (waits for `isReady` before dispatching).
 */
export function usePushNotifications(
  navigationRef?: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  /** Whether the navigation tree is fully mounted and ready for dispatch. */
  const isNavigationReady = useRef(false);

  /**
   * Pending deep link: if a notification tap arrives before the navigation
   * tree is mounted (cold start), we queue the messageId here and dispatch
   * it as soon as the navigator reports ready.
   */
  const pendingDeepLink = useRef<string | null>(null);

  const isSupported = Device.isDevice;

  // Access the query client for cache invalidation on foreground push
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient();
  } catch {
    // Outside QueryClientProvider — no invalidation available
  }

  // Check stored push token on mount
  useEffect(() => {
    getStoredPushToken().then((stored) => {
      if (stored) {
        setExpoPushToken(stored);
      }
    });
  }, []);

  /**
   * Navigate to MessageDetail if the navigation ref is ready.
   * If not ready (cold start), store the messageId and dispatch later.
   */
  const navigateToMessage = useCallback(
    (messageId: string) => {
      if (!navigationRef?.current) {
        // Navigation container not yet available — queue for later
        pendingDeepLink.current = messageId;
        return;
      }

      if (!isNavigationReady.current) {
        // Nav ref exists but tree not fully mounted — queue for later
        pendingDeepLink.current = messageId;
        return;
      }

      // Navigation is ready — dispatch immediately
      try {
        navigationRef.current.navigate("MessageDetail", { messageId });
      } catch (error) {
        console.warn("Deep link navigation failed, falling back to Inbox:", error);
        try {
          navigationRef.current.navigate("Inbox", undefined);
        } catch {
          // Navigation completely unavailable — silently fail
        }
      }
    },
    [navigationRef],
  );

  /**
   * Called by App.tsx when NavigationContainer's `onReady` fires.
   * Flushes any pending deep link that arrived before the navigator was mounted.
   */
  const onNavigationReady = useCallback(() => {
    isNavigationReady.current = true;

    if (pendingDeepLink.current && navigationRef?.current) {
      const messageId = pendingDeepLink.current;
      pendingDeepLink.current = null;

      try {
        navigationRef.current.navigate("MessageDetail", { messageId });
      } catch (error) {
        console.warn("Cold-start deep link failed:", error);
        try {
          navigationRef.current.navigate("Inbox", undefined);
        } catch {
          // Swallow
        }
      }
    }
  }, [navigationRef]);

  // ── Notification listeners ──────────────────────────────────────────────

  useEffect(() => {
    // Foreground: notification received while app is active
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);

        // Invalidate message queries so the inbox updates live
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["messages", "counts"] });
        }

        // Increment the OS badge for the new email
        incrementBadge().catch(() => {});
      });

    // Background/Killed: user tapped the notification in the OS tray
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | { messageId?: string; mailboxId?: string; type?: string }
          | undefined;

        if (data?.messageId && typeof data.messageId === "string") {
          navigateToMessage(data.messageId);
        } else {
          // Fallback: no valid messageId → go to Inbox
          if (navigationRef?.current && isNavigationReady.current) {
            try {
              navigationRef.current.navigate("Inbox", undefined);
            } catch {
              // Swallow
            }
          }
        }

        // Invalidate queries to refresh data regardless
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["messages", "counts"] });
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [queryClient, navigateToMessage, navigationRef]);

  // ── Cold-start: check if the app was opened from a notification ─────────

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const data = response.notification.request.content.data as
        | { messageId?: string }
        | undefined;

      if (data?.messageId && typeof data.messageId === "string") {
        navigateToMessage(data.messageId);
      }
    });
  }, [navigateToMessage]);

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

  return {
    expoPushToken,
    notification,
    isSupported,
    hasPermission,
    registerForPushNotifications,
    revokeCurrentToken,
    // Expose onNavigationReady so App.tsx can call it from onReady
    onNavigationReady,
  } as PushNotificationState & { onNavigationReady: () => void };
}
