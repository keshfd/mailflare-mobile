# Mailflare API Contract

> **Generated from:** `C:\Users\User\Documents\WebstormProjects\mailflare`
> **Target consumer:** `mailflare-mobile` React Native / Expo client
> **Architecture:** Thin API consumer - no business logic duplication

---

## 1. Infrastructure Overview

Mailflare runs as a **Cloudflare Worker** (Next.js on OpenNext) with:

| Resource         | Binding       | Purpose                              |
|------------------|---------------|--------------------------------------|
| D1 Database      | `DB`          | Primary relational store (SQLite)    |
| R2 Bucket        | `BUCKET`      | Raw email & attachment blob storage  |
| Queues (Inbound) | `INBOUND_QUEUE`  | Async inbound email processing    |
| Queues (Outbound)| `OUTBOUND_QUEUE` | Async outbound email delivery     |
| Durable Object   | `REALTIME`    | WebSocket-based realtime hub         |
| Images           | `IMAGES`      | Cloudflare Image transforms          |
| Rate Limiter     | `LOGIN_RATE_LIMIT` | 20 req/60s on login              |
| Workflow         | `DATABASE_BACKUP_WORKFLOW` | Scheduled DB backups (2 AM) |

---

## 2. Data Models

### 2.1 Users
```typescript
interface User {
  id: string;                    // e.g. "usr_xxx"
  email: string;                 // unique
  resetEmail: string | null;     // recovery email
  name: string;
  avatarKey: string | null;
  role: "admin" | "user";
  disabled: boolean;
  canManageMailboxes: boolean;
  createdByUserId: string | null;
  createdAt: Date;
}
```

### 2.2 Domains
```typescript
interface Domain {
  id: string;
  userId: string;
  hostname: string;               // unique index
  zoneId: string;
  status: "pending" | "active" | "error";
  routingStatus: string | null;
  sendingSubdomainTag: string | null;
  sendingEnabled: boolean;
  routingEnabled: boolean;
  createdAt: Date;
}
```

### 2.3 Mailboxes
```typescript
interface Mailbox {
  id: string;                     // e.g. "mbx_xxx"
  userId: string;
  domainId: string;
  localPart: string;
  displayName: string | null;
  avatarKey: string | null;
  type: "personal" | "shared";
  disabled: boolean;
  createdAt: Date;
}
```

### 2.4 Mailbox Access
```typescript
interface MailboxAccess {
  id: string;
  mailboxId: string;
  userId: string;
  permission: "read_only" | "send_as" | "send_on_behalf" | "full_access";
  createdByUserId: string | null;
  createdAt: Date;
}
```

### 2.5 Contacts
```typescript
interface Contact {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  source: "manual" | "inbound" | "outbound";
  blocked: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
}
```

### 2.6 Folders
```typescript
interface Folder {
  id: string;
  userId: string;
  mailboxId: string;
  name: string;
  color: string;                  // hex, default "#2563eb"
  createdAt: Date;
}
```

### 2.7 API Keys
```typescript
interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: string;                 // JSON array
  createdAt: Date;
  lastUsedAt: Date | null;
}
```

### 2.8 Messages
```typescript
interface Message {
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
  status: string;                 // "received" | "sent" | "draft" | "spam" | "trash" | "archived"
  read: boolean;
  threadId: string | null;
  createdAt: Date;
}
```

### 2.9 Message Bodies
```typescript
interface MessageBody {
  id: string;
  messageId: string;
  textBody: string | null;
  htmlBody: string | null;
  rawR2Key: string | null;
}
```

### 2.10 Message Attachments
```typescript
interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  disposition: "attachment" | "inline";
  contentId: string | null;
  r2Key: string;
  createdAt: Date;
}
```

### 2.11 Sessions
```typescript
interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;                // 30 days
  createdAt: Date;
}
```

### 2.12 Routing Rules
```typescript
interface RoutingRule {
  id: string;
  userId: string;
  domainId: string;
  pattern: string;
  matchField: "email" | "content" | "title";
  matchOperator: "contains" | "exact";
  matchValue: string;
  mailboxId: string | null;
  folderId: string | null;
  action: "store" | "forward" | "reject" | "spam" | "trash";
  forwardTo: string | null;
  priority: number;
  createdAt: Date;
}
```

---

## 3. Authentication

### 3.1 Session-Based Auth (Primary for Mobile)

Two mechanisms, both checked in `getCurrentUser()`:

#### Bearer Token (Recommended for Mobile)
```
Authorization: Bearer <session_token>
```
- Token returned in login response body as `token`
- Token has `sess_` prefix
- Server hashes with SHA-256, looks up `sessions` table
- Expires after **30 days**
- Store in `expo-secure-store`

#### Cookie-Based (Web only)
- Cookie name: `ep_session`
- Not applicable to mobile

### 3.2 API Key Auth (V1 API only)
- Used for `/api/v1/*` endpoints
- Scopes: `read`, `send`

### 3.3 Turnstile Verification
- Login and register require a `turnstileToken` field
- For mobile: may need WebView or server config to skip

### 3.4 Rate Limiting
- Login: 20 attempts per 60s per IP

---

## 4. API Endpoints

### 4.1 Authentication

