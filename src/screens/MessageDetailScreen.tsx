import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  ChevronLeft,
  Trash2,
  Mail,
  MailOpen,
  Reply,
  ExternalLink,
  Code,
  FileText,
} from "lucide-react-native";
import {
  useEmailDetail,
  useMarkAsRead,
  useBulkMessageAction,
} from "../api/queries";
import { AttachmentList } from "../components";
import type { RootStackParamList } from "../types";

type MessageDetailRouteProp = RouteProp<
  RootStackParamList,
  "MessageDetail"
>;
type MessageDetailNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "MessageDetail"
>;

export default function MessageDetailScreen() {
  const route = useRoute<MessageDetailRouteProp>();
  const navigation = useNavigation<MessageDetailNavProp>();
  const { messageId } = route.params;

  const [viewPlaintext, setViewPlaintext] = useState(false);

  const { data, isLoading, isError, error } = useEmailDetail(messageId);
  const markAsReadMutation = useMarkAsRead();
  const bulkActionMutation = useBulkMessageAction();

  const message = data?.message;
  const body = data?.body;
  const attachments = data?.attachments || [];
  const unsubscribeUrl = data?.unsubscribeUrl;

  // Automatically mark as read on open if unread
  useEffect(() => {
    if (message && !message.read) {
      markAsReadMutation.mutate(message.id);
    }
  }, [message?.id, message?.read]);

  const handleToggleRead = () => {
    if (!message) return;
    bulkActionMutation.mutate({
      messageIds: [message.id],
      action: message.read ? "unread" : "read",
    });
  };

  const handleTrash = () => {
    if (!message) return;
    Alert.alert(
      "Move to Trash",
      "Are you sure you want to move this message to trash?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trash",
          style: "destructive",
          onPress: () => {
            bulkActionMutation.mutate(
              { messageIds: [message.id], action: "trash" },
              {
                onSuccess: () => {
                  navigation.goBack();
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleReply = () => {
    if (!message) return;
    const replySubject = message.subject?.startsWith("Re:")
      ? message.subject
      : `Re: ${message.subject || ""}`;

    const quotedText = body?.textBody
      ? `\n\n\n--- On ${new Date(message.createdAt).toLocaleString()} wrote ---\n${body.textBody}`
      : "";

    navigation.navigate("Compose", {
      replyTo: {
        to: message.fromAddr,
        subject: replySubject,
        body: quotedText,
        mailboxId: message.mailboxId || undefined,
      },
    });
  };

  const handleUnsubscribe = async () => {
    if (!unsubscribeUrl) return;
    try {
      if (unsubscribeUrl.startsWith("mailto:")) {
        await Linking.openURL(unsubscribeUrl);
      } else {
        await WebBrowser.openBrowserAsync(unsubscribeUrl);
      }
    } catch {
      Alert.alert("Error", "Could not open unsubscribe link");
    }
  };

  // Prepare safe responsive HTML with system styling & XSS hardening
  const preparedHtml = useMemo(() => {
    const rawHtml = body?.htmlBody;
    if (!rawHtml) return null;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d0e15;
            color: #e2e8f0;
            padding: 16px;
            margin: 0;
            font-size: 15px;
            line-height: 1.6;
            word-break: break-word;
          }
          a { color: #60a5fa; text-decoration: underline; }
          img { max-width: 100% !important; height: auto !important; border-radius: 6px; }
          table { max-width: 100% !important; }
          blockquote {
            border-left: 3px solid #3b82f6;
            margin: 12px 0;
            padding-left: 12px;
            color: #94a3b8;
          }
          pre, code {
            background-color: #1a1d2d;
            padding: 4px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        ${rawHtml}
      </body>
      </html>
    `;
  }, [body?.htmlBody]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading message...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !message) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
          >
            <ChevronLeft size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Message</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Message not found</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : "Failed to load message"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Actions */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={26} color="#f1f5f9" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {body?.htmlBody && body?.textBody && (
            <TouchableOpacity
              onPress={() => setViewPlaintext(!viewPlaintext)}
              style={styles.actionBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {viewPlaintext ? (
                <Code size={20} color="#60a5fa" />
              ) : (
                <FileText size={20} color="#94a3b8" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleToggleRead}
            style={styles.actionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {message.read ? (
              <Mail size={22} color="#94a3b8" />
            ) : (
              <MailOpen size={22} color="#60a5fa" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReply}
            style={styles.actionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Reply size={22} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTrash}
            style={styles.actionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Email Header Card */}
        <View style={styles.messageHeaderCard}>
          <Text style={styles.subjectText}>
            {message.subject || "(No Subject)"}
          </Text>

          {/* Sender & Timestamp Row */}
          <View style={styles.senderRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {message.fromContactName
                  ? message.fromContactName[0].toUpperCase()
                  : message.fromAddr[0].toUpperCase()}
              </Text>
            </View>

            <View style={styles.senderInfo}>
              <Text style={styles.fromName} numberOfLines={1}>
                {message.fromContactName || message.fromAddr}
              </Text>
              <Text style={styles.fromAddr} numberOfLines={1}>
                {message.fromAddr}
              </Text>
            </View>

            <Text style={styles.dateText}>
              {new Date(message.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {/* To Address */}
          <View style={styles.recipientRow}>
            <Text style={styles.recipientLabel}>To:</Text>
            <Text style={styles.recipientValue} numberOfLines={1}>
              {message.toContactName || message.toAddr}
            </Text>
          </View>

          {/* Unsubscribe Banner */}
          {unsubscribeUrl && (
            <TouchableOpacity
              style={styles.unsubscribeBanner}
              onPress={handleUnsubscribe}
            >
              <Text style={styles.unsubscribeText}>
                Mailing list detected. Tap to Unsubscribe.
              </Text>
              <ExternalLink size={14} color="#60a5fa" />
            </TouchableOpacity>
          )}
        </View>

        {/* Email Body */}
        <View style={styles.bodyContainer}>
          {preparedHtml && !viewPlaintext ? (
            <View style={styles.webViewWrapper}>
              <WebView
                originWhitelist={["about:blank"]}
                source={{ html: preparedHtml, baseUrl: "about:blank" }}
                style={styles.webView}
                javaScriptEnabled={false}
                domStorageEnabled={false}
                scrollEnabled={false}
                scalesPageToFit={false}
                onShouldStartLoadWithRequest={(request) => {
                  if (request.url === "about:blank") return true;

                  // Safely intercept and open all external links in system browser
                  if (
                    request.url.startsWith("http://") ||
                    request.url.startsWith("https://")
                  ) {
                    WebBrowser.openBrowserAsync(request.url);
                    return false;
                  }
                  if (request.url.startsWith("mailto:")) {
                    Linking.openURL(request.url);
                    return false;
                  }
                  return false;
                }}
              />
            </View>
          ) : (
            <View style={styles.plaintextContainer}>
              <Text style={styles.plaintextBody} selectable>
                {body?.textBody || "No text content available."}
              </Text>
            </View>
          )}

          {/* Attachments Section */}
          <AttachmentList
            messageId={message.id}
            attachments={attachments}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#181a26",
    backgroundColor: "#0d0e15",
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  messageHeaderCard: {
    padding: 16,
    backgroundColor: "#10121d",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1d2e",
  },
  subjectText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 26,
    marginBottom: 14,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  senderInfo: {
    flex: 1,
    marginRight: 8,
  },
  fromName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  fromAddr: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
  },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  recipientLabel: {
    fontSize: 12,
    color: "#64748b",
    marginRight: 6,
  },
  recipientValue: {
    fontSize: 12,
    color: "#94a3b8",
  },
  unsubscribeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  unsubscribeText: {
    fontSize: 12,
    color: "#60a5fa",
    fontWeight: "500",
  },
  bodyContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  webViewWrapper: {
    minHeight: 300,
    backgroundColor: "#0d0e15",
    borderRadius: 8,
    overflow: "hidden",
  },
  webView: {
    backgroundColor: "transparent",
    minHeight: 400,
  },
  plaintextContainer: {
    padding: 8,
  },
  plaintextBody: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorSubtitle: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
});
