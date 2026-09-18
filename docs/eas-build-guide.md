# EAS Build & CI/CD Pipeline Guide

This guide documents the Expo Application Services (EAS) build pipeline, profile configurations, required repository secrets, and step-by-step instructions for executing local and cloud builds for the Mailflare mobile application.

---

## 1. EAS Build Profiles Overview (`eas.json`)

The `eas.json` file is configured with three distinct deployment targets:

| Profile | Target Environment | Android Output | iOS Output | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`development`** | Local Development & Debugging | Standalone APK (`buildType: "apk"`) | Simulator build (`simulator: true`) | Used with Expo Development Client for debugging native code and local dev server pairing. |
| **`preview`** | Staging & QA Testing | Standalone APK (`buildType: "apk"`) | Ad-hoc / Internal build (`simulator: false`) | Distributed to internal testers and QA for end-to-end verification without requiring Google Play Store submission. |
| **`production`** | Official Store Release | Android App Bundle (`buildType: "app-bundle"`) | App Store IPA (`simulator: false`) | Optimized production binary prepared for submission to Google Play Console and Apple App Store. |

### Environment Variables Mapping
In all profiles, `EXPO_PUBLIC_MAILFLARE_API_URL` is mapped to supply the default backend API endpoint. For production, values can also be managed securely in the [Expo Dashboard](https://expo.dev) under **Project Settings → Environment Variables**.

---

## 2. GitHub Actions CI/CD Secrets

To enable the automated build workflow located at `.github/workflows/eas-build.yml`, configure the following secrets in your GitHub repository (**Settings → Secrets and variables → Actions**):

| Secret Name | Required | Description |
| :--- | :--- | :--- |
| **`EXPO_TOKEN`** | **Yes** | Personal Access Token generated from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens). Grants the GitHub Actions runner permission to authenticate and dispatch builds. |
| **`EXPO_PUBLIC_MAILFLARE_API_URL`** | No | Optional API URL override (e.g. `https://mailflare.example.com`). Injected at build time. |

### Workflow Triggers:
1. **Pushes to `main`**: Automatically validates TypeScript (`npx tsc --noEmit`) and triggers a non-blocking `preview` build on EAS Cloud.
2. **Pull Requests to `main`**: Runs the quality gate (TypeScript verification) to prevent regressions.
3. **Manual Trigger (`workflow_dispatch`)**: Allows selecting custom platforms (`all`, `android`, `ios`) and build profiles (`development`, `preview`, `production`) from the GitHub Actions tab.

---

## 3. Step-by-Step Instructions: Executing the First Development Build

Follow these instructions to verify the build pipeline locally or via the EAS Cloud.

### Prerequisite 1: Authenticate with Expo
Ensure you have an active Expo account and log in via the CLI:
```bash
npx eas-cli login
```
Verify your login session:
```bash
npx eas-cli whoami
```

### Prerequisite 2: Link the Project to EAS
Initialize your EAS project if it has not been linked to your Expo account yet:
```bash
npx eas-cli init
```
This will automatically generate a unique `projectId` in `app.json`.

---

### Option A: Cloud Development Build (Recommended for First Verification)

To dispatch a build to EAS cloud runners without local Android Studio or Xcode requirements:

1. **Android Development APK**:
   ```bash
   npx eas-cli build --profile development --platform android
   ```
   *Output*: EAS provides a QR code and URL to download the `.apk` directly onto an Android device or emulator.

2. **iOS Simulator Build**:
   ```bash
   npx eas-cli build --profile development --platform ios
   ```
   *Output*: Generates a `.tar.gz` archive containing the `.app` bundle. Extract and drag onto any macOS iOS Simulator.

---

### Option B: Local Development Build (Using Your Machine's Toolchain)

If you prefer building locally without consuming EAS Cloud build credits:

#### Android Local Build:
Ensure Android Studio, Android SDK, and `ANDROID_HOME` are configured in your system environment.
```bash
npx eas-cli build --profile development --platform android --local
```

#### iOS Local Build (macOS with Xcode only):
```bash
npx eas-cli build --profile development --platform ios --local
```

---

### Option C: Standalone QA Preview Build (Direct APK for Testers)

To generate a standalone APK that can be shared with testers without setting up a dev server:
```bash
npx eas-cli build --profile preview --platform android
```
Once completed, download the `.apk` and install it directly via USB or Android file browser (`adb install build.apk`).

---

## 4. Verification & Testing Checklist

- [x] **TypeScript Quality Gate**: Verified with `npx tsc --noEmit` (0 errors).
- [x] **Global Error Boundary**: Gracefully catches uncaught rendering errors with recovery actions (`ErrorBoundaryFallback.tsx`).
- [x] **Offline Cache Persister**: Persists email queries in `@react-native-async-storage/async-storage` for 24-hour offline readability.
- [x] **Network Timeout Surfacing**: Axios interceptors automatically surface non-intrusive floating toasts on timeouts (`Toast.tsx`).
- [x] **App Store Compliance**: `app.json` configured with `versionCode: 1`, `package: "com.mailflare.mobile"`, `bundleIdentifier: "com.mailflare.mobile"`, and `buildNumber: "1"`.
- [x] **CI/CD Automation**: `.github/workflows/eas-build.yml` configured and validated.
