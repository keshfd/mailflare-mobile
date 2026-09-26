/**
 * brand.config.js — Single Source of Truth for White-Label Branding
 *
 * Change the values below to instantly rebrand the entire application.
 * No other file needs to be edited. After modifying, rebuild with EAS or
 * restart the dev server to see changes.
 *
 * ─────────────────────────────────────────────────────────────────────
 * EXAMPLE: To create a "Blue & White" rebrand for "Troopost":
 *
 *   appName:          "Troopost"
 *   bundleIdentifier: "com.troopost.mail"
 *   colors.primary:   "#2563eb"
 *   colors.background:"#0a0a0f"
 *   apiBaseUrl:       "https://mail.troopost.com"
 * ─────────────────────────────────────────────────────────────────────
 */
module.exports = {
  /** Display name shown on the home screen, splash, and headers. */
  appName: "Mailflare",

  /** Unique bundle / package identifier for iOS and Android stores. */
  bundleIdentifier: "co.mailflare.app",

  /** Expo project slug (used in EAS and Expo Go). */
  slug: "mailflare-mobile",

  /** Expo project owner (EAS account). */
  owner: "mailflare",

  /**
   * Core color palette consumed by every UI component.
   *
   * primary     — Buttons, FABs, active tabs, accent badges
   * primaryDark — Pressed / active backgrounds (e.g. selected mailbox pill)
   * primaryLight— Soft tints (unread date, link text, toast action labels)
   * background  — Root screen background, status bar fill
   * surface     — Cards, headers, drawer panels, list items
   * surfaceAlt  — Slightly elevated surfaces (search bars, input fields, pills)
   * border      — Hairlines, dividers, card outlines
   * text        — Primary text (headings, sender names, body)
   * textMuted   — Secondary text (dates, subtitles, labels)
   * textDim     — Tertiary text (snippets, placeholders, section headings)
   * accent      — Notification badge color (defaults to primary)
   * error       — Destructive actions, error banners
   * success     — Success banners, send confirmation
   */
  colors: {
    primary: "#3b82f6",
    primaryDark: "#1e3a8a",
    primaryLight: "#60a5fa",
    background: "#0a0a0f",
    surface: "#0d0e15",
    surfaceAlt: "#161824",
    border: "#1e202e",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    textDim: "#64748b",
    accent: "#2563eb",
    error: "#ef4444",
    success: "#22c55e",
  },

  /**
   * Default API base URL.
   * Can be overridden at runtime via EXPO_PUBLIC_MAILFLARE_API_URL env var
   * or via the in-app Server Setup screen (if no env var is set).
   */
  apiBaseUrl: "",

  /** EAS project ID */
  easProjectId: "",
};
