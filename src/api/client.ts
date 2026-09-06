import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAppConfigStore } from "../stores/appConfigStore";
import { useAuthStore } from "../stores/authStore";
import { getSessionToken, clearSessionToken } from "../utils/tokenStorage";

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
// Handle 401 (expired session) globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth state and token on unauthorized
      await clearSessionToken();
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
