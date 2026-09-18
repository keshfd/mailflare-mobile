# Mailflare Mobile

A premium, open-source React Native email client built to interface seamlessly with [Mailflare's](https://github.com/hieunc229/mailflare) serverless Cloudflare infrastructure. 

Mailflare Mobile operates as a lightning-fast "thin client." It does not rely on heavy, redundant local databases; instead, it consumes your existing Cloudflare Worker APIs, utilizing `@tanstack/react-query` for aggressive caching and offline persistence.

## 🚀 Core Features

* **Edge Push Engine:** Real-time push notifications routed directly from a Cloudflare Email Worker through the Expo Push API.
* **White-Label Architecture:** A centralized `brand.config.js` allows you to instantly rebrand the app's name, colors, and API endpoints without touching UI components.
* **Premium UI/UX:** Built with `@shopify/flash-list` for 60fps scrolling, tactile haptic feedback on swipe actions, and smooth skeleton loading states via Reanimated.
* **Automated CI/CD:** Ready-to-deploy GitHub Actions workflows for automated Expo Application Services (EAS) preview and production builds.
* **Deep Linking:** Tap a push notification to instantly mount the navigation tree and route directly to the specific message thread.

## 🛠 Tech Stack

* **Framework:** React Native / Expo (TypeScript)
* **State & Data:** Zustand, TanStack Query, Expo Secure Store
* **UI & Animation:** React Native Reanimated, FlashList, Lucide Icons
* **Backend Integration:** Cloudflare Workers, D1 Database, R2 Storage (via Mailflare Web)

## 🎨 White-Label & Design Guidelines

Mailflare Mobile is designed to be forked and rebranded to launch your own email service (e.g., TrooPost). All configuration is handled in `brand.config.js`.

```javascript
// brand.config.js
module.exports = {
  appName: 'TrooPost Mail',
  bundleIdentifier: 'com.troopost.mail',
  apiBaseUrl: process.env.EXPO_PUBLIC_MAILFLARE_API_URL || 'https://api.troopost.com',
  colors: {
    primary: '#0055FF', // Your brand color
    background: '#FFFFFF',
    text: '#111827',
  }
};
```

**Official UI/Asset Constraints:**
When generating your customized app store assets and icons for your rebrand, strictly adhere to the following project design principles:
* **Logomarks:** To ensure clarity in the mobile app grid, replace long text words in the logo with a distinct symbol to shorten it. 
* **Typography:** Always capitalize the first letter of your app's brand mark (e.g., ensuring the letter 'M' is capital) for maximum legibility on mobile viewports.
* **3D Assets & Mockups:** If incorporating 3D boxes or device models into your splash screens or app store promotional graphics, position the models vertically straight. Do not bend the boxes or devices to the left or right. Perfect symmetry is required.

## ⚙️ CI/CD & Build Pipeline

This repository includes a pre-configured GitHub Actions build script (`.github/workflows/eas-build.yml`). 

To utilize the automated pipeline:
1. Generate an Expo token (`EXPO_TOKEN`).
2. Add the token to your GitHub Repository Secrets.
3. Every push to the `main` branch will automatically trigger an EAS `preview` build, ensuring your Cloudflare Worker integration is continuously tested on physical devices.

## 🚀 Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/keshfd/mailflare-mobile.git
   cd mailflare-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Android Push Notifications (Firebase):**
   Standalone Android builds (APKs and AABs) require Google Firebase Cloud Messaging (FCM):
   * Create a project in the [Firebase Console](https://console.firebase.google.com/).
   * Register an Android app using your package name (`co.mailflare.app` as defined in `app.json`).
   * Download `google-services.json` and place it in the project root:
     ```bash
     cp google-services.json.example google-services.json
     # Replace dummy values with your actual Firebase config
     ```
     *(Note: `google-services.json` is git-ignored to protect your credentials. For EAS Cloud builds, provide it securely via EAS environment variables).*
   * **Upload to EAS Cloud Builds (Required for EAS & CI):**
     Upload your `google-services.json` directly to EAS as a file environment variable:
     ```bash
     npx eas-cli env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
     ```
     *(Or upload via [Expo Dashboard](https://expo.dev) under **Project Settings → Environment Variables** with Type: **File**). `app.config.js` automatically routes EAS Cloud builds to this injected file.*
     *(Alternatively, you can paste the file content into a GitHub Repository Secret named `GOOGLE_SERVICES_JSON` to let CI restore it before build dispatch).*
   * In Firebase Console (**Project Settings → Service accounts**), generate a private key and register it in EAS:
     ```bash
     npx eas-cli credentials
     ```
     Select **Android → Preview/Production → Push Notifications → Set up Google Service Account Key**.

4. **Configure your Mailflare API endpoint:**

   * **Local Development:**
     Copy `.env.example` to create a local `.env` file:
     ```bash
     cp .env.example .env
     ```
     Open `.env` and specify your deployed Cloudflare Worker URL:
     ```bash
     EXPO_PUBLIC_MAILFLARE_API_URL="https://your-mailflare-instance.workers.dev"
     ```
     *(Note: Variables prefixed with `EXPO_PUBLIC_` are automatically bundled by Expo at runtime. If omitted, the app will prompt for the server address on first launch).*

   * **EAS Cloud Builds (Preview & Production):**
     Because `.env` files are git-ignored and eas-ignored for security, set the environment variable directly in Expo Application Services (EAS):
     ```bash
     npx eas-cli env:create --name EXPO_PUBLIC_MAILFLARE_API_URL --value "https://your-mailflare-instance.workers.dev" --type string
     ```
     Alternatively, configure it via the [Expo Dashboard](https://expo.dev) under **Your Project → Configuration → Environment Variables**. You can scope this variable across all environments (`development`, `preview`, `production`) or configure distinct backend URLs per environment.

5. **Start the local development server:**
   ```bash
   npx expo start
   ```

6. **Build for testing or production:**
   ```bash
   # Cloud Preview APK for Android (sideloadable test build)
   npm run build:android

   # Production store packages (Android .aab & iOS .ipa)
   npm run build:android:prod
   npm run build:ios:prod
   ```

## 🍏 How to Enable iOS Builds (When Ready)

By default, automated GitHub Actions CI builds target Android (`.apk`) so that test packages can be built immediately without requiring a paid Apple Developer membership.

When you are ready to produce iOS builds, you have two options:

### Option A: Simulator Builds (No Apple Developer Account Required)
To generate an iOS test build that runs inside the macOS iOS Simulator without needing Apple code-signing certificates:
1. In `eas.json`, set `"simulator": true` under the `preview.ios` profile:
   ```json
   "preview": {
     "distribution": "internal",
     "ios": {
       "simulator": true
     }
   }
   ```
2. Trigger the preview build:
   ```bash
   npm run build:ios
   ```
   *Output*: Generates a `.tar.gz` archive containing the `.app` bundle. Extract and drag it onto any macOS iOS Simulator.

### Option B: Physical Device / Internal Ad-Hoc Builds (Requires Apple Developer Account)
Building for physical iPhones requires an active Apple Developer Program membership ($99/year) to generate code-signing certificates and provisioning profiles:

1. **Set Up Credentials Interactively Once:**
   Run the interactive credential manager in your local terminal:
   ```bash
   npx eas-cli credentials
   ```
   * Select platform: **iOS**
   * Select build profile: **preview** (or **production**)
   * When prompted `Do you want to log in to your Apple account?`, select **yes** and authenticate with your Apple ID.
   * EAS will automatically create and register your Distribution Certificate and Ad-Hoc Provisioning Profile on the Apple Developer Portal and store them securely in the Expo Cloud.

2. **Trigger the Cloud Build:**
   Once credentials are saved on Expo servers, non-interactive builds (including GitHub Actions) will build cleanly:
   ```bash
   # Via npm script
   npm run build:ios

   # Via GitHub Actions
   Go to the "Actions" tab → Select "EAS Build & CI Pipeline" → Click "Run workflow" → Choose platform: "ios" (or "all").
   ```

3. **Production App Store Releases:**
   When you are ready to publish to TestFlight or the App Store, configure credentials for the `production` profile:
   ```bash
   npm run build:ios:prod
   ```

## 📜 License

MIT License

Copyright (c) 2026 Keshan Fernando

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
