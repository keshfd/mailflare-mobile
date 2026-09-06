import { useCallback, useState } from "react";
import { useMailboxes as useMailboxesQuery, useFolders, useMessageCounts } from "../api/queries";
import type { Mailbox, Folder } from "../types";

/**
 * Custom hook for mailbox operations.
 * Manages the currently selected mailbox and provides
 * related folders and message counts.
 */
export function useMailbox() {
  const [selectedMailboxId, setSelectedMailboxId] = useState<string | null>(null);

  const mailboxesQuery = useMailboxesQuery();
  const foldersQuery = useFolders(selectedMailboxId ?? undefined);
  const countsQuery = useMessageCounts(selectedMailboxId ?? undefined);

  const mailboxes: Mailbox[] = mailboxesQuery.data?.mailboxes ?? [];
  const folders: Folder[] = foldersQuery.data?.folders ?? [];
  const counts = countsQuery.data?.counts;

  /** The currently selected mailbox object */
  const selectedMailbox = mailboxes.find((m) => m.id === selectedMailboxId) ?? null;

  /** Select a mailbox by ID */
  const selectMailbox = useCallback((mailboxId: string | null) => {
    setSelectedMailboxId(mailboxId);
  }, []);

  /** Get the full email address for a mailbox */
  const getMailboxAddress = useCallback(
    (mailbox: Mailbox): string => {
      // We'd need domain info to construct the full address.
      // For now, return localPart + displayName fallback.
      return mailbox.displayName ?? mailbox.localPart;
    },
    []
  );

  return {
    // Data
    mailboxes,
    selectedMailbox,
    selectedMailboxId,
    folders,
    counts,

    // Actions
    selectMailbox,
    getMailboxAddress,

    // Loading states
    isLoadingMailboxes: mailboxesQuery.isLoading,
    isLoadingFolders: foldersQuery.isLoading,
    isLoadingCounts: countsQuery.isLoading,

    // Refetch
    refetchMailboxes: mailboxesQuery.refetch,
    refetchFolders: foldersQuery.refetch,
    refetchCounts: countsQuery.refetch,
  };
}
