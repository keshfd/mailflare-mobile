import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAppConfigStore } from "./src/stores/appConfigStore";
import { useAuthStore } from "./src/stores/authStore";
import { resolveBaseUrl, isBaseUrlLocked, getEnvBaseUrl } from "./src/config/baseUrl";
import { getSessionToken } from "./src/utils/tokenStorage";
import { useAuth } from "./src/hooks/useAuth";

// Screens
import ServerSetupScreen from "./src/screens/ServerSetupScreen";
import LoginScreen from "./src/screens/LoginScreen";
import InboxScreen from "./src/screens/InboxScreen";

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

/**
 * AppContent — The main app shell that handles the three-phase flow:
 * 1. Server Setup (if no URL configured)
 * 2. Authentication (if not logged in)
 * 3. Main App (authenticated)
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

  // Phase 3: Authenticated → show main app
  return <InboxScreen />;
}

/**
 * Root App component with providers.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.root}>
        <StatusBar style="light" />
        <AppContent />
      </View>
    </QueryClientProvider>
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
