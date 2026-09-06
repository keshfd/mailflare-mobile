import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
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

// Screens
import ServerSetupScreen from "./src/screens/ServerSetupScreen";
import LoginScreen from "./src/screens/LoginScreen";
import InboxScreen from "./src/screens/InboxScreen";
import MessageDetailScreen from "./src/screens/MessageDetailScreen";
import ComposeScreen from "./src/screens/ComposeScreen";

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainNavigator() {
  return (
    <NavigationContainer>
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
  usePushNotifications();

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

  // Phase 3: Authenticated → show main navigation stack
  return <MainNavigator />;
}

/**
 * Root App component with providers.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AppContent />
        </QueryClientProvider>
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
