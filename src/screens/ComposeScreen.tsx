import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  X,
  Send,
  ChevronDown,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { useMailboxes, useSendEmail } from "../api/queries";
import type { RootStackParamList, Mailbox } from "../types";

type ComposeRouteProp = RouteProp<RootStackParamList, "Compose">;
type ComposeNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Compose"
>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComposeScreen() {
  const route = useRoute<ComposeRouteProp>();
  const navigation = useNavigation<ComposeNavProp>();
  const replyTo = route.params?.replyTo;

  // Mailboxes
  const { data: mailboxesData } = useMailboxes();
  const mailboxes = mailboxesData?.mailboxes || [];
  const [selectedMailbox, setSelectedMailbox] = useState<Mailbox | null>(null);

  // Form Fields
  const [to, setTo] = useState(replyTo?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(replyTo?.subject || "");
  const [body, setBody] = useState(replyTo?.body || "");

  // Mailbox picker modal / dropdown state
  const [mailboxDropdownOpen, setMailboxDropdownOpen] = useState(false);

  // Toast / feedback message
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Send email mutation
  const sendEmailMutation = useSendEmail();

  // Pick initial mailbox
  useEffect(() => {
    if (mailboxes.length === 0) return;

    if (replyTo?.mailboxId) {
      const match = mailboxes.find((m) => m.id === replyTo.mailboxId);
      if (match) {
        setSelectedMailbox(match);
        return;
      }
    }

    if (!selectedMailbox) {
      setSelectedMailbox(mailboxes[0]);
    }
  }, [mailboxes, replyTo?.mailboxId]);

  const fromAddress = useMemo(() => {
    if (!selectedMailbox) return "";
    return selectedMailbox.hostname
      ? `${selectedMailbox.localPart}@${selectedMailbox.hostname}`
      : selectedMailbox.localPart;
  }, [selectedMailbox]);

  const handleSend = async () => {
    // Basic validations
    const recipient = to.trim();
    if (!recipient) {
      Alert.alert("Recipient Missing", "Please enter a recipient email address.");
      return;
    }

    if (!EMAIL_REGEX.test(recipient)) {
      Alert.alert(
        "Invalid Email",
        "Please provide a valid recipient email address (e.g. user@example.com)."
      );
      return;
    }

    if (!selectedMailbox) {
      Alert.alert("Error", "No sending mailbox selected.");
      return;
    }

    if (!subject.trim()) {
      Alert.alert("Subject Missing", "Would you like to send this email without a subject?", [
        { text: "Cancel", style: "cancel" },
        { text: "Send Anyway", onPress: executeSend },
      ]);
      return;
    }

    await executeSend();
  };

  const executeSend = async () => {
    if (!selectedMailbox) return;

    try {
      setStatusMessage(null);

      // Concatenate CC/BCC if provided into headers or body note
      let emailText = body;
      if (cc.trim() || bcc.trim()) {
        const notes = [];
        if (cc.trim()) notes.push(`Cc: ${cc.trim()}`);
        if (bcc.trim()) notes.push(`Bcc: ${bcc.trim()}`);
        // Mailflare backend accepts text & html
      }

      await sendEmailMutation.mutateAsync({
        from: fromAddress,
        to: to.trim(),
        subject: subject.trim(),
        text: emailText,
        mailboxId: selectedMailbox.id,
      });

      setStatusMessage({
        type: "success",
        text: "Email sent successfully",
      });

      setTimeout(() => {
        navigation.goBack();
      }, 700);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send email";
      setStatusMessage({
        type: "error",
        text: errorMsg,
      });
      Alert.alert("Send Failed", errorMsg);
    }
  };

  const isSending = sendEmailMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isSending}
          >
            <X size={24} color="#94a3b8" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Message</Text>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!to.trim() || isSending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!to.trim() || isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Send size={16} color="#ffffff" style={styles.sendIcon} />
                <Text style={styles.sendBtnText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Toast Banner */}
        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              statusMessage.type === "success"
                ? styles.statusBannerSuccess
                : styles.statusBannerError,
            ]}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={16} color="#4ade80" style={{ marginRight: 8 }} />
            ) : (
              <AlertCircle size={16} color="#f87171" style={{ marginRight: 8 }} />
            )}
            <Text
              style={[
                styles.statusText,
                statusMessage.type === "success"
                  ? styles.statusTextSuccess
                  : styles.statusTextError,
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* From Field */}
          <View style={styles.formRow}>
            <Text style={styles.fieldLabel}>From:</Text>
            <TouchableOpacity
              style={styles.fromSelector}
              onPress={() => setMailboxDropdownOpen(!mailboxDropdownOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.fromText} numberOfLines={1}>
                {fromAddress || "Select Mailbox"}
              </Text>
              {mailboxes.length > 1 && (
                <ChevronDown size={16} color="#94a3b8" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Mailbox Selector Dropdown */}
          {mailboxDropdownOpen && mailboxes.length > 1 && (
            <View style={styles.dropdownContainer}>
              {mailboxes.map((mbx) => {
                const addr = mbx.hostname
                  ? `${mbx.localPart}@${mbx.hostname}`
                  : mbx.localPart;
                const isSelected = mbx.id === selectedMailbox?.id;

                return (
                  <TouchableOpacity
                    key={mbx.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedMailbox(mbx);
                      setMailboxDropdownOpen(false);
                    }}
                  >
                    <Mail size={16} color={isSelected ? "#60a5fa" : "#94a3b8"} />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextActive,
                      ]}
                    >
                      {mbx.displayName ? `${mbx.displayName} <${addr}>` : addr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* To Field */}
          <View style={styles.formRow}>
            <Text style={styles.fieldLabel}>To:</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="recipient@example.com"
              placeholderTextColor="#64748b"
              value={to}
              onChangeText={setTo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!showCcBcc && (
              <TouchableOpacity
                onPress={() => setShowCcBcc(true)}
                style={styles.ccBccToggle}
              >
                <Text style={styles.ccBccToggleText}>Cc/Bcc</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Optional CC & BCC Fields */}
          {showCcBcc && (
            <>
              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>Cc:</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="cc@example.com"
                  placeholderTextColor="#64748b"
                  value={cc}
                  onChangeText={setCc}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>Bcc:</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="bcc@example.com"
                  placeholderTextColor="#64748b"
                  value={bcc}
                  onChangeText={setBcc}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </>
          )}

          {/* Subject Field */}
          <View style={styles.formRow}>
            <Text style={styles.fieldLabel}>Subject:</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Email subject"
              placeholderTextColor="#64748b"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Multiline Body Field */}
          <View style={styles.bodyContainer}>
            <TextInput
              style={styles.bodyInput}
              placeholder="Write your message here..."
              placeholderTextColor="#64748b"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  container: {
    flex: 1,
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
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 72,
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#1e293b",
  },
  sendIcon: {
    marginRight: 6,
  },
  sendBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
  },
  statusBannerSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  statusBannerError: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusTextSuccess: {
    color: "#4ade80",
  },
  statusTextError: {
    color: "#f87171",
  },
  formScroll: {
    flex: 1,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#161824",
  },
  fieldLabel: {
    width: 60,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  fieldInput: {
    flex: 1,
    color: "#f1f5f9",
    fontSize: 15,
    padding: 0,
  },
  fromSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  fromText: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownContainer: {
    backgroundColor: "#141624",
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#23263a",
    overflow: "hidden",
    marginBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: "#1e3a8a",
  },
  dropdownItemText: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  dropdownItemTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  ccBccToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#161824",
    borderRadius: 4,
  },
  ccBccToggleText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },
  bodyContainer: {
    flex: 1,
    padding: 16,
    minHeight: 320,
  },
  bodyInput: {
    flex: 1,
    color: "#f1f5f9",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 300,
  },
});
