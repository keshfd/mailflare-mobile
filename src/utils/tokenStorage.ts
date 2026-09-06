import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "mailflare_session_token";

/**
 * Securely store the session token obtained from /api/auth/login.
 * Uses expo-secure-store (Keychain on iOS, EncryptedSharedPreferences on Android).
 */
export async function storeSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

/**
 * Retrieve the stored session token.
 * Returns null if no token is stored or retrieval fails.
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Delete the stored session token (on logout).
 */
export async function clearSessionToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // Ignore errors if key doesn't exist
  }
}

/**
 * Check if a session token exists.
 */
export async function hasSessionToken(): Promise<boolean> {
  const token = await getSessionToken();
  return token !== null && token.length > 0;
}
