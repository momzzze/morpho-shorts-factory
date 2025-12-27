# Authentication System Documentation

## Overview

Complete JWT-based authentication system with:

- User registration with email/password
- User login with JWT token generation
- Protected routes via middleware
- Token expiration (7 days)
- Password hashing with bcrypt (10 salt rounds)

## Architecture

```
routes/auth/
  └── index.ts          # Auth endpoints: /register, /login, /me

controllers/
  └── authController.ts # Request/response handling

services/
  └── authService.ts    # Business logic & database operations

middleware/
  └── auth.ts           # JWT verification middleware
```

## API Endpoints

### 1. Register User

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe", // optional
  "displayName": "John Doe" // optional
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid123",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "tier": "FREE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### 2. Login User

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid123",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "tier": "FREE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### 3. Get Current User (Protected)

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "tier": "FREE",
    "storageUsedMb": 0,
    "storageQuotaMb": 1000,
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-12-28T10:00:00Z",
    "lastLoginAt": "2025-12-28T10:30:00Z"
  }
}
```

## Protecting Routes

### Using authenticate middleware

```typescript
import { authenticate } from '../../middleware/auth.js';

// Protect entire route
router.use(authenticate);

// Or protect specific endpoints
router.get('/protected', authenticate, (req, res) => {
  const userId = req.userId; // Available after authentication
  res.json({ message: 'This is protected', userId });
});
```

### Example: Protect messages routes

```typescript
// apps/api/src/routes/messages/index.ts
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// All message routes now require authentication
router.use(authenticate);

router.get('/', messageController.getAllMessages);
router.post('/', messageController.createMessage);
```

### Optional authentication

For routes that work for both authenticated and guest users:

```typescript
import { optionalAuth } from '../../middleware/auth.js';

router.get('/public-data', optionalAuth, (req, res) => {
  if (req.userId) {
    // User is authenticated - show personalized data
  } else {
    // Guest user - show public data
  }
});
```

## Environment Setup

Add to your `.env` file:

```bash
# Generate a secure JWT secret (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Or generate one with Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Error Responses

### 400 - Validation Error

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

### 401 - Authentication Error

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

### 409 - Conflict

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

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123",
    "username": "testuser"
  }'
```

### Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123"
  }'
```

### Get current user (use token from login response)

```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Security Features

✅ **Password Hashing**: bcrypt with 10 salt rounds  
✅ **JWT Tokens**: 7-day expiration  
✅ **Validation**: Zod schemas for input validation  
✅ **Email Uniqueness**: Enforced at database level  
✅ **Username Uniqueness**: Enforced at database level  
✅ **Account Status**: Checks if user is active before login  
✅ **Last Login Tracking**: Updates on successful login  
✅ **Strong Password**: Minimum 8 characters required

## Next Steps

1. **Email Verification**: Add email verification flow
2. **Password Reset**: Implement forgot password functionality
3. **Refresh Tokens**: Add refresh token mechanism
4. **Rate Limiting**: Add rate limiting to auth endpoints
5. **2FA**: Implement two-factor authentication
