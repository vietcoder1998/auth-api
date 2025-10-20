# Login As (Admin Impersonation) Feature - Implementation Guide

## Overview

The "Login As" feature allows authorized administrators to impersonate other users in the system. This is useful for customer support, troubleshooting, and administrative tasks where admins need to see the application from a specific user's perspective.

## 🔧 Backend Implementation

### 1. Authentication Middleware (`auth.middleware.ts`)

Created JWT token validation middleware that works alongside the existing Redis-based authentication:

```typescript
// Validates JWT tokens from database and user authentication
export async function jwtTokenValidation(req: Request, res: Response, next: NextFunction) {
  // Extracts Bearer token, validates JWT, checks database, sets user ID in headers
}
```

### 2. User Controller (`user.controller.ts`)

Added `loginAsUser` function with proper authentication and authorization:

**Key Features:**

- ✅ Admin permission validation (`user:impersonate` or `manage_users`)
- ✅ JWT token generation using same pattern as regular login
- ✅ Redis caching for tokens
- ✅ Database token storage
- ✅ Audit logging for security
- ✅ Proper error handling

```typescript
export async function loginAsUser(req: Request, res: Response) {
  // 1. Validate admin has proper permissions
  // 2. Find target user
  // 3. Generate JWT tokens (same as regular login)
  // 4. Store in database and Redis
  // 5. Return tokens and user info
}
```

### 3. User Routes (`user.routes.ts`)

Protected admin routes with JWT authentication:

```typescript
// POST /api/admin/users/login-as
router.post('/login-as', jwtTokenValidation, loginAsUser);
```

### 4. Database Schema (`schema.prisma`)

Enhanced Permission model with categories for better organization:

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String   @default("system") // user, role, permission, system, content, report, api
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  roles       Role[]
}
```

## 🎨 Frontend Implementation

### 1. Admin User List (`UserList.tsx`)

Enhanced user management interface with "Login As" functionality:

**Features:**

- ✅ Real user data from backend API
- ✅ User status validation (only active users can be impersonated)
- ✅ Loading states and error handling
- ✅ Token management and redirection
- ✅ Responsive table design

### 2. Login As Test Component (`LoginAsTest.tsx`)

Comprehensive testing interface for the complete flow:

**Test Steps:**

1. **Admin Login** - Authenticate as administrator
2. **Login As User** - Impersonate target user
3. **Protected Route Test** - Verify token works
4. **Navigation** - Redirect to user dashboard

## 🔐 Security Features

### 1. Permission-Based Access Control

- Only users with `user:impersonate` or `manage_users` permissions can use this feature
- Admin role validation with database lookup
- Prevents privilege escalation

### 2. Audit Trail

- All impersonation events are logged with:
  - Admin who performed the action
  - Target user being impersonated
  - Timestamp of the action

### 3. Token Security

- JWT tokens follow the same security pattern as regular login
- 1-hour expiration for access tokens
- 7-day expiration for refresh tokens
- Redis caching for performance and revocation

### 4. Input Validation

- Email validation for target users
- Active status check (inactive users cannot be impersonated)
- Proper error messages without information leakage

## 🚀 API Endpoints

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

Response:
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

### Login As User

```http
POST /api/admin/users/login-as
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "accessToken": "jwt_token_for_user",
  "refreshToken": "refresh_token_for_user",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "nickname": "User Name",
    "role": "user",
    "status": "active"
  },
  "impersonation": {
    "adminId": "admin_id",
    "adminEmail": "admin@example.com",
    "impersonatedAt": "2025-01-09T12:00:00.000Z"
  }
}
```

### Get Users (Admin)

```http
GET /api/admin/users
Authorization: Bearer <admin_jwt_token>

Response:
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "nickname": "User Name",
    "role": { "name": "user" },
    "status": "active"
  }
]
```

## 🧪 Testing

### Backend Testing

Run the test script to verify the complete flow:

```bash
cd auth-api
node test-login-as.js
```

### Frontend Testing

1. Navigate to `/admin/users` in the application
2. Use the "Login As" button on any active user
3. Verify redirection and token storage
4. Or use the dedicated test component at `/login-as-test`

## 📝 Usage Instructions

### For Administrators:

1. **Login** as an administrator with proper permissions
2. **Navigate** to the admin user list (`/admin/users`)
3. **Find** the user you want to impersonate
4. **Click** the "Login As" button next to their name
5. **Confirm** the action and wait for redirection
6. **Use** the application as that user

### For Developers:

1. **Ensure** user has proper permissions in the database
2. **Test** the flow using the test component
3. **Monitor** logs for audit trails
4. **Handle** errors appropriately in UI

## 🔄 Token Flow Compatibility

The implementation maintains full compatibility with the existing authentication system:

1. **Same JWT Structure**: Uses identical token generation as regular login
2. **Database Storage**: Tokens stored in same `Token` table
3. **Redis Caching**: Same caching pattern for performance
4. **Middleware Compatibility**: Works with both Redis and JWT validation

## 🛡️ Error Handling

### Common Error Scenarios:

- **401 Unauthorized**: No admin token provided
- **403 Forbidden**: Admin lacks impersonation permissions
- **404 Not Found**: Target user doesn't exist
- **400 Bad Request**: Target user is inactive
- **500 Internal Server Error**: Database or token generation issues

### Frontend Error Display:

- User-friendly error messages
- Loading states during API calls
- Retry mechanisms for failed requests
- Clear success feedback

## 📋 Checklist for Production

- [ ] Database permissions properly configured
- [ ] Admin users have `user:impersonate` permission
- [ ] JWT secret is secure and environment-specific
- [ ] Redis connection is stable
- [ ] Audit logging is enabled
- [ ] Error handling covers all edge cases
- [ ] Token expiration times are appropriate
- [ ] Frontend handles network failures gracefully
- [ ] Security testing completed
- [ ] Documentation updated

## 🔧 Configuration

### Environment Variables

```env
JWT_SECRET=your-secure-jwt-secret-key
REDIS_URL=redis://localhost:6379
DATABASE_URL=mysql://user:password@localhost:3306/database
```

### Database Permissions

Ensure admin users have the required permission:

```sql
-- Create permission if it doesn't exist
INSERT INTO Permission (name, category, description)
VALUES ('user:impersonate', 'user', 'Allows admin to login as other users');

-- Assign to admin role
INSERT INTO _PermissionToRole (A, B)
SELECT p.id, r.id
FROM Permission p, Role r
WHERE p.name = 'user:impersonate' AND r.name = 'admin';
```

This implementation provides a secure, auditable, and user-friendly admin impersonation feature that integrates seamlessly with the existing authentication system.
