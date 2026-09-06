import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  ShieldAlert,
  Trash2,
  Folder as FolderIcon,
  X,
  Check,
  ChevronDown,
  LogOut,
  Mail,
} from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { useFolders, useMessageCounts, useMailboxes } from "../api/queries";
import type { Mailbox, SystemFolderType } from "../types";

export interface FolderDrawerProps {
  visible: boolean;
  onClose: () => void;
  selectedMailboxId: string | undefined;
  onSelectMailbox: (mailbox: Mailbox) => void;
  activeSystemFolder: SystemFolderType | null;
  activeCustomFolderId: string | null;
  onSelectSystemFolder: (folder: SystemFolderType) => void;
  onSelectCustomFolder: (folderId: string, folderName: string) => void;
}

const SYSTEM_FOLDERS: Array<{
  type: SystemFolderType;
  label: string;
  icon: typeof Inbox;
}> = [
  { type: "inbox", label: "Inbox", icon: Inbox },
  { type: "sent", label: "Sent", icon: Send },
  { type: "drafts", label: "Drafts", icon: FileText },
  { type: "archived", label: "Archived", icon: Archive },
  { type: "spam", label: "Spam", icon: ShieldAlert },
  { type: "trash", label: "Trash", icon: Trash2 },
];

export default function FolderDrawer({
  visible,
  onClose,
  selectedMailboxId,
  onSelectMailbox,
  activeSystemFolder,
  activeCustomFolderId,
  onSelectSystemFolder,
  onSelectCustomFolder,
}: FolderDrawerProps) {
  const { logout, user } = useAuth();
  const { data: mailboxesData } = useMailboxes();
  const { data: foldersData } = useFolders(selectedMailboxId);
  const { data: countsData } = useMessageCounts(selectedMailboxId);

  const mailboxes = mailboxesData?.mailboxes || [];
  const customFolders = foldersData?.folders || [];
  const counts = countsData?.counts;

  const currentMailbox =
    mailboxes.find((m) => m.id === selectedMailboxId) || mailboxes[0];

  const getSystemFolderCount = (type: SystemFolderType) => {
    if (!counts) return undefined;
    const folderCount = counts[type];
    if (!folderCount) return undefined;
    if (type === "inbox" && folderCount.unread > 0) {
      return folderCount.unread;
    }
    return folderCount.total > 0 ? folderCount.total : undefined;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.drawerContainer}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header: User & Close */}
            <View style={styles.drawerHeader}>
              <View style={styles.userProfile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || "Mailflare User"}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email || ""}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Mailbox Selector */}
            {mailboxes.length > 0 && (
              <View style={styles.mailboxSection}>
                <Text style={styles.sectionHeading}>Mailbox</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mailboxList}
                >
                  {mailboxes.map((mbx) => {
                    const isSelected = mbx.id === currentMailbox?.id;
                    return (
                      <TouchableOpacity
                        key={mbx.id}
                        style={[
                          styles.mailboxPill,
                          isSelected && styles.mailboxPillActive,
                        ]}
                        onPress={() => onSelectMailbox(mbx)}
                      >
                        <Mail
                          size={14}
                          color={isSelected ? "#ffffff" : "#94a3b8"}
                          style={styles.mailboxPillIcon}
                        />
                        <Text
                          style={[
                            styles.mailboxPillText,
                            isSelected && styles.mailboxPillTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {mbx.displayName ||
                            (mbx.hostname
                              ? `${mbx.localPart}@${mbx.hostname}`
                              : mbx.localPart)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Folder Navigation List */}
            <ScrollView style={styles.folderList} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Folders</Text>

              {SYSTEM_FOLDERS.map((folder) => {
                const IconComponent = folder.icon;
                const isActive =
                  activeSystemFolder === folder.type && !activeCustomFolderId;
                const count = getSystemFolderCount(folder.type);

                return (
                  <TouchableOpacity
                    key={folder.type}
                    style={[styles.folderItem, isActive && styles.folderItemActive]}
                    onPress={() => {
                      onSelectSystemFolder(folder.type);
                      onClose();
                    }}
                  >
                    <View style={styles.folderLeft}>
                      <IconComponent
                        size={20}
                        color={isActive ? "#3b82f6" : "#94a3b8"}
                        style={styles.folderIcon}
                      />
                      <Text
                        style={[
                          styles.folderLabel,
                          isActive && styles.folderLabelActive,
                        ]}
                      >
                        {folder.label}
                      </Text>
                    </View>

                    {count !== undefined && count > 0 && (
                      <View
                        style={[
                          styles.badge,
                          folder.type === "inbox"
                            ? styles.badgePrimary
                            : styles.badgeMuted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            folder.type === "inbox"
                              ? styles.badgeTextPrimary
                              : styles.badgeTextMuted,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Custom Folders Section */}
              {customFolders.length > 0 && (
                <View style={styles.customSection}>
                  <Text style={styles.sectionHeading}>Labels & Custom</Text>

                  {customFolders.map((cf) => {
                    const isActive = activeCustomFolderId === cf.id;
                    const folderColor = cf.color || "#3b82f6";

                    return (
                      <TouchableOpacity
                        key={cf.id}
                        style={[
                          styles.folderItem,
                          isActive && styles.folderItemActive,
                        ]}
                        onPress={() => {
                          onSelectCustomFolder(cf.id, cf.name);
                          onClose();
                        }}
                      >
                        <View style={styles.folderLeft}>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: folderColor },
                            ]}
                          />
                          <Text
                            style={[
                              styles.folderLabel,
                              isActive && styles.folderLabelActive,
                            ]}
                          >
                            {cf.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Drawer Footer: Logout */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  logout();
                }}
              >
                <LogOut size={18} color="#ef4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: "82%",
    maxWidth: 340,
    backgroundColor: "#0d0e15",
    borderLeftWidth: 1,
    borderLeftColor: "#1e202e",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#181a26",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  userEmail: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  mailboxSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#181a26",
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  mailboxList: {
    gap: 8,
    paddingVertical: 2,
  },
  mailboxPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161824",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#23263a",
  },
  mailboxPillActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#3b82f6",
  },
  mailboxPillIcon: {
    marginRight: 6,
  },
  mailboxPillText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  mailboxPillTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  folderList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  folderItemActive: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  folderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  folderIcon: {
    marginRight: 14,
  },
  folderLabel: {
    fontSize: 15,
    color: "#cbd5e1",
    fontWeight: "500",
  },
  folderLabelActive: {
    color: "#60a5fa",
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgePrimary: {
    backgroundColor: "#2563eb",
  },
  badgeMuted: {
    backgroundColor: "#1e202e",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextPrimary: {
    color: "#ffffff",
  },
  badgeTextMuted: {
    color: "#94a3b8",
  },
  customSection: {
    marginTop: 20,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
    marginLeft: 4,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#181a26",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
});
