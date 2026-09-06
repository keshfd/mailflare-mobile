/**
 * Date formatting utilities for the Mailflare mobile client.
 * Handles ISO date string formatting for display in message lists and detail views.
 */

/**
 * Format a date string for display in the message list.
 * - Today: "2:30 PM"
 * - This week: "Mon", "Tue", etc.
 * - This year: "Jan 15"
 * - Older: "Jan 15, 2023"
 */
export function formatMessageDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (isToday(date, now)) {
    return formatTime(date);
  }

  if (isYesterday(date, now)) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return formatWeekday(date);
  }

  if (date.getFullYear() === now.getFullYear()) {
    return formatMonthDay(date);
  }

  return formatFullDate(date);
}

/**
 * Format a date string for display in the message detail view.
 * Full format: "Mon, Jan 15, 2024 at 2:30 PM"
 */
export function formatDetailDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const weekday = formatWeekday(date);
  const monthDay = formatMonthDay(date);
  const year = date.getFullYear();
  const time = formatTime(date);

  return `${weekday}, ${monthDay}, ${year} at ${time}`;
}

/**
 * Format a relative time string (e.g. "2 hours ago", "just now").
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatMessageDate(dateStr);
}

// --- Helpers ---

function isToday(date: Date, now: Date): boolean {
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
