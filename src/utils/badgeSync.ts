/**
 * Badge Synchronization Utility
 *
 * Manages the OS-level app icon badge count by syncing with the
 * server-reported unread email count from Mailflare's message
 * counts API. Designed to be called from TanStack React Query
 * callbacks to avoid unnecessary API spam.
 */

import * as Notifications from "expo-notifications";

/**
 * Set the OS badge count to the given value.
 * Silently catches errors — badge is a cosmetic feature that must
 * never crash the app.
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch (error) {
    console.warn("Failed to set badge count:", error);
  }
}

/**
 * Read the current OS badge count.
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

/**
 * Synchronize the OS badge with the server-reported inbox unread count.
 * Call this from `onSuccess` of message counts queries to keep the badge
 * in sync with the latest server state without extra API calls.
 */
export async function syncBadgeWithUnreadCount(
  inboxUnread: number,
): Promise<void> {
  await setBadgeCount(inboxUnread);
}

/**
 * Decrement the badge count by 1 (e.g., when user reads a message).
 * Clamps at 0 to prevent negative counts.
 */
export async function decrementBadge(): Promise<void> {
  const current = await getBadgeCount();
  await setBadgeCount(Math.max(0, current - 1));
}

/**
 * Increment the badge count by 1 (e.g., when a foreground push arrives).
 */
export async function incrementBadge(): Promise<void> {
  const current = await getBadgeCount();
  await setBadgeCount(current + 1);
}

/**
 * Clear the badge entirely (e.g., on logout or when all mail is read).
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}
