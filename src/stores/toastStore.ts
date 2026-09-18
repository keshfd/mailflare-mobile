import { create } from "zustand";

export type ToastType = "info" | "success" | "warning" | "error" | "timeout";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // duration in ms, default 4000
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastState {
  currentToast: ToastMessage | null;
  show: (toast: Omit<ToastMessage, "id">) => void;
  dismiss: () => void;
}

let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set, get) => ({
  currentToast: null,

  show: (toastData) => {
    // Clear any existing dismissal timer
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }

    const id = Date.now().toString();
    const duration = toastData.duration ?? 4000;

    const newToast: ToastMessage = {
      ...toastData,
      id,
      duration,
    };

    set({ currentToast: newToast });

    // Set auto-dismiss
    if (duration > 0) {
      timeoutHandle = setTimeout(() => {
        if (get().currentToast?.id === id) {
          set({ currentToast: null });
        }
      }, duration);
    }
  },

  dismiss: () => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
    set({ currentToast: null });
  },
}));

/**
 * Imperative helper methods callable from anywhere (Axios interceptors, React Query caches, etc.)
 */
export const toast = {
  show: (data: Omit<ToastMessage, "id">) => useToastStore.getState().show(data),
  info: (message: string, title?: string) =>
    useToastStore.getState().show({ type: "info", message, title }),
  success: (message: string, title?: string) =>
    useToastStore.getState().show({ type: "success", message, title }),
  warning: (message: string, title?: string) =>
    useToastStore.getState().show({ type: "warning", message, title }),
  error: (message: string, title?: string) =>
    useToastStore.getState().show({ type: "error", message, title }),
  networkTimeout: (customMessage?: string) =>
    useToastStore.getState().show({
      type: "timeout",
      title: "Connection Timeout",
      message:
        customMessage ||
        "The server took too long to respond. Cached data will be shown if available.",
      duration: 5000,
    }),
  dismiss: () => useToastStore.getState().dismiss(),
};
