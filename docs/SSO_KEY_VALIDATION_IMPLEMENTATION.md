# SSO Key Validation Implementation

## ✅ **Complete SSO Key Validation System**

### 🎯 **Overview**
Enhanced the SSO authentication system to validate both `key` and `ssoKey` fields in the SSO entity, providing flexible authentication options.

### 📋 **Updated Files**

#### **1. SSO Middleware** (`src/middlewares/sso.middleware.ts`)
- ✅ **Enhanced SSO Key Validation**: Now validates both `key` and `ssoKey` fields
- ✅ **Improved Logging**: Shows which key type (primary key vs ssoKey) was matched
- ✅ **Utility Integration**: Uses new validation utilities for consistent logic

```typescript
// Find SSO entry by either key or ssoKey
const ssoEntry = await prisma.sSO.findFirst({
  where: { 
    OR: [
      { key: ssoKey },
      { ssoKey: ssoKey }
    ]
  },
  // ... include user data
});
```

#### **2. SSO Controller** (`src/controllers/sso.controller.ts`)
- ✅ **Search Enhancement**: Added `ssoKey` to search functionality
- ✅ **Create Validation**: Proper uniqueness validation for `ssoKey`
- ✅ **Update Validation**: Handles `ssoKey` updates with uniqueness checks
- ✅ **Auto Generation**: Smart SSO key generation from URL or random

```typescript
// Enhanced search to include ssoKey
where.OR = [
  { url: { contains: search, mode: 'insensitive' } },
  { key: { contains: search, mode: 'insensitive' } },
  { ssoKey: { contains: search, mode: 'insensitive' } }, // NEW
  { deviceIP: { contains: search, mode: 'insensitive' } },
  // ... user fields
];
```

#### **3. SSO Validation Routes** (`src/routes/ssoAuth.routes.ts`)
- ✅ **Direct Key Validation**: New `/validate-key` endpoint for direct validation
- ✅ **Enhanced Response**: Includes both `key` and `ssoKey` in responses
- ✅ **Match Type Logging**: Shows which key type was matched

```typescript
// New direct validation endpoint
router.post('/validate-key', async (req: Request, res: Response) => {
  const { ssoKey } = req.body;
  const validation = await SSOValidationUtils.validateSSOKey(ssoKey);
  // ... returns validation result with match type
});
```

#### **4. SSO Validation Utilities** (`src/utils/ssoValidation.ts`) - **NEW FILE**
- ✅ **Comprehensive Validation**: `SSOValidationUtils.validateSSOKey()`
- ✅ **Uniqueness Checking**: `checkSSOKeyUniqueness()` and `checkPrimaryKeyUniqueness()`
- ✅ **Smart Key Generation**: `generateUniqueSSOKey()` with URL-based generation
- ✅ **Header Extraction**: `extractAndValidateSSOKey()` utility

### 🔑 **Key Features**

#### **1. Dual Key Support**
```typescript
// Both keys can be used for authentication
x-sso-key: primary_64_character_key_here
x-sso-key: custom_sso_key_here
```

#### **2. Smart Key Generation**
```typescript
// URL-based: https://app.example.com → app_example_com_abc123
// Random fallback: random_16_character_string
const ssoKey = await SSOValidationUtils.generateUniqueSSOKey(url);
```

#### **3. Comprehensive Validation**
```typescript
const validation = await SSOValidationUtils.validateSSOKey(ssoKey);
// Returns: { valid, ssoEntry, matchedKeyType, error }
```

#### **4. Enhanced Logging**
```
[SSO] SSO entry found via primary key: sso-id-123
[SSO] SSO entry found via ssoKey: sso-id-456
```

### 🚀 **API Endpoints**

#### **1. Direct Key Validation**
```http
POST /api/sso-auth/validate-key
Content-Type: application/json

{
  "ssoKey": "your-key-here"
}
```

**Response:**
```json
{
  "valid": true,
  "matchedKeyType": "ssoKey",
  "sso": {
    "id": "uuid",
    "url": "https://app.example.com",
    "userId": "user-uuid",
    "isActive": true,
    "expiresAt": null
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "nickname": "User Name"
  }
}
```

#### **2. Header-based Validation**
```http
GET /api/sso-auth/validate
x-sso-key: your-key-here
```

**Response:**
```json
{
  "valid": true,
  "sso": {
    "id": "uuid",
    "url": "https://app.example.com",
    "key": "primary-key",
    "ssoKey": "secondary-key",
    "userId": "user-uuid",
    "isActive": true,
    "expiresAt": null
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "nickname": "User Name"
  }
}
```

### 🛡️ **Validation Logic**

#### **1. Key Matching**
```typescript
// Check both key fields
OR: [
  { key: providedSSOKey },
  { ssoKey: providedSSOKey }
]
```

#### **2. Status Validation**
- ✅ SSO entry must be active (`isActive: true`)
- ✅ User account must be active (`status: 'active'`)
- ✅ Entry must not be expired (`expiresAt` check)

#### **3. Uniqueness Constraints**
- ✅ Primary `key` must be unique
- ✅ `ssoKey` must be unique (if provided)
- ✅ Proper validation on create/update operations

### 🔧 **Usage Examples**

#### **1. Creating SSO Entry with Custom ssoKey**
```javascript
const response = await fetch('/api/sso/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://app.example.com',
    userId: 'user-uuid',
    ssoKey: 'custom_key_123' // Optional custom key
  })
});
```

#### **2. Authenticating with ssoKey**
```javascript
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'x-sso-key': 'custom_key_123' // Works with either key or ssoKey
  }
});
```

#### **3. Validating Key Directly**
```javascript
const validation = await SSOValidationUtils.validateSSOKey('some-key');
if (validation.valid) {
  console.log(`Authenticated via ${validation.matchedKeyType}`);
}
```

### 📊 **Database Schema**
```sql
CREATE TABLE sso (
  id VARCHAR(191) PRIMARY KEY,
  url VARCHAR(191) NOT NULL,
  key VARCHAR(191) UNIQUE NOT NULL,        -- Primary authentication key
  ssoKey VARCHAR(191) UNIQUE NULL,         -- Secondary authentication key
  userId VARCHAR(191) NOT NULL,
  deviceIP VARCHAR(191) NULL,
  isActive BOOLEAN DEFAULT TRUE,
  expiresAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 🎯 **Next Steps**
1. **Run Migration**: Apply the database migration for `ssoKey` field
2. **Test Endpoints**: Validate both key types work correctly
3. **Update Frontend**: Ensure UI handles both key types properly
4. **Documentation**: Update API documentation with new validation methods

### 🔍 **Testing**
```bash
# Test primary key validation
curl -X POST http://localhost:3000/api/sso-auth/validate-key \
  -H "Content-Type: application/json" \
  -d '{"ssoKey":"primary-key-value"}'

# Test ssoKey validation  
curl -X POST http://localhost:3000/api/sso-auth/validate-key \
  -H "Content-Type: application/json" \
  -d '{"ssoKey":"custom-sso-key-value"}'

# Test header-based authentication
curl -X GET http://localhost:3000/api/sso-auth/validate \
  -H "x-sso-key: your-key-here"
```

The SSO key validation system now provides comprehensive support for both primary keys and custom ssoKeys with proper validation, uniqueness checking, and enhanced logging! 🎉