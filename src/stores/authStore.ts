import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  /** The authenticated user (null if not logged in) */
  user: User | null;

  /** Whether the auth state has been checked (initial /me call completed) */
  isChecked: boolean;

  /** Whether a login/logout operation is in progress */
  isLoading: boolean;

  /** Whether the user's instance has mailboxes configured */
  hasMailboxes: boolean;

  /** Whether the instance is fully set up */
  isSetup: boolean;

  /** The session token (kept in memory; source of truth is SecureStore) */
  sessionToken: string | null;

  // --- Actions ---

  setUser: (user: User | null) => void;
  setChecked: () => void;
  setLoading: (loading: boolean) => void;
  setHasMailboxes: (has: boolean) => void;
  setIsSetup: (setup: boolean) => void;
  setSessionToken: (token: string | null) => void;

  /** Full login action: set user + token + metadata */
  login: (params: {
    user: User;
    token: string;
    hasMailboxes: boolean;
    isSetup: boolean;
  }) => void;

  /** Full logout action: clear all auth state */
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isChecked: false,
  isLoading: false,
  hasMailboxes: false,
  isSetup: true,
  sessionToken: null,

  setUser: (user) => set({ user }),
  setChecked: () => set({ isChecked: true }),
  setLoading: (loading) => set({ isLoading: loading }),
  setHasMailboxes: (has) => set({ hasMailboxes: has }),
  setIsSetup: (setup) => set({ isSetup: setup }),
  setSessionToken: (token) => set({ sessionToken: token }),

  login: ({ user, token, hasMailboxes, isSetup }) =>
    set({
      user,
      sessionToken: token,
      hasMailboxes,
      isSetup,
      isChecked: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      sessionToken: null,
      hasMailboxes: false,
      isSetup: true,
      isChecked: true,
      isLoading: false,
    }),
}));
