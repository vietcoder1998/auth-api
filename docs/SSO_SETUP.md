# SSO Authentication System

This authentication API now supports SSO (Single Sign-On) authentication using the `x-sso-key` header alongside traditional JWT authentication.

## Overview

The SSO system allows external applications to authenticate users by providing a unique SSO key in the request headers. This key is validated against the database and provides access to user information and permissions.

## Authentication Flow

### 1. SSO Key Generation

SSO entries are created through the admin interface or API with:

- `url`: The application URL
- `userId`: The user ID this SSO entry belongs to
- `key`: Auto-generated 64-character hex string
- `isActive`: Boolean flag to enable/disable
- `expiresAt`: Optional expiration date

### 2. SSO Authentication

Include the SSO key in request headers:

```
x-sso-key: your-64-character-sso-key-here
```

### 3. Middleware Chain

1. **SSO Validation** (`ssoKeyValidation`): Validates the SSO key and loads user info
2. **JWT Validation** (`jwtTokenValidation`): Skipped if SSO is valid
3. **RBAC** (`rbac`): Enforces role-based access control for both SSO and JWT users

## API Endpoints

### SSO Authentication Endpoints (`/api/sso/`)

#### POST `/api/sso/login`

Login using SSO key and create login history.

**Headers:**

```
x-sso-key: your-sso-key
Content-Type: application/json
```

**Body:**

```json
{
  "deviceIP": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "location": "New York, US"
}
```

**Response:**

```json
{
  "success": true,
  "message": "SSO login successful",
  "data": {
    "loginHistory": {...},
    "sso": {...},
    "user": {...}
  }
}
```

#### POST `/api/sso/logout`

Logout SSO session and update login history.

**Headers:**

```
x-sso-key: your-sso-key
```

**Body:**

```json
{
  "loginHistoryId": "optional-login-history-id"
}
```

#### GET `/api/sso/me`

Get current user information via SSO.

**Headers:**

```
x-sso-key: your-sso-key
```

**Response:**

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "nickname": "User Name",
  "role": {
    "name": "admin",
    "permissions": [...]
  },
  "sso": {
    "id": "sso-id",
    "url": "https://app.example.com",
    "isActive": true
  }
}
```

#### GET `/api/sso/validate`

Validate SSO key without side effects.

**Headers:**

```
x-sso-key: your-sso-key
```

**Response:**

```json
{
  "valid": true,
  "sso": {...},
  "user": {...}
}
```

### SSO Management Endpoints (`/api/admin/sso/`)

#### GET `/api/admin/sso`

List all SSO entries with pagination and filtering.

#### POST `/api/admin/sso`

Create new SSO entry.

#### PUT `/api/admin/sso/:id`

Update SSO entry.

#### DELETE `/api/admin/sso/:id`

Delete SSO entry.

#### PATCH `/api/admin/sso/:id/regenerate-key`

Regenerate SSO key.

## Usage Examples

### 1. Creating SSO Entry

```bash
curl -X POST http://localhost:3000/api/admin/sso \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://my-app.example.com",
    "userId": "user-id-here",
    "deviceIP": "192.168.1.100"
  }'
```

### 2. Using SSO Authentication

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "x-sso-key: your-64-character-sso-key-here"
```

### 3. SSO Login

```bash
curl -X POST http://localhost:3000/api/sso/login \
  -H "x-sso-key: your-sso-key" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIP": "192.168.1.100",
    "location": "Office"
  }'
```

## Security Considerations

1. **Key Generation**: SSO keys are 64-character random hex strings
2. **Expiration**: SSO entries can have expiration dates
3. **Active Status**: SSO entries can be disabled without deletion
4. **User Status**: Inactive users cannot authenticate via SSO
5. **Audit Trail**: All SSO logins/logouts are logged in login and logic history
6. **HTTPS Only**: SSO keys should only be transmitted over HTTPS in production

## Database Schema

### SSO Table

```sql
model SSO {
  id          String   @id @default(uuid())
  url         String
  key         String   @unique
  userId      String
  deviceIP    String?
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  user        User     @relation(fields: [userId], references: [id])
  loginHistory LoginHistory[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Error Handling

- `401 Unauthorized`: Invalid or expired SSO key
- `401 Unauthorized`: Inactive SSO entry or user
- `403 Forbidden`: Insufficient permissions for requested resource
- `500 Internal Server Error`: Database or server errors

## Monitoring and Logging

- All SSO authentication attempts are logged
- Login/logout actions create audit trail entries
- Failed authentication attempts are tracked
- Performance metrics available through cache middleware

## Integration Guide

1. **Create SSO Entry**: Use admin API to create SSO entry for your application
2. **Store SSO Key**: Securely store the generated SSO key in your application
3. **Add Header**: Include `x-sso-key` header in all API requests
4. **Handle Responses**: Implement proper error handling for authentication failures
5. **Session Management**: Use SSO login/logout endpoints for session tracking
