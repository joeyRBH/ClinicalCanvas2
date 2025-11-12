# HealthCanvas Login System

## Overview
HealthCanvas now has a complete authentication system for healthcare providers to access the EHR platform.

## Authentication Endpoints

### 1. Provider Authentication
**Endpoint:** `/api/provider-auth`
- **Method:** POST
- **Purpose:** Provider/admin login
- **Request Body:**
```json
{
  "email": "admin@healthcanvas.com",
  "password": "admin123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@healthcanvas.com",
    "fullName": "Admin User",
    "role": "admin"
  }
}
```

### 2. Setup Admin User
**Endpoint:** `/api/setup-admin`
- **Method:** POST
- **Purpose:** Initialize default admin account
- **Response:** Creates admin user with default credentials

## Default Credentials

### Admin Account
- **Email:** `admin@healthcanvas.com`
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change the default password after first login in production!

## Setup Instructions

### Step 1: Initialize Database
Make sure your database is set up by calling:
```bash
POST /api/setup-database
POST /api/setup-tables
```

### Step 2: Create Admin User
Call the setup endpoint to create the default admin:
```bash
POST /api/setup-admin
```

### Step 3: Login
1. Navigate to your application URL (e.g., te-st-er-rcun.vercel.app)
2. Enter the admin credentials:
   - Email: `admin@healthcanvas.com`
   - Password: `admin123`
3. Click "Sign In"

## Security Features

- **Password Hashing:** Uses bcrypt with salt rounds of 10
- **JWT Tokens:** 7-day expiration for session management
- **Legacy Support:** Automatically upgrades SHA256 hashes to bcrypt on login
- **Token Storage:** Tokens stored in localStorage as `healthcanvas_token`
- **Audit Logging:** Login events tracked in audit_log table (when available)

## Frontend Integration

The login form is located at `public/index.html` (lines 27-56) and authentication logic is in `public/app.js` (lines 19-89).

### Key Features:
- Email-based login
- Token persistence across sessions
- Automatic redirect to dashboard on successful login
- User profile display with initials
- Secure logout functionality

## Testing the Login

1. **Via Browser:**
   - Go to https://te-st-er-rcun.vercel.app
   - Use admin credentials to login
   - You should be redirected to the dashboard

2. **Via API (curl):**
```bash
curl -X POST https://te-st-er-rcun.vercel.app/api/provider-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthcanvas.com","password":"admin123"}'
```

## Troubleshooting

### "Invalid credentials" error
- Ensure the admin user has been created via `/api/setup-admin`
- Check that email/password are correct
- Verify database connection

### "Database unavailable" error
- Check DATABASE_URL environment variable
- Ensure database tables are created via `/api/setup-tables`

### Token not persisting
- Check browser localStorage
- Ensure cookies are enabled
- Check CORS headers in API responses

## API Response Codes

- `200`: Successful login
- `400`: Missing required fields
- `401`: Invalid credentials
- `403`: Account inactive
- `500`: Server error

## Next Steps

After logging in, you can:
1. Explore the dashboard
2. Add clients/patients
3. Schedule appointments
4. Create clinical notes
5. Use telehealth features
6. Manage billing and payments

## Security Recommendations for Production

1. ✅ Change default admin password immediately
2. ✅ Set strong JWT_SECRET in environment variables
3. ✅ Enable HTTPS only
4. ✅ Implement password complexity requirements
5. ✅ Add rate limiting for login attempts
6. ✅ Enable two-factor authentication (2FA)
7. ✅ Regular security audits
8. ✅ Implement HIPAA compliance measures
