# CSR Connect - API Endpoints Summary

## 🚀 **Registration APIs**

### **Corporate Registration**

```
POST /api/corporate/register
```

**Content-Type:** `multipart/form-data`

**Body Fields:**

- `companyName` (string, required)
- `cinNumber` (string, required)
- `email` (string, required)
- `phone` (string, required)
- `website` (string, optional)
- `address` (string, required)
- `city` (string, required)
- `state` (string, required)
- `pincode` (string, required)
- `csrBudget` (string, required)
- `committeeSize` (number, required)
- `focusArea` (string, required)
- `regions` (string, required)
- `password` (string, required)
- `terms` (boolean, required)

**Files:**

- `registrationCert` (file, required) - Company Registration Certificate
- `csrPolicy` (file, required) - CSR Policy Document

**Response:**

```json
{
  "success": true,
  "message": "Corporate registration successful. Your account is under review.",
  "token": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "data": {
    "user": {
      "id": "uuid",
      "email": "corporate@example.com",
      "user_type": "corporate",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "profile": {
      "id": "uuid",
      "company_name": "Example Corp",
      "cin_number": "U12345AB6789CD01234"
    },
    "documents": [...]
  }
}
```

### **NGO Registration**

```
POST /api/ngo/register
```

**Content-Type:** `multipart/form-data`

**Body Fields:**

- `orgName` (string, required)
- `panNumber` (string, required)
- `email` (string, required)
- `phone` (string, required)
- `description` (string, required)
- `establishmentYear` (number, required)
- `focusArea` (string, required)
- `address` (string, required)
- `city` (string, required)
- `state` (string, required)
- `pincode` (string, required)
- `password` (string, required)
- `terms` (boolean, required)

**Files:**

- `ngoImage` (file, required) - NGO Organization Image
- `FCRACert` (file, required) - FCRA Certificate
- `80gCert` (file, required) - 80G Tax Exemption Certificate
- `16ACert` (file, required) - 16A Tax Exemption Certificate
- `TrustDeedCert` (file, required) - Trust Deed Certificate

**Response:**

```json
{
  "success": true,
  "message": "NGO registration successful. Your account is under review.",
  "token": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "data": {
    "user": {
      "id": "uuid",
      "email": "ngo@example.com",
      "user_type": "ngo",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "profile": {
      "id": "uuid",
      "organization_name": "Example NGO",
      "pan_number": "ABCDE1234F"
    },
    "documents": [...]
  }
}
```

## 🔐 **Authentication APIs**

### **Login**

```
POST /api/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_type": "corporate|ngo",
    "status": "verified|pending|rejected|suspended",
    "profile": {
      "company_name": "Example Corp", // for corporate
      "organization_name": "Example NGO" // for ngo
    }
  }
}
```

### **Refresh Token**

```
POST /api/auth/refresh
```

**Body:**

```json
{
  "refreshToken": "jwt_refresh_token_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token"
}
```

### **Logout**

```
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

## ✅ **Validation APIs**

### **Check Email Availability**

```
POST /api/auth/check-email
```

**Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "available": true,
  "message": "Email is available"
}
```

### **Check CIN Number (Corporate)**

```
POST /api/corporate/check-cin
```

**Body:**

```json
{
  "cinNumber": "U12345AB6789CD01234"
}
```

### **Check PAN Number (NGO)**

```
POST /api/ngo/check-pan
```

**Body:**

```json
{
  "panNumber": "ABCDE1234F"
}
```

## 📄 **Document Management APIs**

### **Get Document Types**

```
GET /api/documents/types?userType=corporate|ngo
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "document_types": [
    {
      "id": 1,
      "type_name": "company_registration_cert",
      "description": "Company Registration Certificate",
      "max_file_size_mb": 5,
      "allowed_extensions": ["pdf", "jpg", "jpeg", "png"]
    }
  ]
}
```

### **Get User Documents**

```
GET /api/documents/my-documents
```

