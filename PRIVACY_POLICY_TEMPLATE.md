# Privacy Policy for Mailflare Mobile

**Last Updated / Effective Date**: [Date, e.g., September 18, 2026]  
**Application**: Mailflare Mobile (`co.mailflare.app`)  
**Publisher / Operator**: [Your Name or Organization Name] ("[Publisher]", "we", "us", or "our")  
**Contact Email**: [privacy@mailflare.co]  

---

## 1. Overview and Core Architecture

Mailflare Mobile is a self-hosted client application designed to interface with a self-hosted or user-designated Mailflare email worker/server.

**Zero-Intermediary Architecture**:  
The developers, creators, and distributors of Mailflare Mobile operate **no intermediary proxy servers, telemetry hubs, advertising networks, or analytics collectors**. 
- The application acts strictly as a native user agent (client).
- All email data, authentication credentials, attachments, and metadata flow **directly and exclusively** between your mobile device and the Mailflare server URL that you specify during setup.
- We cannot read, inspect, store, intercept, or monetize your communications or credentials.

---

## 2. Information Handled by the Application

### 2.1 Server Configuration and Authentication Credentials
- **Server URL**: The HTTPS URL of your Mailflare instance is stored locally in your device's persistent application storage.
- **Session Tokens & Passwords**: When you authenticate, credentials or session tokens are stored securely on your device using hardware-backed encrypted storage:
  - **iOS**: Apple Keychain Services (via `expo-secure-store`).
  - **Android**: Android Keystore with AES encryption (via `expo-secure-store`).
- Credentials are transmitted strictly over TLS/HTTPS directly to your configured server to authorize your session and are never transmitted to us or any third party.

### 2.2 Email Communications and Metadata
- **Message Content**: Email bodies (text and HTML), subject lines, timestamps, sender/recipient email addresses, and attachments are fetched directly from your configured Mailflare server.
- **Offline Caching**: To support fast rendering and offline access, message lists, mailbox folders, and message metadata are cached locally on your device in private application sandboxes (`@react-native-async-storage/async-storage` and `expo-file-system`). This data remains solely on your physical device.
- **Outgoing Emails**: Emails composed in Mailflare are transmitted directly from your device to your configured Mailflare server via authenticated API requests.

### 2.3 Device Push Notification Tokens
- If you enable push notifications, the app generates a device push token using the Expo Push Notification service (leveraging Apple Push Notification service [APNs] on iOS and Firebase Cloud Messaging [FCM] on Android).
- **Purpose**: This token is transmitted to your configured Mailflare server solely to allow your server to deliver real-time notifications for incoming emails.
- **No Third-Party Tracking**: Push tokens are not linked to advertising IDs, user profiles, or behavioral tracking systems.

---

## 3. Device Permissions and Justifications

Mailflare Mobile requests only the minimum OS-level permissions required for core email functionality:

| Platform | Permission | Purpose & Justification |
| :--- | :--- | :--- |
| **iOS** | `UIBackgroundModes` (`remote-notification`, `fetch`) | Wakes the app in the background to receive new email push alerts and update badge counters. |
| **iOS** | `NSPhotoLibraryUsageDescription` | Allows you to select photos or images from your photo library to attach to outgoing emails. |
| **iOS** | `NSPhotoLibraryAddUsageDescription` | Allows you to save image attachments received in emails to your device's Photos app. |
| **iOS** | `UIFileSharingEnabled` & `LSSupportsOpeningDocumentsInPlace` | Allows you to open, save, and access downloaded email attachments through the iOS Files app. |
| **Android** | `INTERNET` | Communicates directly with your configured Mailflare server over HTTPS. |
| **Android** | `POST_NOTIFICATIONS` | Displays incoming email alert banners on Android 13 (API 33) and newer. |
| **Android** | `VIBRATE` | Provides haptic alerts when new email notifications arrive. |
| **Android** | `RECEIVE_BOOT_COMPLETED` | Restores push notification registration listeners when your device restarts. |
| **Android** | `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` | Allows downloading, caching, and exporting email attachments to device storage on compatible Android versions. |

*Note: Mailflare Mobile does NOT request or access location data, contacts, microphone, biometric data, health data, or advertising identifiers (IDFA/GAID).*

---

## 4. Third-Party Services and Sub-Processors

Because Mailflare Mobile communicates directly with your personal/organization server, third-party sub-processors are kept to an absolute minimum:

- **Apple Push Notification service (APNs)**: Facilitates cryptographic push notification delivery to iOS devices.
- **Google Firebase Cloud Messaging (FCM)**: Facilitates push notification delivery to Android devices.
- **Expo (650 Industries, Inc.)**: Used strictly for push token relaying to APNs/FCM if standard Expo push routing is utilized.

We do not embed third-party advertising SDKs (e.g., Google AdMob), tracking libraries (e.g., Meta Pixel), or commercial analytics tools (e.g., Google Analytics, Mixpanel, Amplitude).

---

## 5. Data Retention, Deletion, and User Rights

### 5.1 Local Data Deletion & Session Termination
- **Logging Out**: When you log out of Mailflare Mobile:
  1. Your session token is immediately and permanently deleted from the hardware-backed Keychain / Keystore.
  2. The device push notification token is unlinked and de-registered from your configured Mailflare server.
  3. All cached mailbox queries, message previews, and temporary attachment files stored in the local cache are cleared.
- **Uninstalling the App**: Deleting the Mailflare Mobile app from your device automatically deletes all sandbox data, Keychain/Keystore entries, and local caches.

### 5.2 Server-Side Data Deletion
- Because your email server is hosted and operated by you (or your organization/provider), you retain complete ownership and control of your server-side data.
- To modify, export, or permanently delete server-side emails, accounts, logs, or backups, access your Mailflare server management console or Cloudflare dashboard directly.

---

## 6. Security

We implement industry-standard safeguards to protect your communications:
- **Encryption in Transit**: All network requests to your Mailflare instance use Transport Layer Security (TLS 1.2+ / HTTPS).
- **Encryption at Rest**: Authentication tokens are stored using OS-provided encrypted hardware keychains (`expo-secure-store`).
- **Sandboxed File Access**: Email attachments and cached messages are kept in application-sandboxed storage inaccessible to other apps without your explicit action (e.g., using the native OS Share Sheet).

---

## 7. Children's Privacy

Mailflare Mobile does not knowingly collect or solicit personal information from children under the age of 13 (or under 16 in certain jurisdictions). The application is an email client utility intended for general audiences.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect changes in application features or legal requirements. Updates will be published in the application repository and release notes. The updated date at the top of this document indicates when changes take effect.

---

## 9. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your privacy while using Mailflare Mobile, please contact:

**[Publisher / Organization Name]**  
- **Email**: [privacy@mailflare.co]  
- **Project Repository**: [https://github.com/keshfd/mailflare-mobile]  
- **Website**: [https://mailflare.co]  
