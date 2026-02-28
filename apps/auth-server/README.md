# Auth Server

High-performance authentication service built with NestJS and Better Auth. This service handles user registration, session management, and OAuth integrations for the Lidcode monorepo.

## Integration Guidance

### Core Concepts
- **SSO Strategy**: Uses HTTP-only cookies for session management. This enables seamless Single Sign-On across subdomains when configured correctly.
- **Security**: LocalStorage-based bearer tokens are strongly discouraged for web integrations. Rely on secure, server-side cookies.
- **API Base Path**: All authentication routes are mounted at `/v1/auth`.

### Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3340` |
| `BASE_URL` | Public URL of the auth server | (Required) |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `[]` (Denies all in prod) |
| `AUTH_COOKIE_DOMAIN` | Domain for cross-subdomain cookies (e.g., `.lidcode.com`) | (Optional) |
| `AUTH_COOKIE_SAMESITE` | Cookie SameSite policy (`lax`, `strict`, `none`) | `lax` |
| `AUTH_COOKIE_SECURE` | Set to `true` for HTTPS environments | `false` |
| `BETTER_AUTH_SECRET` | 32+ character random string | (Required) |
| `RESEND_API_KEY` | API key for email delivery | (Required) |

### Integration Checklist for Web Apps

1.  **Credentials**: Ensure your fetch/axios calls include `credentials: 'include'`.
2.  **CORS**: Add your frontend URL to the `CORS_ORIGINS` environment variable on the Auth Server.
3.  **Cookie Domain**: If your app is on `app.example.com` and auth is on `auth.example.com`, set `AUTH_COOKIE_DOMAIN=.example.com`.
4.  **Local Dev**: In development, `CORS_ORIGINS` defaults to `http://localhost:3000,http://localhost:5173`. Ensure your local dev server matches one of these or update the env.

### Common API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/auth/*` | Mixed | Better Auth internal routes (sign-up, sign-in, etc.) |
| `/v1/me` | GET | Returns the current user session (requires session cookie) |
| `/v1/admin/users` | GET | List all users (Requires `admin` role) |
| `/healthz` | GET | Service health and version check |
| `/v1/docs` | GET | Swagger documentation (Non-production only) |

### Example Usage

#### Sign In (Email/Password)
```bash
curl -X POST http://localhost:3340/v1/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

#### Get Current User
```bash
curl -X GET http://localhost:3340/v1/me \
  -b cookies.txt
```

#### Health Check
```bash
curl -X GET http://localhost:3340/healthz
```

### RBAC (Role-Based Access Control)
- `/v1/me` is available to any authenticated user.
- `/v1/admin/*` routes require the user to have the `admin` role. Requests by non-admin users will return a `403 Forbidden` status.

### Troubleshooting

- **401 Unauthorized on `/v1/me`**:
    - Verify `credentials: 'include'` is set in the client request.
    - Check if the session cookie is being sent (check browser DevTools -> Application -> Cookies).
    - Ensure `AUTH_COOKIE_DOMAIN` matches the current environment.
- **CORS Errors**:
    - Verify the browser's `Origin` header matches one of the entries in `CORS_ORIGINS`.
    - Note that in production, the server denies all origins if `CORS_ORIGINS` is empty.
- **429 Too Many Requests**:
    - The server implements rate limiting (e.g., 5 attempts per minute for sign-in). Wait a minute and try again.
