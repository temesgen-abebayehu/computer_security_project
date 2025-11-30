# Recruitment & Applicant Tracking System (Backend)

## Project Overview
This is the backend for a secure Recruitment & Applicant Tracking System. It implements strict security measures including MAC, DAC, RBAC, RuBAC, ABAC, MFA, and comprehensive logging.

## Features

### Access Control
- **MAC (Mandatory Access Control)**: Users have sensitivity levels (public, internal, confidential). Access to resources is denied if user level < resource level.
- **DAC (Discretionary Access Control)**: Resource owners can share files with specific users.
- **RBAC (Role-Based Access Control)**: Roles (admin, manager, employee) restrict access to routes.
- **RuBAC (Rule-Based Access Control)**: Access to resources is restricted to working hours (9 AM - 5 PM).
- **ABAC (Attribute-Based Access Control)**: Middleware available to check user attributes (department, etc.).

### Authentication
- **Registration**: Includes Captcha verification (backend stub).
- **Login**: Secure login with bcrypt password hashing.
- **MFA**: Email-based OTP (One-Time Password).
- **Account Lockout**: Locks account after 5 failed attempts.
- **JWT**: Secure token-based authentication.

### Security & Logging
- **Logging**: Centralized logging using Winston (logs to `server/logs/`).
- **Security Headers**: Helmet, XSS-Clean, HPP, Mongo-Sanitize.
- **Rate Limiting**: Limits repeated requests.

### Backups
- **Script**: `npm run backup` (runs `scripts/backup.js` using `mongodump`).

## Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Variables**
   - Check `server/.env` and update credentials (SMTP, MongoDB, etc.).

3. **Run Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

4. **Run Backup**
   ```bash
   node scripts/backup.js
   ```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/verify-otp` - Verify MFA OTP
- `GET /api/v1/auth/me` - Get current user

### Resources
- `POST /api/v1/resources` - Create resource
- `GET /api/v1/resources/:id` - Get resource (Protected by MAC, DAC, RuBAC)
- `PUT /api/v1/resources/:id/share` - Share resource (DAC)
