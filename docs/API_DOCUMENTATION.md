# API Documentation — Audit Logger Service

Base URL (local): `http://localhost:7004`

All endpoints are under the `/audit` prefix and protected by `ApiKeyGuard`.

## Authentication

Every request must include a valid API key (header name depends on your `ApiKeyGuard` implementation, typically):

```
x-api-key: your-secret-key
```

Requests without a valid key receive a `401 Unauthorized`.

---

## Enums

### `ActionType`

| Value | Description |
|---|---|
| `create` | A resource was created |
| `update` | A resource was updated |
| `delete` | A resource was soft-deleted |
| `export` | Data was exported |
| `import` | Data was imported |
| `read` | A resource was viewed/read |
| `restore` | A soft-deleted resource was restored |
| `force_delete` | A resource was permanently deleted |
| `verify` | A resource/action was verified |
| `approve` | An action/request was approved |
| `reject` | An action/request was rejected |
| `cancel` | An action/request was cancelled |
| `assign` | Something was assigned to an entity |
| `unassign` | Something was unassigned |
| `archive` | A resource was archived |
| `unarchive` | A resource was unarchived |
| `enable` | A feature/resource was enabled |
| `disable` | A feature/resource was disabled |
| `publish` | A resource was published |
| `unpublish` | A resource was unpublished |
| `lock` | A resource was locked |
| `unlock` | A resource was unlocked |
| `activate` | A resource/account was activated |
| `deactivate` | A resource/account was deactivated |
| `suspend` | A resource/account was suspended |
| `unsuspend` | A resource/account was un-suspended |
| `grant` | Access/permission was granted |
| `revoke` | Access/permission was revoked |
| `other` | Anything not covered above |

### `AuditStatus`

| Value | Description |
|---|---|
| `pending` | Log created, not yet processed/sent |
| `processing` | Currently being processed |
| `sent` | Successfully delivered/recorded |
| `failed` | Processing/delivery failed |
| `retried` | A failed log was retried |

---

## Endpoints

### 1. Create Audit Log

```
POST /audit/create
```

Creates a new audit log entry, scoped to the given `appId`.

#### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `appId` | `string` | ✅ | Identifier of the client application (web, mobile, service, etc.) |
| `trasnsactionId` | `string` | ✅ | Identifier linking related events together (not required to be unique) |
| `title` | `string` | ✅ | Short title of the event |
| `description` | `string` | ✅ | Detailed description of the event |
| `performedBy` | `string` | ✅ | Identifier of the user/system that performed the action |
| `actionType` | `ActionType` (enum) | ✅ | Type of action performed |
| `status` | `AuditStatus` (enum) | ❌ | Defaults to `pending` if omitted |
| `before` | `object` | ❌ | Snapshot of the entity **before** the change (any shape) |
| `after` | `object` | ❌ | Snapshot of the entity **after** the change (any shape) |

#### Example Request

```json
{
  "appId": "app_12345",
  "trasnsactionId": "txn_98765",
  "title": "User profile updated",
  "description": "Admin updated the user's email and phone number",
  "performedBy": "user_admin_001",
  "actionType": "update",
  "status": "sent",
  "before": {
    "email": "old.email@example.com",
    "phone": "+1234567890"
  },
  "after": {
    "email": "new.email@example.com",
    "phone": "+0987654321"
  }
}
```

#### Success Response — `201 Created`

```json
{
  "_id": "665f1b2c8e4a1a0012a3f9d1",
  "appId": "app_12345",
  "trasnsactionId": "txn_98765",
  "title": "User profile updated",
  "description": "Admin updated the user's email and phone number",
  "performedBy": "user_admin_001",
  "actionType": "update",
  "status": "sent",
  "before": { "email": "old.email@example.com", "phone": "+1234567890" },
  "after": { "email": "new.email@example.com", "phone": "+0987654321" },
  "createdAt": "2026-07-17T08:00:00.000Z",
  "updatedAt": "2026-07-17T08:00:00.000Z",
  "__v": 0
}
```

#### Error Responses

| Status | Reason |
|---|---|
| `400 Bad Request` | Missing required field, invalid enum value, or extra unrecognized field |
| `401 Unauthorized` | Missing or invalid API key |

```json
{
  "statusCode": 400,
  "message": [
    "performedBy should not be empty",
    "actionType must be a valid enum value"
  ],
  "error": "Bad Request"
}
```

