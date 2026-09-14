import { useCallback, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useAppConfigStore } from "../stores/appConfigStore";
import { useLogin as useLoginMutation, useLogout as useLogoutMutation, useAuthMe } from "../api/queries";
import { storeSessionToken, getSessionToken, clearSessionToken } from "../utils/tokenStorage";
import { clearBadge } from "../utils/badgeSync";
import {
  registerDevicePushPipeline,
  revokePushTokenFromServer,
} from "./usePushNotifications";
import type { LoginRequest } from "../types";

/**
 * Custom hook for authentication operations.
 * Manages the full auth lifecycle: checking existing sessions,
 * logging in, logging out, and syncing with Zustand + SecureStore.
 */
export function useAuth() {
  const {
    user,
    isChecked,
    isLoading,
    hasMailboxes,
    isSetup,
    setLoading,
    login: storeLogin,
    logout: storeLogout,
    setUser,
    setChecked,
    setHasMailboxes,
    setIsSetup,
    setSessionToken,
  } = useAuthStore();

  const serverUrl = useAppConfigStore((s) => s.serverUrl);

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  /**
   * Check if we have an existing session on app startup.
   * Reads token from SecureStore and validates via /api/auth/me.
   */
  const checkExistingSession = useCallback(async () => {
    if (!serverUrl) {
      setChecked();
      return;
    }

    try {
      setLoading(true);
      const token = await getSessionToken();
      if (!token) {
        storeLogout();
        return;
      }

      // Set the token so the API client can use it
      setSessionToken(token);

      // Validate the session
      const response = await fetch(`${serverUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        await clearSessionToken();
        storeLogout();
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setHasMailboxes(data.hasMailboxes);
      setIsSetup(data.isSetup);
      setChecked();

      // Sync push token for restored session
      registerDevicePushPipeline().catch((err) => {
        console.warn("Failed to register push token for restored session:", err);
      });
    } catch {
      await clearSessionToken();
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [serverUrl, setLoading, setSessionToken, setUser, setHasMailboxes, setIsSetup, setChecked, storeLogout]);

  /**
   * Log in with email and password.
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      setLoading(true);
      try {
        const result = await loginMutation.mutateAsync(credentials);

        // Store token securely
        await storeSessionToken(result.token);

        // Fetch user info
        const meResponse = await fetch(`${serverUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${result.token}`,
            Accept: "application/json",
          },
        });

        if (!meResponse.ok) {
          throw new Error("Failed to fetch user info");
        }

        const meData = await meResponse.json();

        storeLogin({
          user: meData.user,
          token: result.token,
          hasMailboxes: meData.hasMailboxes,
          isSetup: meData.isSetup,
        });

        // Register push token after successful login
        registerDevicePushPipeline().catch((err) => {
          console.warn("Failed to register push token after login:", err);
        });

        return result;
      } finally {
        setLoading(false);
      }
    },
    [loginMutation, serverUrl, setLoading, storeLogin]
  );

  /**
   * Log out and clear all auth state.
   */
  const logout = useCallback(async () => {
    try {
      // Revoke push token from server before tearing down auth
      await revokePushTokenFromServer();
    } catch (pushErr) {
      console.warn("Failed to revoke push token during logout:", pushErr);
    }

    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Continue with local logout even if API call fails
    } finally {
      await clearSessionToken();
      await clearBadge();
      storeLogout();
    }
  }, [logoutMutation, storeLogout]);

  return {
    user,
    isChecked,
    isLoading,
    isAuthenticated: !!user,
    hasMailboxes,
    isSetup,
    login,
    logout,
    checkExistingSession,
    loginError: loginMutation.error,
  };
}
