import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorBoundary } from "react-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  type NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAppConfigStore } from "./src/stores/appConfigStore";
import { useAuthStore } from "./src/stores/authStore";
import { resolveBaseUrl, getEnvBaseUrl } from "./src/config/baseUrl";
import { useAuth } from "./src/hooks/useAuth";
import {
  usePushNotifications,
  registerDevicePushPipeline,
} from "./src/hooks/usePushNotifications";
import type { RootStackParamList } from "./src/types";

// Components & Resilience Fallbacks
import { ErrorBoundaryFallback, ToastContainer } from "./src/components";

// Screens
import ServerSetupScreen from "./src/screens/ServerSetupScreen";
import LoginScreen from "./src/screens/LoginScreen";
import InboxScreen from "./src/screens/InboxScreen";
import MessageDetailScreen from "./src/screens/MessageDetailScreen";
import ComposeScreen from "./src/screens/ComposeScreen";

// Create offline cache persister using AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "MAILFLARE_OFFLINE_CACHE",
  throttleTime: 1000,
});

// Configure QueryClient with 24-hour offline cache retention and offlineFirst networkMode
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
      gcTime: 24 * 60 * 60 * 1000, // 24 hours offline cache retention
      networkMode: "offlineFirst",
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * MainNavigator receives the navigation container ref from AppContent so
 * that the push notification hook can deep-link into screens — even on
 * cold start when the navigation tree isn't mounted yet.
 */
function MainNavigator({
  navigationRef,
  onNavigationReady,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
  onNavigationReady: () => void;
}) {
  return (
    <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
      <Stack.Navigator
        initialRouteName="Inbox"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#0a0a0f" },
        }}
      >
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
        <Stack.Screen
          name="Compose"
          component={ComposeScreen}
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * AppContent — The main app shell that handles the three-phase flow:
 * 1. Server Setup (if no URL configured)
 * 2. Authentication (if not logged in)
 * 3. Main App (authenticated navigation stack)
 */
function AppContent() {
  const {
    serverUrl,
    isInitialized,
    setServerUrl,
    setUrlLocked,
    setInitialized,
  } = useAppConfigStore();

  const { user, isChecked } = useAuthStore();
  const { checkExistingSession } = useAuth();

  // Navigation ref shared with usePushNotifications for deep linking
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  // Pass the navigation ref to the push hook so it can deep-link on tap
  const pushState = usePushNotifications(navigationRef);
  const onNavigationReady = (
    pushState as ReturnType<typeof usePushNotifications> & {
      onNavigationReady: () => void;
    }
  ).onNavigationReady;

  // Phase 1: Resolve the server URL on startup
  useEffect(() => {
    async function init() {
      const envUrl = getEnvBaseUrl();
      if (envUrl) {
        setServerUrl(envUrl);
        setUrlLocked(true);
      } else {
        const storedUrl = await resolveBaseUrl();
        if (storedUrl) {
          setServerUrl(storedUrl);
        }
      }
      setInitialized();
    }
    init();
  }, [setServerUrl, setUrlLocked, setInitialized]);

  // Phase 2: Check existing session once server URL is available
  useEffect(() => {
    if (isInitialized && serverUrl && !isChecked) {
      checkExistingSession();
    }
  }, [isInitialized, serverUrl, isChecked, checkExistingSession]);

  // Push notification sync on restored or active session
  useEffect(() => {
    if (user && serverUrl) {
      registerDevicePushPipeline().catch((err) => {
        console.warn("Push token sync failed:", err);
      });
    }
  }, [user, serverUrl]);

  // Loading state while initializing
  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Phase 1: No server URL → show ServerSetup
  if (!serverUrl) {
    return <ServerSetupScreen />;
  }

  // Loading state while checking session
  if (!isChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Phase 2: Not authenticated → show Login
  if (!user) {
    return <LoginScreen />;
  }

  // Phase 3: Authenticated → show main navigation stack wrapped in ErrorBoundary
  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <MainNavigator
        navigationRef={navigationRef}
        onNavigationReady={onNavigationReady}
      />
    </ErrorBoundary>
  );
}

/**
 * Root App component with resilience, offline persister, error boundary, and toast notifications.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              maxAge: 24 * 60 * 60 * 1000, // 24 hours
            }}
          >
            <StatusBar style="light" />
            <AppContent />
            <ToastContainer />
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  loading: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
    alignItems: "center",
  },
});
