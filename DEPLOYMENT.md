
# KP WhatsApp Automation — Deployment Guide

Production stack:
- **Database** — Neon (serverless PostgreSQL)
- **Backend** — Render (Node.js web service)
- **Frontend** — Vercel (Next.js)
- **Email** — Resend

---

## Overview

```
Browser (Vercel)
    │  NEXT_PUBLIC_API_URL
    ▼
Backend API (Render)
    │  DATABASE_URL / DIRECT_URL
    ▼
Neon PostgreSQL
    │  RESEND_API_KEY
    ▼
Resend (transactional email)
```

> **Session persistence — fully solved**
> WhatsApp credentials and signal keys are stored in Neon (PostgreSQL),
> not on the filesystem. The backend automatically reconnects all sessions
> on every startup — no QR re-scan is needed after deploys or restarts.
> Render free tier works without any persistent disk.

---

## Step 1 — Neon Database

### 1.1 Create a project

1. Go to [neon.tech](https://neon.tech) and sign up / log in.
2. Click **New Project**.
3. Choose a project name (e.g. `kp-whatsapp`) and a region close to your users.
4. Click **Create Project**.

### 1.2 Copy connection strings

From your Neon project dashboard, go to **Connection Details**.

You need **two** connection strings:

| Variable | Description | Where to find it |
|---|---|---|
| `DATABASE_URL` | Pooled (pgBouncer) — runtime queries | Toggle "Connection pooling" ON |
| `DIRECT_URL` | Direct — Prisma migrations | Toggle "Connection pooling" OFF |

Both strings look like:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

The pooled URL has additional parameters:
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15
```

Keep both strings — you will paste them into Render in Step 2.

---

## Step 2 — Render (Backend)

### 2.1 Create a Web Service

1. Go to [render.com](https://render.com) and sign up / log in.
2. Click **New** → **Web Service**.
3. Connect your GitHub/GitLab account and select your repository.
4. Configure:

| Setting | Value |
|---|---|
| **Name** | `kp-whatsapp-automation-backend` |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install -g pnpm && pnpm install && cd apps/backend && npx prisma generate && pnpm run build` |
| **Start Command** | `cd apps/backend && node dist/index.js` |
| **Plan** | Free (or paid for persistent disk) |

### 2.2 Set environment variables

In the Render dashboard for your service, go to **Environment** and add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `JWT_SECRET` | A long random string (e.g. 64-char hex) |
| `FRONTEND_URL` | Your Vercel URL (e.g. `https://kp-whatsapp.vercel.app`) — add this after Step 3 |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM` | `KP WhatsApp Automation <noreply@yourdomain.com>` |
| `GOOGLE_CLIENT_ID` | *(optional)* Your Google OAuth client ID |

> To generate a secure JWT_SECRET, run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 2.3 Run the database migration

After the first deploy, open a Render **Shell** (or run via CLI) and execute:

```bash
cd apps/backend && npx prisma migrate deploy
```

This applies all migrations against your Neon database.

### 2.4 Note your backend URL

After deploy, Render gives you a URL like:
```
https://kp-whatsapp-automation-backend.onrender.com
```

Your API base will be:
```
https://kp-whatsapp-automation-backend.onrender.com/api
```

---

## Step 3 — Vercel (Frontend)

### 3.1 Import the project

1. Go to [vercel.com](https://vercel.com) and sign up / log in.
2. Click **Add New** → **Project**.
3. Import your GitHub/GitLab repository.

### 3.2 Configure the project

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `apps/frontend` |
| **Build Command** | `pnpm run build` (leave as default if Vercel auto-detects) |
| **Output Directory** | `.next` |

### 3.3 Set environment variables

In Vercel project settings → **Environment Variables**, add:

| Key | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://kp-whatsapp-automation-backend.onrender.com/api` | Production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Development |

### 3.4 Deploy

Click **Deploy**. Vercel builds and publishes the frontend.

Your production URL will be something like:
```
https://kp-whatsapp.vercel.app
```

### 3.5 Update FRONTEND_URL on Render

Go back to your Render service → **Environment** and update:
```
FRONTEND_URL = https://kp-whatsapp.vercel.app
```

Then trigger a **Manual Deploy** on Render so the new CORS setting takes effect.

---

## Step 4 — Resend (Email)

### 4.1 Create an account

1. Go to [resend.com](https://resend.com) and sign up.
2. On the dashboard, go to **API Keys** → **Create API Key**.
3. Name it `kp-production` and copy the key.

### 4.2 Verify a sending domain

1. In Resend, go to **Domains** → **Add Domain**.
2. Enter your domain (e.g. `yourdomain.com`).
3. Add the DNS records Resend provides (TXT, MX, DKIM) to your DNS provider.
4. Click **Verify**. DNS propagation can take up to 48 hours.

> **Testing without a domain:** Use `onboarding@resend.dev` as the `RESEND_FROM`
> value to send to your own email only (Resend sandbox mode).

### 4.3 Set environment variables

These should already be set in Render from Step 2.2:
- `RESEND_API_KEY` — the key you copied above
- `RESEND_FROM` — `KP WhatsApp Automation <noreply@yourdomain.com>`

---

## Step 5 — Google OAuth Setup (Optional)

If you want to enable **Google Sign-In** for your users, follow these steps:

### 5.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account (create one if needed)
3. At the top, click the project selector dropdown
4. Click **NEW PROJECT**
5. Enter a project name (e.g., `KP WhatsApp Automation`)
6. Click **Create**
7. Wait for the project to be created (notification appears at top right)

### 5.2 Enable the Google+ API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click on it, then click **ENABLE**
4. Wait a few seconds for it to enable

### 5.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. If prompted: "To create an OAuth 2.0 Client ID, you must first set a product name on the OAuth consent screen"
   - Click the blue link to **Configure the OAuth consent screen**
   - Select **External** as the User Type, click **CREATE**
   - Fill in the form:
     - **App name**: `KP WhatsApp Automation`
     - **User support email**: your email
     - **Developer contact**: your email
   - Click **SAVE AND CONTINUE** through all steps
   - Skip adding scopes (they're optional for this setup)
   - Click **SAVE AND CONTINUE** → **BACK TO DASHBOARD**

4. Now go back to **Credentials** and click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
5. Choose **Application type**: `Web application`
6. Enter a name (e.g., `KP WhatsApp Web`)
7. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   ```
   http://localhost:3000
   https://kp-whatsapp.vercel.app
   ```
   (Replace with your actual Vercel URL from Step 3.4)

8. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   ```
   http://localhost:3001/auth/google/callback
   http://localhost:3000/auth/google/callback
   https://kp-whatsapp-automation-backend.onrender.com/auth/google/callback
   https://kp-whatsapp.vercel.app/auth/google/callback
   ```
   (Replace URLs with your actual backend and frontend URLs)

9. Click **CREATE**
10. A dialog appears with your credentials — **copy and save these**:
    - **Client ID** — you'll need this
    - **Client Secret** — keep this private!

### 5.4 Add Google credentials to Render

1. Go to your Render backend service dashboard
2. Go to **Environment** section
3. Add these environment variables:

| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Paste your Client ID from Step 5.3 |
| `GOOGLE_CLIENT_SECRET` | Paste your Client Secret from Step 5.3 |

4. Click **Save Changes** → Render auto-deploys

### 5.5 Update your local `.env` (optional, for local testing)

In `apps/backend/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Then restart your backend:
```bash
cd apps/backend
pnpm run dev
```

### 5.6 Integrate Google OAuth in your auth controller

If you haven't already, your auth controller should handle Google OAuth. The typical flow is:

1. Frontend sends `POST /auth/google` with the Google access token
2. Backend verifies the token with Google
3. Backend creates or updates the user in the database
4. Backend returns a JWT token for the session

Example route handler:
```typescript
POST /auth/google
Body: { token: "google_access_token" }
Returns: { jwt: "your_jwt_token", user: {...} }
```

---

## Step 6 — Verify the Deployment

### Checklist

- [ ] `https://your-backend.onrender.com/api/auth/login` returns a response (even an error is fine — confirms the service is up)
- [ ] Opening the Vercel URL shows the KP WhatsApp Automation login page
- [ ] Creating an account sends a welcome email to your inbox
- [ ] Logging in redirects to the dashboard
- [ ] The QR code loads on the dashboard
- [ ] Scanning the QR connects WhatsApp
- [ ] Sending a test message to your WhatsApp number triggers an automated reply

---

## Environment Variables Summary

### Backend (`apps/backend/.env` / Render)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Yes | Neon direct connection string (migrations) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | Yes | Set to `production` on Render |
| `FRONTEND_URL` | Yes | Vercel frontend URL for CORS |
| `RESEND_API_KEY` | Recommended | Resend API key for welcome emails |
| `RESEND_FROM` | Recommended | Verified sender address |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (see Step 5.3) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret (see Step 5.3) — keep private |

### Frontend (`apps/frontend/.env.local` / Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Full backend API URL including `/api` |

---

## Redeployment Notes

- **Backend code change:** Push to `main` → Render auto-deploys.
- **Frontend code change:** Push to `main` → Vercel auto-deploys.
- **Schema change:** After deploying backend, run `npx prisma migrate deploy` in a Render Shell.
- **WhatsApp reconnect after redeploy:** On the free Render tier, the session files are wiped — scan the QR code again after every deploy.

---

## Troubleshooting

### CORS error in browser console

`FRONTEND_URL` on Render does not match your actual Vercel URL. Update it and redeploy the backend.

### `Invalid JWT` on all API requests

`JWT_SECRET` on Render differs from the value used to sign existing tokens. Users need to log in again after the secret is changed.

### Prisma migration fails

Make sure `DIRECT_URL` points to the **direct** (non-pooled) Neon URL. pgBouncer connections do not support the DDL transactions Prisma migrations require.

### WhatsApp disconnected after a redeploy

Sessions are stored in Neon so reconnection is automatic on startup. If the session still shows as disconnected after a minute, check the Render logs — the backend may be failing to start (missing env var, migration error, etc.).

### Resend emails not arriving

1. Check the Resend dashboard → **Logs** for delivery errors.
2. Make sure your sending domain is verified.
3. Check spam/junk folders.
