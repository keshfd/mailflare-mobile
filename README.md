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
   git clone [https://github.com/keshfd/mailflare-mobile.git](https://github.com/keshfd/mailflare-mobile.git)
   cd mailflare-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your brand:**
   Edit `brand.config.js` with your company name, bundle ID, and brand colors.

4. **Start the local development server:**
   ```bash
   npx expo start
   ```

5. **Run a production build:**
   ```bash
   eas build --profile production --platform all
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
