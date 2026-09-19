import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";
import {
  Trash2,
  Mail,
  MailOpen,
  Paperclip,
  ArrowUpRight,
} from "lucide-react-native";
import SenderAvatar from "./SenderAvatar";
import type { Message } from "../types";

export interface EmailListItemProps {
  message: Message;
  onPress: (messageId: string) => void;
  onTrash: (messageId: string) => void;
  onToggleRead: (messageId: string, willBeRead: boolean) => void;
  isSentFolder?: boolean;
}

/**
 * Format email date in a user-friendly way:
 * - Today: "3:45 PM"
 * - This year: "Sep 5"
 * - Older: "9/5/24"
 */
function formatEmailDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }

    return date.toLocaleDateString([], {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function EmailListItem({
  message,
  onPress,
  onTrash,
  onToggleRead,
  isSentFolder = false,
}: EmailListItemProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  const displayName = isSentFolder
    ? `To: ${message.toContactName || message.toAddr || "Unknown"}`
    : message.fromContactName || message.fromAddr || "Unknown";

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.6, 1],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.leftAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          {message.read ? (
            <View style={styles.actionContent}>
              <Mail size={22} color="#fff" />
              <Text style={styles.actionText}>Unread</Text>
            </View>
          ) : (
            <View style={styles.actionContent}>
              <MailOpen size={22} color="#fff" />
              <Text style={styles.actionText}>Read</Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.rightAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={styles.actionContent}>
            <Trash2 size={22} color="#fff" />
            <Text style={styles.actionText}>Trash</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const handleSwipeOpen = (direction: "left" | "right") => {
    swipeableRef.current?.close();
    if (direction === "left") {
      // Swiped right -> toggle read/unread — Light haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onToggleRead(message.id, !message.read);
    } else if (direction === "right") {
      // Swiped left -> trash — Medium haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onTrash(message.id);
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      overshootLeft={false}
      overshootRight={false}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(message.id)}
        style={[
          styles.container,
          !message.read && styles.unreadContainer,
        ]}
      >
        {/* Sender Avatar */}
        <View style={styles.avatarCol}>
          <SenderAvatar name={displayName} size={40} />
          {!message.read && <View style={styles.unreadDot} />}
        </View>

        {/* Message Main Content */}
        <View style={styles.contentCol}>
          {/* Header Row: Sender + Date */}
          <View style={styles.headerRow}>
            <View style={styles.senderContainer}>
              {message.direction === "outbound" && (
                <ArrowUpRight
                  size={14}
                  color="#9ca3af"
                  style={styles.directionIcon}
                />
              )}
              <Text
                style={[
                  styles.senderText,
                  !message.read && styles.unreadSenderText,
                ]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>

            <Text
              style={[styles.dateText, !message.read && styles.unreadDateText]}
            >
              {formatEmailDate(message.createdAt)}
            </Text>
          </View>

          {/* Subject Row */}
          <Text
            style={[
              styles.subjectText,
              !message.read && styles.unreadSubjectText,
            ]}
            numberOfLines={1}
          >
            {message.subject ? message.subject : "(No Subject)"}
          </Text>

          {/* Snippet Preview */}
          <Text style={styles.snippetText} numberOfLines={2}>
            {message.snippet || "No preview available"}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#0d0e15",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e202e",
    alignItems: "flex-start",
  },
  unreadContainer: {
    backgroundColor: "#121422",
  },
  avatarCol: {
    marginRight: 12,
    alignItems: "center",
    marginTop: 2,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b82f6",
    borderWidth: 2,
    borderColor: "#0d0e15",
  },
  contentCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  senderContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  directionIcon: {
    marginRight: 4,
  },
  senderText: {
    fontSize: 15,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  unreadSenderText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
  },
  unreadDateText: {
    color: "#60a5fa",
    fontWeight: "600",
  },
  subjectText: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 4,
    fontWeight: "400",
  },
  unreadSubjectText: {
    color: "#f1f5f9",
    fontWeight: "600",
  },
  snippetText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  leftAction: {
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 24,
    width: 90,
  },
  rightAction: {
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
    width: 90,
  },
  actionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
