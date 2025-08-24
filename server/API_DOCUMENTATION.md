# Wellness Session Platform API Documentation

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "user"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe"
  }
}
```

### POST /api/auth/login

Login and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe"
  }
}
```

## Wellness Sessions Endpoints

### GET /api/sessions

Get all public wellness sessions (published only).

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Morning Yoga Routine",
      "tags": "yoga,morning,stretching",
      "content_url": "https://example.com/yoga.json",
      "content_data": {...},
      "is_published": true,
      "is_draft": false,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "author_name": "John Doe"
    }
  ]
}
```

### GET /api/my-sessions

Get user's own sessions (both draft and published). Requires authentication.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "sessions": [...]
}
```

### GET /api/my-sessions/:id

Get a specific user session by ID. Requires authentication.

**Response:**

```json
{
  "success": true,
  "session": {...}
}
```

### POST /api/my-sessions/save-draft

Save or update a draft session. Requires authentication.

**Request Body:**

```json
{
  "id": 123, // optional - for updating existing session
  "title": "My Yoga Session",
  "tags": "yoga,meditation,wellness",
  "content_url": "https://example.com/session.json",
  "content_data": {
    "poses": [...],
    "duration": 30
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Draft saved successfully",
  "session": {...}
}
```

### POST /api/my-sessions/publish

Publish a session. Requires authentication.

**Request Body:**

```json
{
  "id": 123
}
```

**Response:**

```json
{
  "success": true,
  "message": "Session published successfully",
  "session": {...}
}
```

### DELETE /api/my-sessions/:id

Delete a session. Requires authentication.

**Response:**

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

## Authentication Middleware

All protected endpoints require JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```
