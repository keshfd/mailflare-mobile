import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

/**
 * Custom hook for managing push notifications via Expo.
 *
 * Handles:
 * - Permission request
 * - Push token registration
 * - Foreground notification handling
 * - Notification response (tap) handling
 */

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  /** The Expo push token (null if not registered) */
  expoPushToken: string | null;

  /** The last received notification */
  notification: Notifications.Notification | null;

  /** Whether push notifications are supported on this device */
  isSupported: boolean;

  /** Whether permissions have been granted */
  hasPermission: boolean;

  /** Register for push notifications */
  registerForPushNotifications: () => Promise<string | null>;
}

export function usePushNotifications(): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const isSupported = Device.isDevice;

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      setHasPermission(false);
      return null;
    }

    setHasPermission(true);

    // Get the Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenResponse.data;
      setExpoPushToken(token);

      // Android-specific notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3B82F6",
        });
      }

      return token;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
      });

    // Listen for notification interactions (taps)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // The notification data can be used for navigation
        const data = response.notification.request.content.data;
        // TODO: Navigate to the relevant screen based on data.messageId, etc.
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
  };
}
