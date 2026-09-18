import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import type { FallbackProps } from "react-error-boundary";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Bug } from "lucide-react-native";

/**
 * ErrorBoundaryFallback
 *
 * Graceful fallback UI rendered when an uncaught React rendering or
 * component lifecycle error occurs. Prevents white-screen hard crashes
 * and gives the user an action to reset the state and resume using Mailflare.
 */
export default function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <View style={styles.content}>
        {/* Warning Icon Badge */}
        <View style={styles.iconContainer}>
          <AlertTriangle size={48} color="#f59e0b" />
        </View>

        {/* Title and Explanation */}
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.description}>
          Mailflare encountered an unexpected problem while displaying this view.
          Your emails, accounts, and session data remain secure.
        </Text>

        {/* Technical Details Toggle */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetails(!showDetails)}
          activeOpacity={0.7}
        >
          <View style={styles.detailsToggleLeft}>
            <Bug size={16} color="#94a3b8" />
            <Text style={styles.detailsToggleText}>
              {showDetails ? "Hide technical details" : "Show technical details"}
            </Text>
          </View>
          {showDetails ? (
            <ChevronUp size={16} color="#94a3b8" />
          ) : (
            <ChevronDown size={16} color="#94a3b8" />
          )}
        </TouchableOpacity>

        {/* Error Details View */}
        {showDetails && (
          <View style={styles.detailsBox}>
            <ScrollView style={styles.detailsScroll} nestedScrollEnabled>
              <Text style={styles.detailsErrorName}>
                {error instanceof Error ? error.name : "Runtime Error"}:
              </Text>
              <Text style={styles.detailsErrorMessage}>{errorMessage}</Text>
              {errorStack && (
                <Text style={styles.detailsStack}>{errorStack}</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={resetErrorBoundary}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    alignItems: "center",
    paddingHorizontal: 28,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 28,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#161822",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#26293b",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  detailsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailsToggleText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  detailsBox: {
    width: "100%",
    maxHeight: 180,
    backgroundColor: "#0f111a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#26293b",
    padding: 12,
    marginBottom: 24,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsErrorName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f87171",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  detailsErrorMessage: {
    fontSize: 12,
    color: "#e2e8f0",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  detailsStack: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
    fontFamily: "monospace",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
