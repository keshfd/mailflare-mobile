/**
 * Navigation type definitions for the Mailflare mobile app.
 *
 * Three navigation stacks:
 * 1. ServerSetupStack — Shown when no server URL is configured
 * 2. AuthStack — Shown when not authenticated
 * 3. MainStack — The main app after authentication
 */

export type RootStackParamList = {
  ServerSetup: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Inbox: { mailboxId?: string; folderId?: string } | undefined;
  MessageDetail: { messageId: string };
  Compose: {
    replyTo?: string;
    replySubject?: string;
    replyMessageId?: string;
    mailboxId?: string;
  } | undefined;
  Drafts: undefined;
  Sent: undefined;
  Spam: undefined;
  Trash: undefined;
  Archived: undefined;
  FolderView: { folderId: string; folderName: string };
  Settings: undefined;
};