---

### 2. Get All Audit Logs by App

```
GET /audit/get/:appId
```

Fetches **all** audit logs belonging to the given `appId`, sorted newest first.

#### Path Parameters

| Param | Type | Description |
|---|---|---|
| `appId` | `string` | The client application identifier |

#### Example Request

```
GET /audit/get/app_12345
```

#### Success Response — `200 OK`

```json
[
  {
    "_id": "665f1b2c8e4a1a0012a3f9d1",
    "appId": "app_12345",
    "trasnsactionId": "txn_98765",
    "title": "User profile updated",
    "description": "Admin updated the user's email and phone number",
    "performedBy": "user_admin_001",
    "actionType": "update",
    "status": "sent",
    "before": { "email": "old.email@example.com" },
    "after": { "email": "new.email@example.com" },
    "createdAt": "2026-07-17T08:00:00.000Z",
    "updatedAt": "2026-07-17T08:00:00.000Z"
  }
]
```

#### Error Responses

| Status | Reason |
|---|---|
| `404 Not Found` | No audit logs exist for the given `appId` |
| `401 Unauthorized` | Missing or invalid API key |

```json
{
  "statusCode": 404,
  "message": "No audit logs found for appId=app_12345",
  "error": "Not Found"
}
```

---

### 3. Get Audit Logs by Transaction ID + App

```
GET /audit/get/:transactionId/:appId
```

Fetches **all** audit logs matching both `transactionId` and `appId` (since `transactionId` is not unique, multiple logs can share the same value), sorted newest first.

#### Path Parameters

| Param | Type | Description |
|---|---|---|
| `transactionId` | `string` | The transaction identifier to filter by |
| `appId` | `string` | The client application identifier |

#### Example Request

```
GET /audit/get/txn_98765/app_12345
```

#### Success Response — `200 OK`

```json
[
  {
    "_id": "665f1b2c8e4a1a0012a3f9d1",
    "appId": "app_12345",
    "trasnsactionId": "txn_98765",
    "title": "User profile updated",
    "description": "Admin updated the user's email and phone number",
    "performedBy": "user_admin_001",
    "actionType": "update",
    "status": "sent",
    "createdAt": "2026-07-17T08:00:00.000Z",
    "updatedAt": "2026-07-17T08:00:00.000Z"
  },
  {
    "_id": "665f1b2c8e4a1a0012a3f9d2",
    "appId": "app_12345",
    "trasnsactionId": "txn_98765",
    "title": "User email verified",
    "description": "System verified the updated email address",
    "performedBy": "system",
    "actionType": "verify",
    "status": "sent",
    "createdAt": "2026-07-17T08:05:00.000Z",
    "updatedAt": "2026-07-17T08:05:00.000Z"
  }
]
```

#### Error Responses

| Status | Reason |
|---|---|
| `404 Not Found` | No audit logs match the given `transactionId` + `appId` |
| `401 Unauthorized` | Missing or invalid API key |

```json
{
  "statusCode": 404,
  "message": "No audit logs found for transactionId=txn_98765 and appId=app_12345",
  "error": "Not Found"
}
```

---

## Usage Pattern for Any Client (Web / Mobile / Backend)

Since this service is app-based, integration is the same regardless of platform — just call the REST endpoints with your client's `appId`:

1. **Assign an `appId`** to each client/application once (e.g. `web-dashboard`, `mobile-ios-app`, `partner-service-x`).
2. **On every user/system action worth auditing**, call `POST /audit/create` with that `appId`, a `trasnsactionId` (to group related events), and optional `before`/`after` snapshots.
3. **To view history for your app**, call `GET /audit/get/:appId`.
4. **To trace a specific transaction/flow**, call `GET /audit/get/:transactionId/:appId`.

Example flow for a checkout process (mobile app):

```
1. POST /audit/create  { appId: "mobile-ios-app", trasnsactionId: "checkout_abc", actionType: "create", title: "Checkout started" }
2. POST /audit/create  { appId: "mobile-ios-app", trasnsactionId: "checkout_abc", actionType: "verify", title: "Payment verified" }
3. POST /audit/create  { appId: "mobile-ios-app", trasnsactionId: "checkout_abc", actionType: "update", title: "Order confirmed" }

Later:
GET /audit/get/checkout_abc/mobile-ios-app
→ returns all 3 events in order, giving a full audit trail of the checkout flow.
```