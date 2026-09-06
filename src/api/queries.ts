/**
 * TanStack React Query hooks for Mailflare API endpoints.
 * Maps 1:1 to the Mailflare web API routes discovered in STEP 1.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import apiClient from "./client";
import type {
  AuthMeResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MessagesResponse,
  MessagesQueryParams,
  MessageDetailResponse,
  MessageCountsResponse,
  MailboxesResponse,
  FoldersResponse,
  DomainsResponse,
  DraftsListResponse,
  DraftPayload,
  DraftResponse,
  SendEmailRequest,
  SendEmailResponse,
  BulkMessagePayload,
  SuccessResponse,
  MessageStatusPayload,
  ContactResponse,
  ContactUpdateRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  CreateFolderRequest,
  DeviceRegisterRequest,
  DeviceRevokeRequest,
} from "../types";

// ============================================================================
// Query Keys — centralized for invalidation
// ============================================================================

export const queryKeys = {
  authMe: ["auth", "me"] as const,
  messages: (params?: MessagesQueryParams) => ["messages", params] as const,
  messageDetail: (id: string) => ["messages", id] as const,
  messageCounts: (mailboxId?: string) => ["messages", "counts", mailboxId] as const,
  mailboxes: ["mailboxes"] as const,
  folders: (mailboxId?: string) => ["folders", mailboxId] as const,
  domains: ["domains"] as const,
  drafts: (mailboxId?: string) => ["drafts", mailboxId] as const,
  contacts: (mailboxId: string, address: string) => ["contacts", mailboxId, address] as const,
};

// ============================================================================
// Auth Queries
// ============================================================================

export function useAuthMe() {
  return useQuery({
    queryKey: queryKeys.authMe,
    queryFn: async () => {
      const { data } = await apiClient.get<AuthMeResponse>("/api/auth/me");
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await apiClient.post<LoginResponse>("/api/auth/login", credentials);
      return data;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<LogoutResponse>("/api/auth/logout");
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ============================================================================
// Messages Queries
// ============================================================================

export function useMessages(params?: MessagesQueryParams) {
  return useQuery({
    queryKey: queryKeys.messages(params),
    queryFn: async () => {
      const { data } = await apiClient.get<MessagesResponse>("/api/messages", {
        params,
      });
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useInfiniteMessages(params?: Omit<MessagesQueryParams, "offset">) {
  const limit = params?.limit ?? 25;
  return useInfiniteQuery({
    queryKey: ["messages", "infinite", params],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await apiClient.get<MessagesResponse>("/api/messages", {
        params: {
          ...params,
          limit,
          offset: pageParam,
        },
      });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    staleTime: 30 * 1000,
  });
}

export function useMessageDetail(messageId: string) {
  return useQuery({
    queryKey: queryKeys.messageDetail(messageId),
    queryFn: async () => {
      const { data } = await apiClient.get<MessageDetailResponse>(
        `/api/messages/${messageId}`
      );
      return data;
    },
    enabled: !!messageId,
  });
}

export const useEmailDetail = useMessageDetail;

export function useMessageCounts(mailboxId?: string) {
  return useQuery({
    queryKey: queryKeys.messageCounts(mailboxId),
    queryFn: async () => {
      const { data } = await apiClient.get<MessageCountsResponse>("/api/messages/counts", {
        params: mailboxId ? { mailboxId } : undefined,
      });
      return data;
    },
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Message Mutations
// ============================================================================

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data } = await apiClient.post<SuccessResponse>(
        `/api/messages/${messageId}/read`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useUpdateMessageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      status,
    }: {
      messageId: string;
      status: string;
    }) => {
      const { data } = await apiClient.post<SuccessResponse>(
        `/api/messages/${messageId}/status`,
        { status } as MessageStatusPayload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useBulkMessageAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkMessagePayload) => {
      const { data } = await apiClient.post<SuccessResponse>(
        "/api/messages/bulk",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// ============================================================================
// Send Email
// ============================================================================

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendEmailRequest) => {
      const { data } = await apiClient.post<SendEmailResponse>("/api/send", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "counts"] });
    },
  });
}

// ============================================================================
// Drafts
// ============================================================================

export function useDrafts(mailboxId?: string) {
  return useQuery({
    queryKey: queryKeys.drafts(mailboxId),
    queryFn: async () => {
      const { data } = await apiClient.get<DraftsListResponse>("/api/drafts", {
        params: mailboxId ? { mailboxId } : undefined,
      });
      return data;
    },
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DraftPayload) => {
      const { data } = await apiClient.post<DraftResponse>("/api/drafts", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

// ============================================================================
// Mailboxes
// ============================================================================

export function useMailboxes() {
  return useQuery({
    queryKey: queryKeys.mailboxes,
    queryFn: async () => {
      const { data } = await apiClient.get<MailboxesResponse>("/api/mailboxes");
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Folders
// ============================================================================

export function useFolders(mailboxId?: string) {
  return useQuery({
    queryKey: queryKeys.folders(mailboxId),
    queryFn: async () => {
      const { data } = await apiClient.get<FoldersResponse>("/api/folders", {
        params: mailboxId ? { mailboxId } : undefined,
      });
      return data;
    },
    enabled: !!mailboxId,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFolderRequest) => {
      const { data } = await apiClient.post("/api/folders", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

// ============================================================================
// Domains
// ============================================================================

export function useDomains(includeDns = false) {
  return useQuery({
    queryKey: queryKeys.domains,
    queryFn: async () => {
      const { data } = await apiClient.get<DomainsResponse>("/api/domains", {
        params: includeDns ? { includeDns: "true" } : undefined,
      });
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Contacts
// ============================================================================

export function useContact(mailboxId: string, address: string) {
  return useQuery({
    queryKey: queryKeys.contacts(mailboxId, address),
    queryFn: async () => {
      const { data } = await apiClient.get<ContactResponse>("/api/contacts", {
        params: { mailboxId, address },
      });
      return data;
    },
    enabled: !!mailboxId && !!address,
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ContactUpdateRequest) => {
      const { data } = await apiClient.patch<ContactResponse>("/api/contacts", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// ============================================================================
// Profile
// ============================================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfileRequest) => {
      const { data } = await apiClient.patch<UpdateProfileResponse>(
        "/api/settings/profile",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authMe });
    },
  });
}

// ============================================================================
// Device Push Tokens
// ============================================================================

export function useRegisterDevice() {
  return useMutation({
    mutationFn: async (payload: DeviceRegisterRequest) => {
      const { data } = await apiClient.post<SuccessResponse>(
        "/api/devices/register",
        payload
      );
      return data;
    },
  });
}

export function useRevokeDevice() {
  return useMutation({
    mutationFn: async (payload: DeviceRevokeRequest) => {
      const { data } = await apiClient.post<SuccessResponse>(
        "/api/devices/revoke",
        payload
      );
      return data;
    },
  });
}