#### `POST /api/auth/login`
Request: `{ "email", "password", "turnstileToken?" }`
Response: `{ "ok": true, "token": "sess_xxx", "redirect": "/inbox" }`
Errors: 400, 401, 403, 429

#### `POST /api/auth/register`
Request: `{ "domain", "username", "password", "resetEmail", "turnstileToken?" }`
Response: `{ "ok": true, "token": "sess_xxx", "redirect": "/inbox" }`
Errors: 403, 409, 502

#### `POST /api/auth/logout`
Headers: `Authorization: Bearer <token>`
Response: `{ "ok": true }`

#### `GET /api/auth/me`
Response: `{ "user": { id, email, name, resetEmail, role, canManageMailboxes, hasAvatar }, "hasMailboxes", "isSetup" }`
Errors: 401

### 4.2 Messages

#### `GET /api/messages`
Query: direction, mailboxId, folderId, status, q, title, read, limit(50), offset(0)
Response: `{ "messages": [...], "total", "limit", "offset" }`

#### `GET /api/messages/:messageId`
Response: `{ "message", "body": { textBody, htmlBody }, "attachments": [...] }`

#### `POST /api/messages/:messageId/read`
Response: `{ "success": true }`

#### `POST /api/messages/:messageId/status`
Request: `{ "status": "archived"|"trash"|"spam"|"received" }`
Response: `{ "success": true }`

#### `POST /api/messages/bulk`
Request: `{ "messageIds": [...], "action": "archive"|"trash"|"spam"|"read"|"unread"|"inbox"|"folder", "folderId?" }`
Response: `{ "ok": true }`

#### `GET /api/messages/counts?mailboxId=`
Response: `{ "counts": { inbox: {total, unread}, sent, spam, trash, archived, drafts } }`

#### `GET /api/messages/:messageId/attachments/:attachmentId`
Response: Binary stream

### 4.3 Email Sending

#### `POST /api/send`
Request: `{ "from", "to", "subject", "text?", "html?", "mailboxId?", "attachments?" }`
Response: `{ "messageId", "status": "queued" }`

### 4.4 Drafts

#### `GET /api/drafts?mailboxId=`
Response: `{ "drafts": [...] }`

#### `POST /api/drafts`
Request: `{ "mailboxId?", "from?", "to?", "subject?", "text?", "html?" }`
Response: `{ "draft": { "id" } }`

#### `PUT /api/drafts/:id`
#### `DELETE /api/drafts/:id`

### 4.5 Mailboxes

#### `GET /api/mailboxes`
Response: `{ "mailboxes": [...] }`

#### `POST /api/mailboxes`
Request: `{ "domainId", "localPart", "displayName?", "ownerUserId?" }`

### 4.6 Folders

#### `GET /api/folders?mailboxId=`
Response: `{ "folders": [...] }`

#### `POST /api/folders`
Request: `{ "mailboxId", "name", "color?" }`

### 4.7 Contacts

#### `GET /api/contacts?mailboxId=&address=`
Response: `{ "contact": { email, displayName, source, blocked, lastSeenAt } }`

#### `PATCH /api/contacts`
Request: `{ "mailboxId", "address", "displayName" }`

#### `POST /api/contacts/block`

### 4.8 Domains

#### `GET /api/domains?includeDns=true`
Response: `{ "domains": [...], "dns?" }`

#### `POST /api/domains`
Request: `{ "hostname", "enableRouting?", "enableSending?" }`

### 4.9 User Profile

#### `PATCH /api/settings/profile`
Request: `{ "name", "resetEmail" }`

#### `PATCH /api/settings/password`

#### `GET/POST /api/profile/avatar`

### 4.10 Realtime (WebSocket)

#### `GET /api/realtime` (WebSocket Upgrade)

### 4.11 Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/accounts` | GET/POST | List/create accounts |
| `/api/accounts/:id` | GET/PATCH/DELETE | Manage account |
| `/api/accounts/:id/mailbox-access` | GET/POST | Mailbox access |
| `/api/api-keys` | GET/POST | API keys |
| `/api/audit-logs` | GET | Audit logs |
| `/api/activity` | GET | Auth activity |
| `/api/backups` | GET/POST | Backups |
| `/api/branding` | GET/PATCH | Branding |
| `/api/licenses` | GET | License info |
| `/api/routing-rules` | GET/POST | Routing rules |
| `/api/webhooks` | GET/POST/PATCH/DELETE | Webhooks |
| `/api/setup/status` | GET | Setup status |

---

## 5. Error Response Format

```json
{ "error": "Human-readable message" }
```
Or with validation:
```json
{ "error": { "formErrors": [], "fieldErrors": { "email": ["Invalid"] } } }
```

Status codes: 400, 401, 403, 404, 409, 413, 429, 502

---

## 6. Mobile Client Implementation Notes

### Authentication Strategy
1. Store session token in `expo-secure-store`
2. Attach as `Authorization: Bearer <token>` to all requests
3. On 401, redirect to login
4. Re-login when token expires (30 days)

### Base URL Configuration
- Use `EXPO_PUBLIC_MAILFLARE_API_URL` env var if available
- Otherwise, prompt user to enter server URL on first launch
- Persist in `AsyncStorage`

### Turnstile/CAPTCHA
- Login/register require Turnstile tokens on web
- Mobile: configure server to skip, or use WebView
