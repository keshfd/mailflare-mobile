import { create } from "zustand";

interface AppConfigState {
  /** The resolved Mailflare server base URL */
  serverUrl: string | null;

  /** Whether the server URL is locked by an environment variable */
  isUrlLocked: boolean;

  /** Whether the initial URL resolution has completed */
  isInitialized: boolean;

  /** Set the server URL after resolution or user entry */
  setServerUrl: (url: string) => void;

  /** Mark URL as environment-locked */
  setUrlLocked: (locked: boolean) => void;

  /** Mark initialization as complete */
  setInitialized: () => void;

  /** Clear the server URL (e.g. for server switch) */
  clearServerUrl: () => void;
}

export const useAppConfigStore = create<AppConfigState>((set) => ({
  serverUrl: null,
  isUrlLocked: false,
  isInitialized: false,

  setServerUrl: (url: string) => set({ serverUrl: url }),
  setUrlLocked: (locked: boolean) => set({ isUrlLocked: locked }),
  setInitialized: () => set({ isInitialized: true }),
  clearServerUrl: () => set({ serverUrl: null }),
}));
