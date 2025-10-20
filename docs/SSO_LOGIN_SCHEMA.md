# SSO Login Schema & Architecture

## 🏗️ **Database Schema**

### **Entity Relationship Diagram**

```mermaid
erDiagram
    User ||--o{ SSO : has
    User ||--o{ LoginHistory : creates
    User ||--o{ LogicHistory : performs
    User }|--|| Role : belongs_to
    Role ||--o{ Permission : has
    SSO ||--o{ LoginHistory : tracks

    User {
        string id PK
        string email UK
        string password
        string nickname
        string roleId FK
        string status
        datetime createdAt
        datetime updatedAt
    }

    Role {
        string id PK
        string name UK
        datetime createdAt
        datetime updatedAt
    }

    Permission {
        string id PK
        string name UK
        string description
        string category
        string route
        string method
        datetime createdAt
        datetime updatedAt
    }

    SSO {
        string id PK
        string url
        string key UK "Primary Auth Key"
        string ssoKey UK "Secondary Auth Key"
        string userId FK
        string deviceIP
        boolean isActive
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    LoginHistory {
        string id PK
        string ssoId FK
        string userId FK
        string deviceIP
        string userAgent
        string location
        string status
        datetime loginAt
        datetime createdAt
        datetime updatedAt
    }

    LogicHistory {
        string id PK
        string userId FK
        string action
        string resource
        json details
        string deviceIP
        string userAgent
        datetime createdAt
    }
```

## 🔄 **SSO Authentication Flow**

### **Complete SSO Login Process**

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as Auth API
    participant DB as Database
    participant History as History Service

    Note over Client, History: SSO Authentication Flow

    Client->>API: POST /api/sso-auth/login
    Note right of Client: Headers: x-sso-key: {ssoKey}
    Note right of Client: Body: {deviceIP, userAgent, location}

    API->>API: Extract x-sso-key header

    alt SSO Key Validation
        API->>DB: SELECT * FROM sso WHERE key = {ssoKey} OR ssoKey = {ssoKey}
        DB-->>API: SSO Entry + User Data

        API->>API: Validate SSO Entry
        Note right of API: Check: isActive, user.status, expiresAt

        alt Validation Success
            API->>DB: INSERT INTO loginHistory
            DB-->>API: Login History Created

            API->>History: Record SSO Login Action
            History->>DB: INSERT INTO logicHistory
            DB-->>History: Logic History Created

            API-->>Client: Success Response
            Note left of API: {loginHistory, user, sso}
        else Validation Failed
            API-->>Client: 401 Unauthorized
            Note left of API: {error: "Invalid/Expired SSO"}
        end
    else No SSO Key
        API-->>Client: 401 Unauthorized
        Note left API: {error: "SSO authentication required"}
    end
```

## 🔐 **SSO Key Validation Schema**

### **Dual Key Authentication System**

```mermaid
flowchart TD
    A[Client Request with x-sso-key] --> B{Extract SSO Key}
    B --> C[Query Database]
    C --> D{Find SSO Entry}

    D -->|key = ssoKey| E[Match via Primary Key]
    D -->|ssoKey = ssoKey| F[Match via Secondary Key]
    D -->|No Match| G[Authentication Failed]

    E --> H[Validate SSO Entry]
    F --> H
    H --> I{Is Active?}
    I -->|No| J[Entry Inactive]
    I -->|Yes| K{User Active?}
    K -->|No| L[User Inactive]
    K -->|Yes| M{Not Expired?}
    M -->|No| N[Entry Expired]
    M -->|Yes| O[Authentication Success]

    G --> P[Return 401 Error]
    J --> P
    L --> P
    N --> P
    O --> Q[Create Login History]
    Q --> R[Record Logic History]
    R --> S[Return Success Response]

    style O fill:#90EE90
    style P fill:#FFB6C1
    style E fill:#87CEEB
    style F fill:#87CEEB
```

## 🛠️ **API Endpoints Schema**

### **SSO Authentication Endpoints**

```mermaid
graph LR
    subgraph "SSO Auth Routes (/api/sso-auth)"
        A[POST /login] --> A1[SSO Login with History]
        B[GET /validate] --> B1[Header-based Validation]
        C[POST /validate-key] --> C1[Direct Key Validation]
        D[GET /me] --> D1[Get SSO User Info]
        E[POST /logout] --> E1[SSO Logout]
    end

    subgraph "SSO Management (/api/sso)"
        F[GET /] --> F1[List SSO Entries]
        G[POST /] --> G1[Create SSO Entry]
        H[GET /:id] --> H1[Get SSO by ID]
        I[PUT /:id] --> I1[Update SSO Entry]
        J[DELETE /:id] --> J1[Delete SSO Entry]
        K[GET /stats] --> K1[Get SSO Statistics]
    end

    style A fill:#90EE90
    style C fill:#87CEEB
    style G fill:#FFD700
