import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { validateServerUrl, setStoredBaseUrl } from "../config/baseUrl";
import { useAppConfigStore } from "../stores/appConfigStore";

/**
 * ServerSetupScreen — Shown when no Mailflare server URL is configured.
 * Prompts the user to enter their self-hosted Mailflare instance URL.
 */
export default function ServerSetupScreen() {
  const [url, setUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setServerUrl } = useAppConfigStore();

  const handleConnect = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter your Mailflare server URL");
      return;
    }

    // Ensure URL has a protocol
    let fullUrl = trimmed;
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      fullUrl = `https://${fullUrl}`;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateServerUrl(fullUrl);
      if (!isValid) {
        setError("Could not connect to this server. Please check the URL and try again.");
        return;
      }

      await setStoredBaseUrl(fullUrl);
      setServerUrl(fullUrl);
    } catch {
      setError("Connection failed. Please check the URL and try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Mailflare</Text>
        <Text style={styles.subtitle}>
          Enter the URL of your Mailflare server to get started.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://mail.example.com"
          placeholderTextColor="#666"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
          editable={!isValidating}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isValidating && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2a2a3a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  error: {
    color: "#f43f5e",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
