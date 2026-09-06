// ============================================================================
// Mailflare Mobile — TypeScript Interfaces
// Derived directly from the Mailflare web server Drizzle schema.
// These interfaces represent API response shapes, NOT database rows.
// ============================================================================

// --- Users ---

export interface User {
  id: string;
  email: string;
  name: string;
  resetEmail: string | null;
  role: "admin" | "user";
  canManageMailboxes: boolean;
  hasAvatar: boolean;
}

export interface AuthMeResponse {
  user: User;
  hasMailboxes: boolean;
  isSetup: boolean;
}

// --- Auth ---

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface LoginResponse {
  ok: true;
  token: string;
  redirect: string;
}

export interface RegisterRequest {
  domain: string;
  username: string;
  password: string;
  resetEmail?: string;
  turnstileToken?: string;
}

export interface RegisterResponse {
  ok: true;
  token: string;
  redirect: string;
}

export interface LogoutResponse {
  ok: true;
}

// --- Domains ---

export interface Domain {
  id: string;
  userId: string;
  hostname: string;
  zoneId: string;
  status: "pending" | "active" | "error";
  routingStatus: string | null;
  sendingSubdomainTag: string | null;
  sendingEnabled: boolean;
  routingEnabled: boolean;
  createdAt: string;
}

export interface DomainsResponse {
  domains: Domain[];
  dns?: Record<string, DnsStatusSummary>;
}

export interface DnsStatusSummary {
  routing: "ok" | "partial" | "missing";
  sending: "ok" | "partial" | "missing" | "disabled";
}

// --- Mailboxes ---

export interface Mailbox {
  id: string;
  userId: string;
  domainId: string;
  localPart: string;
  displayName: string | null;
  avatarKey: string | null;
  type: "personal" | "shared";
  disabled: boolean;
  createdAt: string;
}

export interface MailboxesResponse {
  mailboxes: Mailbox[];
}

// --- Contacts ---

export interface Contact {
  email: string;
  displayName: string | null;
  source: "manual" | "inbound" | "outbound" | null;
  blocked: boolean;
  lastSeenAt: string | null;
}

export interface ContactResponse {
  contact: Contact;
}

export interface ContactUpdateRequest {
  mailboxId: string;
  address: string;
  displayName: string;
}

// --- Folders ---

export interface Folder {
  id: string;
  userId: string;
  mailboxId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface FoldersResponse {
  folders: Folder[];
}

export interface CreateFolderRequest {
  mailboxId: string;
  name: string;
  color?: string;
}

// --- Messages ---

export interface Message {
  id: string;
  userId: string;
  mailboxId: string | null;
  direction: "inbound" | "outbound";
  providerMessageId: string | null;
  folderId: string | null;
  fromAddr: string;
  toAddr: string;
  subject: string | null;
  snippet: string | null;
  status: string;
  read: boolean;
  threadId: string | null;
  createdAt: string;
  // Enriched fields from the API
  fromContactName?: string | null;
  toContactName?: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessagesQueryParams {
  direction?: "inbound" | "outbound";
  mailboxId?: string;
  folderId?: string;
  status?: string;
  q?: string;
  title?: string;
  read?: "read" | "unread";
  limit?: number;
  offset?: number;
}

// --- Message Detail ---

export interface MessageBody {
  textBody: string | null;
  htmlBody: string | null;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  disposition: "attachment" | "inline";
  contentId: string | null;
}

export interface MessageDetailResponse {
  message: Message;
  body: MessageBody;
  attachments: MessageAttachment[];
}

// --- Message Actions ---

export interface MessageStatusPayload {
  status: string;
}

export type BulkMessageAction =
  | "archive"
  | "trash"
  | "spam"
  | "read"
  | "unread"
  | "inbox"
  | "folder";

export interface BulkMessagePayload {
  messageIds: string[];
  action: BulkMessageAction;
  folderId?: string;
}

// --- Message Counts ---

export interface FolderCount {
  total: number;
  unread: number;
}

export interface MessageCounts {
  inbox: FolderCount;
  sent: FolderCount;
  spam: FolderCount;
  trash: FolderCount;
  archived: FolderCount;
  drafts: FolderCount;
  [key: string]: FolderCount;
}

export interface MessageCountsResponse {
  counts: MessageCounts;
}

// --- Send Email ---

export interface SendEmailRequest {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  mailboxId?: string;
}

export interface SendEmailResponse {
  messageId: string;
  status: "queued";
}

// --- Drafts ---

export interface DraftPayload {
  mailboxId?: string | null;
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
}

export interface DraftResponse {
  draft: { id: string };
}

export interface DraftsListResponse {
  drafts: Message[];
}

// --- Profile ---

export interface UpdateProfileRequest {
  name: string;
  resetEmail?: string;
}

export interface UpdateProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    resetEmail: string | null;
  };
}

// --- API Errors ---

export interface ApiError {
  error: string | ValidationError;
}

export interface ValidationError {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

// --- Generic API Response ---

export interface SuccessResponse {
  success?: true;
  ok?: true;
}

// --- Device Push Tokens ---

export interface DeviceRegisterRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface DeviceRevokeRequest {
  token: string;
}
