import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const STORAGE_KEY = "mailflare_server_url";

/**
 * Base URL Resolution Logic:
 *
 * 1. If EXPO_PUBLIC_MAILFLARE_API_URL env var is set → use it (locked)
 * 2. Otherwise → read from AsyncStorage (user-configurable)
 * 3. If neither → returns null (triggers ServerSetup screen)
 */

/** Check if the base URL is locked via environment variable */
export function getEnvBaseUrl(): string | null {
  const envUrl =
    Constants.expoConfig?.extra?.MAILFLARE_API_URL ??
    process.env.EXPO_PUBLIC_MAILFLARE_API_URL ??
    null;

  if (envUrl && typeof envUrl === "string") {
    return normalizeUrl(envUrl);
  }
  return null;
}

/** Whether the URL is locked by env var and cannot be changed */
export function isBaseUrlLocked(): boolean {
  return getEnvBaseUrl() !== null;
}

/** Read the user-configured base URL from persistent storage */
export async function getStoredBaseUrl(): Promise<string | null> {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEY);
    return url ?? null;
  } catch {
    return null;
  }
}

/** Persist the user-entered server URL */
export async function setStoredBaseUrl(url: string): Promise<void> {
  const normalized = normalizeUrl(url);
  await AsyncStorage.setItem(STORAGE_KEY, normalized);
}

/** Clear the stored URL (e.g. on logout/server switch) */
export async function clearStoredBaseUrl(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Resolve the effective base URL.
 * Priority: env var > stored value > null
 */
export async function resolveBaseUrl(): Promise<string | null> {
  const envUrl = getEnvBaseUrl();
  if (envUrl) return envUrl;
  return getStoredBaseUrl();
}

/**
 * Validate a server URL by attempting to reach the /api/auth/me endpoint.
 * Returns true if the server responds (even with 401), false otherwise.
 */
export async function validateServerUrl(url: string): Promise<boolean> {
  try {
    const normalized = normalizeUrl(url);
    const response = await fetch(`${normalized}/api/auth/me`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    // Any JSON response (even 401) means the server is reachable
    const contentType = response.headers.get("content-type") ?? "";
    return contentType.includes("application/json");
  } catch {
    return false;
  }
}

/** Normalize URL: trim whitespace, remove trailing slashes */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}
