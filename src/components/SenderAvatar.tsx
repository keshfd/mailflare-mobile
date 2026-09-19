import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Deterministic color palette for sender avatars.
 * Each color is carefully chosen for legibility against white text on dark backgrounds.
 */
const AVATAR_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#dc2626", // red
  "#ea580c", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0891b2", // cyan
  "#6366f1", // indigo
  "#a855f7", // purple
  "#e11d48", // rose
];

/**
 * Simple hash function to map a string to a consistent index.
 */
function stringToColorIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

export interface SenderAvatarProps {
  name: string;
  size?: number;
}

/**
 * SenderAvatar — Displays the capitalized first letter of the sender's name
 * inside a colored circle. The color is deterministically derived from the
 * sender name so that the same sender always gets the same color.
 */
export default function SenderAvatar({ name, size = 40 }: SenderAvatarProps) {
  const initial = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    return trimmed.charAt(0).toUpperCase();
  }, [name]);

  const backgroundColor = useMemo(() => {
    return AVATAR_COLORS[stringToColorIndex(name)];
  }, [name]);

  const fontSize = Math.round(size * 0.42);
  const borderRadius = Math.round(size / 2);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    color: "#ffffff",
    fontWeight: "700",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
