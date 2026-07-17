# NestJS Audit Logger Service

A lightweight, **app-based, multi-tenant audit logging service** built with NestJS and MongoDB (Mongoose).

Any client — web app, mobile app, backend service, cron job, third-party integration, etc. — can send audit events to this service by identifying itself with a unique `appId`. The service stores each event as an audit log entry, scoped to that `appId`, so multiple unrelated applications/clients can share the same audit logging service without their data mixing.

---

## Core Concept: App-Based Context

Instead of tightly coupling this service to one specific application, every audit log is tagged with an `appId`.

- Each client (web, mobile, internal service, etc.) is assigned or generates its own `appId`.
- All create/read operations are scoped by `appId`.
- One audit logger, many apps — no need to spin up separate audit infrastructure per client.

```
Web App        ──┐
Mobile App     ──┼──► Audit Logger Service ──► MongoDB (audit_logs collection)
Internal API   ──┘         (scoped by appId)
```

---

## Features

- Create audit logs with action type, status, and before/after snapshots
- Fetch all audit logs for a given `appId`
- Fetch specific audit logs by `transactionId` + `appId`
- Flexible `before` / `after` snapshot fields (accepts **any** JSON shape — perfect for diffing arbitrary entities)
- Enum-based `actionType` and `status` for consistency across clients
- Built-in request validation (`class-validator` + global `ValidationPipe`)
- API key guard to protect endpoints
- Structured logging via NestJS `Logger`

---

## Tech Stack

- [NestJS](https://nestjs.com/)
- [Mongoose](https://mongoosejs.com/) (MongoDB ODM)
- `class-validator` / `class-transformer` for DTO validation

---

## Project Structure

```
src/
├── audit/
│   ├── dto/
│   │   └── create-audit.dto.ts
│   ├── schemas/
│   │   └── audit-log.schema.ts
│   ├── audit.controller.ts
│   ├── audit.service.ts
│   └── audit.module.ts
├── common/
│   ├── enums/
│   │   ├── action-type.enum.ts
│   │   ├── audit-status.enum.ts
│   │   └── index.ts
│   └── guards/
│       └── api-key.guard.ts
└── main.ts
```

---

## Setup

### 1. Install dependencies

```bash
npm install @nestjs/mongoose mongoose class-validator class-transformer
```

### 2. Configure MongoDB connection

In your root `AppModule`:

```typescript
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/audit-db'),
    AuditModule,
  ],
})
export class AppModule {}
```

### 3. Enable global validation

In `main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### 4. Set your API key

The `ApiKeyGuard` protects all `/audit` routes. Configure the expected key (e.g. via `.env`) according to how your `ApiKeyGuard` reads it (header, env var, etc.).

```
API_KEY=your-secret-key
```

### 5. Run the service

```bash
npm run start:dev
```

---

## Using the Service (Any Client)

Any client — regardless of platform — talks to this service over plain HTTP using its own `appId`. There is no SDK required; it's just REST calls.

### Identify your client with an `appId`

Pick a stable, unique identifier for each client/application, e.g.:

- `web-dashboard`
- `mobile-ios-app`
- `mobile-android-app`
- `internal-billing-service`

Use the same `appId` consistently for every audit log that client sends, and when querying logs back.

### Example: logging an action from a web client

```bash
curl -X POST http://localhost:7004/audit/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{
    "appId": "web-dashboard",
    "trasnsactionId": "txn_98765",
    "title": "User profile updated",
    "description": "Admin updated the user'\''s email and phone number",
    "performedBy": "user_admin_001",
    "actionType": "update",
    "before": { "email": "old@example.com" },
    "after": { "email": "new@example.com" }
  }'
```

### Example: logging an action from a mobile client

Same endpoint, different `appId`:

```json
{
  "appId": "mobile-ios-app",
  "trasnsactionId": "txn_11223",
  "title": "Order cancelled",
  "description": "User cancelled their order from the mobile app",
  "performedBy": "user_555",
  "actionType": "cancel"
}
```

Both logs live in the same `audit_logs` collection but are fully separated by `appId` when queried.

See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for full endpoint details, request/response shapes, and error codes.

---

## Notes

- `before` / `after` fields accept **any JSON shape** (`Mixed` type in Mongoose) — you can snapshot a full entity, a partial diff, or nothing at all.
- `status` defaults to `pending` if omitted on creation.
- All timestamps (`createdAt`, `updatedAt`) are handled automatically by Mongoose (`timestamps: true`).