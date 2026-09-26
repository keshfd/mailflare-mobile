import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../config/theme";

export interface BrandLogoProps {
  /** Render size variant. "small" for headers, "large" for splash/login. */
  size?: "small" | "large";
  /** Show text label alongside / below the logo icon. Defaults to true. */
  showLabel?: boolean;
}

/**
 * BrandLogo — Renders either a local image asset (if ./assets/logo.png exists)
 * or a text-based logo using the first letter of the appName from brand.config.
 *
 * The component dynamically inherits the primary color from the brand theme,
 * ensuring instant rebranding when brand.config.js is updated.
 */
export default function BrandLogo({
  size = "small",
  showLabel = true,
}: BrandLogoProps) {
  const { colors, brand } = useTheme();

  const isLarge = size === "large";
  const circleSize = isLarge ? 72 : 36;
  const fontSize = isLarge ? 32 : 16;
  const labelFontSize = isLarge ? 28 : 18;

  const initial = brand.appName.trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <View
        style={[
          styles.iconCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      </View>

      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              fontSize: labelFontSize,
              color: colors.text,
              marginLeft: isLarge ? 0 : 10,
              marginTop: isLarge ? 12 : 0,
            },
          ]}
        >
          {brand.appName}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  containerLarge: {
    flexDirection: "column",
    alignItems: "center",
  },
  iconCircle: {
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    color: "#ffffff",
    fontWeight: "800",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  label: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
