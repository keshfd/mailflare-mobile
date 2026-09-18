import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  WifiOff,
  X,
} from "lucide-react-native";
import { useToastStore, type ToastType } from "../stores/toastStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getToastTheme(type: ToastType) {
  switch (type) {
    case "success":
      return {
        borderColor: "rgba(34, 197, 94, 0.4)",
        iconBg: "rgba(34, 197, 94, 0.15)",
        iconColor: "#22c55e",
        IconComponent: CheckCircle2,
      };
    case "warning":
      return {
        borderColor: "rgba(245, 158, 11, 0.4)",
        iconBg: "rgba(245, 158, 11, 0.15)",
        iconColor: "#f59e0b",
        IconComponent: AlertCircle,
      };
    case "error":
      return {
        borderColor: "rgba(239, 68, 68, 0.4)",
        iconBg: "rgba(239, 68, 68, 0.15)",
        iconColor: "#ef4444",
        IconComponent: AlertCircle,
      };
    case "timeout":
      return {
        borderColor: "rgba(249, 115, 22, 0.45)",
        iconBg: "rgba(249, 115, 22, 0.15)",
        iconColor: "#f97316",
        IconComponent: WifiOff,
      };
    case "info":
    default:
      return {
        borderColor: "rgba(59, 130, 246, 0.4)",
        iconBg: "rgba(59, 130, 246, 0.15)",
        iconColor: "#3b82f6",
        IconComponent: Info,
      };
  }
}

/**
 * ToastContainer
 *
 * Floating non-intrusive snackbar rendered at the root level above all screens.
 * Subscribes to the useToastStore and animates in/out on change.
 */
export default function ToastContainer() {
  const currentToast = useToastStore((s) => s.currentToast);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentToast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 140,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentToast, translateY, opacity]);

  if (!currentToast) {
    return null;
  }

  const { borderColor, iconBg, iconColor, IconComponent } = getToastTheme(
    currentToast.type
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom + 16, 24),
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toastCard, { borderColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <IconComponent size={20} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          {currentToast.title ? (
            <Text style={styles.title} numberOfLines={1}>
              {currentToast.title}
            </Text>
          ) : null}
          <Text
            style={[styles.message, !currentToast.title && styles.messageStandalone]}
            numberOfLines={3}
          >
            {currentToast.message}
          </Text>
        </View>

        {currentToast.action && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              currentToast.action?.onPress();
              dismiss();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{currentToast.action.label}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <X size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#161822",
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
  },
  messageStandalone: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#f1f5f9",
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderRadius: 6,
    marginRight: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#60a5fa",
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