```

## 📊 **Data Flow Architecture**

### **SSO System Components**

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Admin UI]
        APP[Client Applications]
    end

    subgraph "API Layer"
        MW[SSO Middleware]
        CTRL[SSO Controller]
        ROUTES[SSO Routes]
        UTILS[Validation Utils]
    end

    subgraph "Service Layer"
        HS[History Service]
        VS[Validation Service]
    end

    subgraph "Database Layer"
        SSO_DB[(SSO Table)]
        USER_DB[(User Table)]
        LOGIN_DB[(Login History)]
        LOGIC_DB[(Logic History)]
        ROLE_DB[(Role & Permissions)]
    end

    UI --> ROUTES
    APP --> MW
    MW --> UTILS
    ROUTES --> CTRL
    CTRL --> VS
    CTRL --> HS
    VS --> SSO_DB
    VS --> USER_DB
    HS --> LOGIN_DB
    HS --> LOGIC_DB
    USER_DB --> ROLE_DB

    style MW fill:#FFD700
    style UTILS fill:#87CEEB
    style SSO_DB fill:#90EE90
```

## 🔑 **SSO Key Types & Usage**

### **Key Structure and Validation**

```mermaid
classDiagram
    class SSOEntry {
        +string id
        +string url
        +string key (Primary)
        +string ssoKey (Secondary)
        +string userId
        +string deviceIP
        +boolean isActive
        +DateTime expiresAt
        +validateKey(inputKey) boolean
        +isExpired() boolean
        +getUserPermissions() Permission[]
    }

    class PrimaryKey {
        +string value (64 chars)
        +generated crypto.randomBytes(32).toString('hex')
        +unique true
        +required true
    }

    class SecondaryKey {
        +string value (16+ chars)
        +generated from URL domain or random
        +unique true
        +required false
    }

    class User {
        +string id
        +string email
        +string status
        +Role role
        +Permission[] permissions
    }

    SSOEntry ||--|| PrimaryKey : has
    SSOEntry ||--o| SecondaryKey : has
    SSOEntry ||--|| User : belongs_to

    note for SSOEntry "Both key and ssoKey can be used for authentication"
    note for SecondaryKey "Optional custom key for easier identification"
```

## 🔄 **State Machine for SSO Session**

### **SSO Authentication States**

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Validating : Provide SSO Key
    Validating --> Authenticated : Valid Key + Active User
    Validating --> Unauthenticated : Invalid Key
    Validating --> Inactive : Valid Key + Inactive User/SSO
    Validating --> Expired : Valid Key + Expired SSO

    Authenticated --> LoggedIn : Create Login History
    LoggedIn --> Active : Normal Operations

    Active --> Active : API Requests with Key
    Active --> Expired : SSO Expires
    Active --> Inactive : User/SSO Deactivated
    Active --> LoggedOut : Explicit Logout

    Expired --> [*]
    Inactive --> [*]
    LoggedOut --> [*]

    note right of Validating : Check key/ssoKey in database
    note right of Active : All API operations available
    note right of Expired : Time-based expiration
```

## 📋 **Request/Response Schema**

### **SSO Login Request**

```json
{
  "endpoint": "POST /api/sso-auth/login",
  "headers": {
    "x-sso-key": "string (required)",
    "content-type": "application/json"
  },
  "body": {
    "deviceIP": "string (optional)",
    "userAgent": "string (optional)",
    "location": "string (optional)"
  }
}
```

### **SSO Login Response**

```json
{
  "success": true,
  "data": {
    "loginHistory": {
      "id": "uuid",
      "ssoId": "uuid",
      "userId": "uuid",
      "deviceIP": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "location": "New York, US",
      "status": "active",
      "loginAt": "2025-10-15T10:30:00Z"
    },
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "John Doe",
      "roleId": "uuid",
      "permissions": ["read", "write"]
    },
    "sso": {
      "id": "uuid",
      "url": "https://app.example.com",
      "isActive": true,
      "expiresAt": "2025-12-31T23:59:59Z"
    }
  }
}
```

### **Key Validation Schema**

```json
{
  "endpoint": "POST /api/sso-auth/validate-key",
  "body": {
    "ssoKey": "string (required)"
  },
  "response": {
    "valid": "boolean",
    "matchedKeyType": "key | ssoKey",
    "sso": {
      "id": "uuid",
      "url": "string",
      "userId": "uuid",
      "isActive": "boolean",
      "expiresAt": "datetime | null"
    },
    "user": {
      "id": "uuid",
      "email": "string",
      "nickname": "string"
    },
    "error": "string (if invalid)"
  }
}
```

## 🏢 **System Architecture Overview**

### **Complete SSO Ecosystem**

```mermaid
architecture-beta
    group api(logos:fastapi)[Auth API]

    service db(logos:mysql)[MySQL Database] in api
    service redis(logos:redis)[Redis Cache] in api
    service prisma(logos:prisma)[Prisma ORM] in api

    group auth(logos:auth0)[Authentication Layer]
    service sso(logos:oauth)[SSO Service] in auth
    service jwt(logos:jwt)[JWT Service] in auth
    service rbac(logos:shield)[RBAC Service] in auth

    group ui(logos:react)[Frontend]
    service admin(logos:react)[Admin Panel] in ui
    service client(logos:javascript)[Client Apps] in ui

    group external[External Systems]
    service app1(logos:chrome)[App 1] in external
    service app2(logos:firefox)[App 2] in external
    service app3(logos:safari)[App 3] in external

    admin:R --> L:sso
    client:R --> L:sso
    app1:R --> L:sso
    app2:R --> L:sso
    app3:R --> L:sso

    sso:R --> L:prisma
    jwt:R --> L:prisma
    rbac:R --> L:prisma

    prisma:R --> L:db
    sso:R --> L:redis
```

This comprehensive schema shows the complete SSO login system architecture, data flows, and all the validation processes involved in the authentication system! 🎉
