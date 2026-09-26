/**
 * Theme — Runtime theme context for React Native components.
 *
 * Reads brand colors from brand.config.js and provides them via React Context
 * so every component consumes the palette without hardcoded hex values.
 *
 * Usage:
 *   import { useTheme } from "../config/theme";
 *   const { colors } = useTheme();
 *   <View style={{ backgroundColor: colors.primary }} />
 */
import React, { createContext, useContext, useMemo } from "react";

// Import brand config — this is a JS file, not TS, so we type it manually
// eslint-disable-next-line @typescript-eslint/no-var-requires
const brandConfig = require("../../brand.config.js");

/** All theme color tokens available to components. */
export interface ThemeColors {
  /** Primary brand color — buttons, FABs, active tabs, accent badges */
  primary: string;
  /** Darker primary — pressed/active backgrounds */
  primaryDark: string;
  /** Lighter primary — unread dates, link text, toast actions */
  primaryLight: string;
  /** Root screen background */
  background: string;
  /** Card/header/drawer surface */
  surface: string;
  /** Slightly elevated surface — search bars, input fields */
  surfaceAlt: string;
  /** Hairlines, dividers, card outlines */
  border: string;
  /** Primary text */
  text: string;
  /** Secondary text (dates, subtitles, labels) */
  textMuted: string;
  /** Tertiary text (snippets, placeholders) */
  textDim: string;
  /** Notification badge color */
  accent: string;
  /** Destructive actions, error banners */
  error: string;
  /** Success banners, send confirmation */
  success: string;
}

export interface BrandConfig {
  appName: string;
  bundleIdentifier: string;
  slug: string;
  owner: string;
  colors: ThemeColors;
  apiBaseUrl: string;
  easProjectId: string;
}

export interface Theme {
  colors: ThemeColors;
  brand: {
    appName: string;
    bundleIdentifier: string;
    slug: string;
    apiBaseUrl: string;
  };
}

const resolvedConfig: BrandConfig = brandConfig;

const defaultTheme: Theme = {
  colors: resolvedConfig.colors,
  brand: {
    appName: resolvedConfig.appName,
    bundleIdentifier: resolvedConfig.bundleIdentifier,
    slug: resolvedConfig.slug,
    apiBaseUrl: resolvedConfig.apiBaseUrl,
  },
};

const ThemeContext = createContext<Theme>(defaultTheme);

/**
 * ThemeProvider — Wraps the app root to make the brand theme available
 * to all descendants via useTheme().
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useMemo(() => defaultTheme, []);
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * useTheme — Hook to access the current brand theme (colors & brand info).
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Direct access to theme colors for static StyleSheet definitions
 * that cannot use hooks (e.g. module-level StyleSheet.create calls).
 *
 * Prefer useTheme() inside components when possible.
 */
export const themeColors: ThemeColors = resolvedConfig.colors;

/**
 * Direct access to the app name for module-level usage.
 */
export const brandName: string = resolvedConfig.appName;
