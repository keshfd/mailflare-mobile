import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocalDraft {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  mailboxId: string | null;
  updatedAt: number;
}

interface DraftStoreState {
  draft: LocalDraft | null;
  saveDraft: (draft: Omit<LocalDraft, "updatedAt">) => void;
  clearDraft: () => void;
}

/**
 * Zustand store with AsyncStorage persistence for local compose drafts.
 * Auto-saves the current compose form so users can recover their work
 * if the app is closed unexpectedly.
 */
export const useDraftStore = create<DraftStoreState>()(
  persist(
    (set) => ({
      draft: null,
      saveDraft: (draftData) =>
        set({
          draft: {
            ...draftData,
            updatedAt: Date.now(),
          },
        }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: "mailflare-draft-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