**Headers:** `Authorization: Bearer <token>`

### **Upload Additional Document**

```
POST /api/documents/upload
```

**Content-Type:** `multipart/form-data`
**Headers:** `Authorization: Bearer <token>`

**Body:**

- `document` (file, required)
- `documentTypeId` (number, required)

## 👤 **User Profile APIs**

### **Get Current User Profile**

```
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_type": "corporate|ngo",
    "status": "verified|pending|rejected|suspended",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T00:00:00Z",
    "profile": {
      // Corporate profile fields or NGO profile fields
    },
    "documents": [
      {
        "id": "uuid",
        "original_filename": "certificate.pdf",
        "upload_status": "verified|uploaded|rejected",
        "uploaded_at": "2024-01-01T00:00:00Z",
        "type_name": "company_registration_cert"
      }
    ]
  }
}
```

### **Update Corporate Profile**

```
PUT /api/profile/corporate
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "companyName": "Updated Corp Name",
  "website": "https://example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "pincode": "12345",
  "csrBudget": "1000000",
  "committeeSize": 5,
  "focusArea": "Education",
  "regions": "North India"
}
```

### **Update NGO Profile**

```
PUT /api/profile/ngo
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "orgName": "Updated NGO Name",
  "phone": "+1234567890",
  "description": "Updated description",
  "establishmentYear": 2020,
  "focusArea": "Healthcare",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "pincode": "12345"
}
```

### **Change Password**

```
PUT /api/auth/change-password
```

**Headers:** `Authorization: Bearer <token>`

**Body:**

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

## 🔧 **File Upload Configuration**

- **Max file size:** 5MB
- **Allowed file types:** PDF, JPG, JPEG, PNG
- **Upload directory:** `server/uploads/`
- **Static file serving:** `/uploads/*` → `server/uploads/*`

## 🛡️ **Security Features**

- **Password hashing:** bcrypt with 12 salt rounds
- **JWT authentication:** 15-minute access token + 7-day refresh token
- **Role-based access control:** Corporate, NGO, and Admin roles
- **File type validation:** Server-side validation
- **Database transactions:** ACID compliance for registration
- **Input validation:** Required field checking
- **Duplicate prevention:** Email, CIN, PAN uniqueness
- **Token refresh mechanism:** Automatic token renewal

## 👨‍💼 **Admin APIs**

### **Get All Users**

```
GET /api/admin/users?page=1&limit=10&status=pending&userType=corporate
```

**Headers:** `Authorization: Bearer <admin_token>`

### **Update User Status**

```
PUT /api/admin/users/:userId/status
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**

```json
{
  "status": "verified|rejected|suspended",
  "notes": "Verification notes"
}
```

### **Get User Documents**

```
GET /api/admin/users/:userId/documents
```

**Headers:** `Authorization: Bearer <admin_token>`

### **Verify Document**

```
PUT /api/admin/documents/:documentId/verify
```

**Headers:** `Authorization: Bearer <admin_token>`

**Body:**

```json
{
  "status": "verified|rejected",
  "notes": "Verification notes"
}
```

### **Admin Dashboard**

```
GET /api/admin/dashboard
```

**Headers:** `Authorization: Bearer <admin_token>`

## 📊 **Database Tables Used**

1. `users` - Base user accounts
2. `corporate_profiles` - Corporate user details
3. `ngo_profiles` - NGO user details
4. `document_types` - Document type definitions
5. `documents` - Uploaded file records
6. `user_activity_logs` - Audit trail
7. `user_status_logs` - Admin action logs

## 🚨 **Error Handling**

All APIs return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created (Registration)
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid credentials)
- `404` - Not Found
- `500` - Internal Server Error

## 🔄 **Next Steps**

1. **Run the database schema** to create tables
2. **Update your frontend** to use these new endpoints
3. **Test registration flows** for both user types
4. **Implement admin verification** for pending accounts
5. **Add project management APIs** for NGOs
6. **Add CSR funding APIs** for corporates
