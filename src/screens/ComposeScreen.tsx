import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * ComposeScreen — Placeholder for the email composition view.
 * Will be fully implemented in Phase 2.
 */
export default function ComposeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compose</Text>
      <Text style={styles.subtitle}>Email composition will be available here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
  },
});
