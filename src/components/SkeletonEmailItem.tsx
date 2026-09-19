import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

/**
 * SkeletonEmailItem — A shimmer placeholder that mirrors the EmailListItem
 * layout (avatar circle + 3 text rows). Uses react-native-reanimated shared
 * values for a smooth 60fps looping opacity animation on the UI thread.
 */
export default function SkeletonEmailItem() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite repeat
      true // reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Avatar placeholder */}
      <Animated.View style={[styles.avatarPlaceholder, animatedStyle]} />

      {/* Text rows */}
      <View style={styles.contentCol}>
        {/* Header row: sender + date */}
        <View style={styles.headerRow}>
          <Animated.View style={[styles.senderPlaceholder, animatedStyle]} />
          <Animated.View style={[styles.datePlaceholder, animatedStyle]} />
        </View>

        {/* Subject row */}
        <Animated.View style={[styles.subjectPlaceholder, animatedStyle]} />

        {/* Snippet row */}
        <Animated.View style={[styles.snippetPlaceholder, animatedStyle]} />
      </View>
    </View>
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e2030",
    marginRight: 12,
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  senderPlaceholder: {
    width: "55%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#1e2030",
  },
  datePlaceholder: {
    width: 48,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#1e2030",
  },
  subjectPlaceholder: {
    width: "80%",
    height: 13,
    borderRadius: 4,
    backgroundColor: "#1e2030",
    marginBottom: 8,
  },
  snippetPlaceholder: {
    width: "95%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#1e2030",
  },
});
