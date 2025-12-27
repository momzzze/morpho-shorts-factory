# Postman Setup Guide for Auth Endpoints

## Option 1: Import Collection (Recommended)

1. **Import the collection:**
   - In Postman, click **Import** button
   - Select `apps/api/postman-auth-collection.json`
   - The collection will be added to your workspace

2. **Set up environment variable:**
   - Create or select an environment
   - Add variable: `baseUrl` = `http://localhost:5001`
   - The `authToken` variable will be auto-saved when you login/register

3. **Start testing:**
   - Make sure your API is running (`pnpm dev:api`)
   - Run "Register User" or "Login User" - token is automatically saved
   - Run "Get Current User" - uses saved token automatically

---

## Option 2: Manual Setup

### 1. Register User

**POST** `http://localhost:5001/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "testPassword123",
  "username": "testuser",
  "displayName": "Test User"
}
```

**Tests Script (Auto-save token):**
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set('authToken', jsonData.data.token);
        console.log('Token saved!');
    }
}
```

---

### 2. Login User

**POST** `http://localhost:5001/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "testPassword123"
}
```

**Tests Script (Auto-save token):**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.token) {
        pm.environment.set('authToken', jsonData.data.token);
        console.log('Token saved!');
    }
}
```

---

### 3. Get Current User (Protected)

**GET** `http://localhost:5001/api/auth/me`

**Headers:**
```
Authorization: Bearer {{authToken}}
```

*Note: `{{authToken}}` is automatically populated from the environment variable saved during login/register*

---

## Environment Variables Setup

Create a Postman environment with these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `baseUrl` | `http://localhost:5001` | `http://localhost:5001` |
| `authToken` | *(leave empty)* | *(auto-populated after login)* |

---

## Testing Workflow

1. **First time:**
   - Run "Register User" → Token automatically saved
   
2. **Subsequent tests:**
   - Run "Login User" → Token automatically saved
   - Run "Get Current User" → Uses saved token

3. **Testing protected routes:**
   - Any protected endpoint can use: `Authorization: Bearer {{authToken}}`
   - Token persists across requests in your environment

---

## Expected Responses

### Register Success (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm5bj1234567890",
      "email": "test@example.com",
      "username": "testuser",
      "displayName": "Test User",
      "tier": "FREE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### Login Success (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm5bj1234567890",
      "email": "test@example.com",
      "username": "testuser",
      "displayName": "Test User",
      "tier": "FREE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### Get Current User (200)
```json
{
  "success": true,
  "data": {
    "id": "cm5bj1234567890",
    "email": "test@example.com",
    "username": "testuser",
    "displayName": "Test User",
    "avatarUrl": null,
    "tier": "FREE",
    "storageUsedMb": 0,
    "storageQuotaMb": 1000,
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-12-28T10:00:00.000Z",
    "lastLoginAt": "2025-12-28T10:30:00.000Z"
  }
}
```

---

## Common Errors

### 400 - Weak Password
```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 8 characters long",
    "code": "WEAK_PASSWORD",
    "statusCode": 400
  }
}
```

### 401 - Invalid Credentials
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS",
    "statusCode": 401
  }
}
```

### 401 - No Token
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "NO_TOKEN",
    "statusCode": 401
  }
}
```

### 409 - User Exists
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS",
    "statusCode": 409
  }
}
```

---

## Tips

✅ **Auto-save tokens:** Use the Tests scripts to automatically save tokens  
✅ **Environment variables:** Use `{{variable}}` syntax for dynamic values  
✅ **Collections:** Organize requests by feature (auth, messages, etc.)  
✅ **Pre-request scripts:** Can auto-refresh expired tokens  
✅ **Console:** Check console output to verify token was saved
