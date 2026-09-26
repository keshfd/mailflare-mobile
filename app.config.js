/**
 * Expo dynamic configuration.
 *
 * Reads from brand.config.js for white-label values (name, bundle ID, colors)
 * and merges environment-specific overrides (google-services, EAS project ID).
 *
 * IMPORTANT: After changing brand.config.js, restart the dev server or
 * trigger a new EAS build to pick up the changes.
 */
const brand = require("./brand.config.js");

module.exports = ({ config }) => {
  return {
    ...config,
    name: brand.appName,
    slug: brand.slug,
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    ios: {
      ...(config.ios || {}),
      supportsTablet: true,
      bundleIdentifier: brand.bundleIdentifier,
      infoPlist: {
        UIBackgroundModes: ["fetch", "remote-notification"],
        NSPhotoLibraryUsageDescription: `Allow ${brand.appName} to access your photos to attach images to outgoing emails.`,
        NSPhotoLibraryAddUsageDescription: `Allow ${brand.appName} to save email attachments to your photo library.`,
        UIFileSharingEnabled: true,
        LSSupportsOpeningDocumentsInPlace: true,
      },
    },
    android: {
      ...(config.android || {}),
      package: brand.bundleIdentifier,
      adaptiveIcon: {
        backgroundColor: brand.colors.background,
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "INTERNET",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "POST_NOTIFICATIONS",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
      ],
      // In EAS Cloud builds, GOOGLE_SERVICES_JSON is injected via an EAS File environment variable.
      // For local development, falls back to ./google-services.json in the project root.
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: brand.colors.background,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-web-browser",
      "expo-sharing",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: brand.colors.background,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: brand.colors.primary,
        },
      ],
    ],
    extra: {
      MAILFLARE_API_URL: brand.apiBaseUrl || undefined,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || brand.easProjectId || undefined,
      },
    },
    owner: brand.owner,
  };
};
