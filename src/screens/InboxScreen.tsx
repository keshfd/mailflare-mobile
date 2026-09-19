import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Menu,
  Search,
  X,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  useInfiniteMessages,
  useMailboxes,
  useBulkMessageAction,
} from "../api/queries";
import {
  EmailListItem,
  FolderDrawer,
  SkeletonEmailItem,
  EmptyState,
} from "../components";
import type {
  RootStackParamList,
  SystemFolderType,
  Mailbox,
  Message,
} from "../types";

type InboxNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Inbox"
>;

/** Number of skeleton placeholders to show during initial load. */
const SKELETON_COUNT = 8;

export default function InboxScreen() {
  const navigation = useNavigation<InboxNavigationProp>();

  // Mailbox & Folder State
  const { data: mailboxesData, isLoading: loadingMailboxes } = useMailboxes();
  const mailboxes = mailboxesData?.mailboxes || [];
  const [selectedMailboxId, setSelectedMailboxId] = useState<
    string | undefined
  >(undefined);

  // Active folder selection
  const [activeSystemFolder, setActiveSystemFolder] =
    useState<SystemFolderType>("inbox");
  const [activeCustomFolderId, setActiveCustomFolderId] = useState<
    string | null
  >(null);
  const [activeCustomFolderName, setActiveCustomFolderName] =
    useState<string | null>(null);

  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Search & Filter State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchInput, setSearchInput] = useState(""); // immediate for TextInput
  const [debouncedSearch, setDebouncedSearch] = useState(""); // debounced for query
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Debounce search input by 300ms
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Bulk actions mutation for swipe actions
  const bulkActionMutation = useBulkMessageAction();

  // Pick current mailbox (fallback to first available)
  const currentMailbox = useMemo(() => {
    if (selectedMailboxId) {
      return mailboxes.find((m) => m.id === selectedMailboxId) || mailboxes[0];
    }
    return mailboxes[0];
  }, [mailboxes, selectedMailboxId]);

  const activeMailboxId = currentMailbox?.id;

  // Build query params based on selected folder & filters
  const queryParams = useMemo(() => {
    const params: {
      mailboxId?: string;
      direction?: "inbound" | "outbound";
      status?: string;
      folderId?: string;
      q?: string;
      read?: "read" | "unread";
      limit: number;
    } = {
      mailboxId: activeMailboxId,
      limit: 25,
    };

    // Filter by system or custom folder
    if (activeCustomFolderId) {
      params.folderId = activeCustomFolderId;
    } else {
      switch (activeSystemFolder) {
        case "inbox":
          params.direction = "inbound";
          params.status = "received";
          break;
        case "sent":
          params.direction = "outbound";
          break;
        case "trash":
          params.status = "trash";
          break;
        case "spam":
          params.status = "spam";
          break;
        case "archived":
          params.status = "archived";
          break;
        case "drafts":
          params.direction = "outbound";
          params.status = "draft";
          break;
      }
    }

    if (debouncedSearch.trim()) {
      params.q = debouncedSearch.trim();
    }

    if (unreadOnly) {
      params.read = "unread";
    }

    return params;
  }, [
    activeMailboxId,
    activeCustomFolderId,
    activeSystemFolder,
    debouncedSearch,
    unreadOnly,
  ]);

  // Infinite query for messages
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteMessages(queryParams);

  // Flatten messages from infinite pages
  const messages = useMemo(() => {
    return data?.pages.flatMap((page) => page.messages) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.total ?? 0;

  // Swipe Action Handlers
  const handleTrash = useCallback(
    (messageId: string) => {
      bulkActionMutation.mutate({
        messageIds: [messageId],
        action: "trash",
      });
    },
    [bulkActionMutation]
  );

  const handleToggleRead = useCallback(
    (messageId: string, willBeRead: boolean) => {
      bulkActionMutation.mutate({
        messageIds: [messageId],
        action: willBeRead ? "read" : "unread",
      });
    },
    [bulkActionMutation]
  );

  const handleMessagePress = useCallback(
    (messageId: string) => {
      navigation.navigate("MessageDetail", { messageId });
    },
    [navigation]
  );

  const handleComposePress = useCallback(() => {
    navigation.navigate("Compose", {
      replyTo: activeMailboxId ? { to: "", subject: "", mailboxId: activeMailboxId } : undefined,
    });
  }, [navigation, activeMailboxId]);

  const folderTitle = useMemo(() => {
    if (activeCustomFolderName) return activeCustomFolderName;
    switch (activeSystemFolder) {
      case "inbox":
        return "Inbox";
      case "sent":
        return "Sent";
      case "trash":
        return "Trash";
      case "spam":
        return "Spam";
      case "archived":
        return "Archive";
      case "drafts":
        return "Drafts";
      default:
        return "Messages";
    }
  }, [activeCustomFolderName, activeSystemFolder]);

  const isSentFolder = activeSystemFolder === "sent";

  // Map folder to EmptyState type
  const emptyStateType = useMemo(() => {
    if (debouncedSearch.trim()) return "search" as const;
    if (activeCustomFolderId) return "custom" as const;
    return activeSystemFolder;
  }, [debouncedSearch, activeCustomFolderId, activeSystemFolder]);

  const emptyStateSubtitle = useMemo(() => {
    if (debouncedSearch.trim()) return "No emails matched your search query.";
    if (unreadOnly) return "You have no unread messages in this folder.";
    return undefined; // use default from EmptyState
  }, [debouncedSearch, unreadOnly]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <EmailListItem
        message={item}
        onPress={handleMessagePress}
        onTrash={handleTrash}
        onToggleRead={handleToggleRead}
        isSentFolder={isSentFolder}
      />
    ),
    [handleMessagePress, handleTrash, handleToggleRead, isSentFolder]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Menu size={24} color="#f1f5f9" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{folderTitle}</Text>
          {currentMailbox && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {currentMailbox.displayName ||
                (currentMailbox.hostname
                  ? `${currentMailbox.localPart}@${currentMailbox.hostname}`
                  : currentMailbox.localPart)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setIsSearchActive(!isSearchActive)}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSearchActive ? (
            <X size={22} color="#94a3b8" />
          ) : (
            <Search size={22} color="#f1f5f9" />
          )}
        </TouchableOpacity>
      </View>

      {/* Collapsible Search Input */}
      {isSearchActive && (
        <View style={styles.searchBarContainer}>
          <Search size={18} color="#64748b" style={styles.searchBarIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sender, subject, body..."
            placeholderTextColor="#64748b"
            value={searchInput}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Row: Total Count & Unread Toggle */}
      <View style={styles.filterRow}>
        <Text style={styles.countText}>
          {totalCount} {totalCount === 1 ? "message" : "messages"}
        </Text>

        <TouchableOpacity
          style={[styles.filterPill, unreadOnly && styles.filterPillActive]}
          onPress={() => setUnreadOnly(!unreadOnly)}
        >
          <Text
            style={[
              styles.filterPillText,
              unreadOnly && styles.filterPillTextActive,
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email Message List */}
      {isLoading && !isRefetching ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonEmailItem key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <SkeletonEmailItem />
              </View>
            ) : (
              <View style={styles.listBottomSpacer} />
            )
          }
          ListEmptyComponent={
            <EmptyState
              type={emptyStateType}
              subtitle={emptyStateSubtitle}
            />
          }
        />
      )}

      {/* Floating Action Button (FAB) -> Compose */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleComposePress}
      >
        <Plus size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Folder Navigation Drawer */}
      <FolderDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        selectedMailboxId={activeMailboxId}
        onSelectMailbox={(mbx: Mailbox) => {
          setSelectedMailboxId(mbx.id);
        }}
        activeSystemFolder={activeSystemFolder}
        activeCustomFolderId={activeCustomFolderId}
        onSelectSystemFolder={(folder: SystemFolderType) => {
          setActiveSystemFolder(folder);
          setActiveCustomFolderId(null);
          setActiveCustomFolderName(null);
        }}
        onSelectCustomFolder={(folderId: string, folderName: string) => {
          setActiveCustomFolderId(folderId);
          setActiveCustomFolderName(folderName);
        }}
      />
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
    padding: 6,
  },
  headerTitleCol: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161824",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23263a",
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#141622",
  },
  countText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#161824",
    borderWidth: 1,
    borderColor: "#23263a",
  },
  filterPillActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#3b82f6",
  },
  filterPillText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  filterPillTextActive: {
    color: "#60a5fa",
    fontWeight: "700",
  },
  skeletonContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: 90,
  },
  footerLoader: {
    paddingVertical: 4,
  },
  listBottomSpacer: {
    height: 90,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
