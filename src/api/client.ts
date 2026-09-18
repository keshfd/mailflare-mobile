import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAppConfigStore } from "../stores/appConfigStore";
import { useAuthStore } from "../stores/authStore";
import { getSessionToken, clearSessionToken } from "../utils/tokenStorage";
import { toast } from "../stores/toastStore";

/**
 * Axios client instance for Mailflare API.
 *
 * Base URL is dynamically resolved from the appConfigStore.
 * Session token is automatically attached from the authStore / SecureStore.
 */
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Throttling flag to avoid cascading toasts on simultaneous query timeouts
let lastNetworkToastTime = 0;
const TOAST_THROTTLE_MS = 6000;

function notifyNetworkIssue(type: "timeout" | "network", customMsg?: string) {
  const now = Date.now();
  if (now - lastNetworkToastTime < TOAST_THROTTLE_MS) {
    return;
  }
  lastNetworkToastTime = now;

  if (type === "timeout") {
    toast.networkTimeout(
      customMsg ||
        "The request timed out. Cached messages remain accessible."
    );
  } else {
    toast.show({
      type: "timeout",
      title: "Network Offline",
      message:
        customMsg ||
        "Unable to reach the Mailflare server. Serving cached content.",
      duration: 5000,
    });
  }
}

// --- Request Interceptor ---
// Dynamically set baseURL and attach Bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Resolve base URL from store
    const serverUrl = useAppConfigStore.getState().serverUrl;
    if (serverUrl) {
      config.baseURL = serverUrl;
    }

    // Attach session token (from memory first, then SecureStore fallback)
    let token = useAuthStore.getState().sessionToken;
    if (!token) {
      token = await getSessionToken();
      if (token) {
        useAuthStore.getState().setSessionToken(token);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
// Handle 401 (expired session) and network/timeout failures gracefully
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 1. Check for 401 unauthorized
    if (error.response?.status === 401) {
      // Clear auth state and token on unauthorized
      await clearSessionToken();
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // 2. Check for network timeout
    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      (error.message && error.message.toLowerCase().includes("timeout"));

    if (isTimeout) {
      notifyNetworkIssue("timeout");
      return Promise.reject(error);
    }

    // 3. Check for general network failure / offline
    const isNetworkError =
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error" ||
      !error.response;

    if (isNetworkError && !error.response) {
      notifyNetworkIssue("network");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
