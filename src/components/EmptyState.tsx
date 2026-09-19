import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Mail,
  Trash2,
  Archive,
  AlertOctagon,
  Send,
  FileEdit,
  Inbox,
  Search,
  type LucideIcon,
} from "lucide-react-native";

export interface EmptyStateProps {
  /** The folder/context type to display an appropriate icon and message. */
  type:
    | "inbox"
    | "sent"
    | "trash"
    | "spam"
    | "archived"
    | "drafts"
    | "search"
    | "custom";
  /** Optional override for the subtitle text. */
  subtitle?: string;
}

const ICON_MAP: Record<EmptyStateProps["type"], LucideIcon> = {
  inbox: Inbox,
  sent: Send,
  trash: Trash2,
  spam: AlertOctagon,
  archived: Archive,
  drafts: FileEdit,
  search: Search,
  custom: Mail,
};

const TITLE_MAP: Record<EmptyStateProps["type"], string> = {
  inbox: "All caught up",
  sent: "No sent messages",
  trash: "Trash is empty",
  spam: "No spam detected",
  archived: "No archived messages",
  drafts: "No drafts saved",
  search: "No results found",
  custom: "No messages here",
};

const SUBTITLE_MAP: Record<EmptyStateProps["type"], string> = {
  inbox: "Your inbox is clean and up to date.",
  sent: "Messages you send will appear here.",
  trash: "Deleted emails will appear here.",
  spam: "Suspicious emails will appear here.",
  archived: "Archived emails will appear here.",
  drafts: "Saved drafts will appear here.",
  search: "Try adjusting your search terms.",
  custom: "This folder is empty.",
};

/**
 * EmptyState — Reusable, vertically-centered empty state for email folders.
 * Displays a large icon circle with a folder-appropriate Lucide icon,
 * a title, and a contextual subtitle.
 */
export default function EmptyState({ type, subtitle }: EmptyStateProps) {
  const IconComponent = ICON_MAP[type];
  const title = TITLE_MAP[type];
  const displaySubtitle = subtitle ?? SUBTITLE_MAP[type];

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <IconComponent size={36} color="#475569" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{displaySubtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#141624",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
});
