# KP WhatsApp Automation — Local Setup

Two ways to run locally:

| Method | Best for |
|---|---|
| **Option A — Docker Compose** | Quickest start, no manual setup |
| **Option B — Manual** | Active development with hot reload |

---

## Option A — Docker Compose (Full Stack)

Runs Postgres, the backend, and the frontend all in containers.

```bash
# 1. Clone the repo
git clone https://github.com/your-username/kp-whatsapp-automation.git
cd kp-whatsapp-automation

# 2. Copy and configure environment variables
cp apps/backend/.env.example .env
# Edit .env — at minimum set JWT_SECRET

# 3. Build and start everything
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The backend runs at [http://localhost:3001](http://localhost:3001).

The first build takes a few minutes. Subsequent starts are fast.

**Common commands:**

```bash
docker compose up           # Start without rebuilding
docker compose up --build   # Rebuild after code changes
docker compose down         # Stop all services
docker compose down -v      # Stop and wipe the database
```

> WhatsApp sessions are stored in Postgres — they survive container restarts automatically.

---

## Option B — Manual Setup (recommended for active development)

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm install -g pnpm` |
| Docker Desktop | latest | [docker.com](https://docker.com) |
| Git | any | [git-scm.com](https://git-scm.com) |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/kp-whatsapp-automation.git
cd kp-whatsapp-automation
```

### Step 2 — Install All Dependencies

From the repo root:

```bash
pnpm install
```

This installs dependencies for both `apps/backend` and `apps/frontend` via the pnpm workspace.

### Step 3 — Start the Database

You have two options — pick whichever you prefer:

#### Option 3A — Docker (no install needed)

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432` with:
- User: `profy` / Password: `profypassword` / Database: `profy_db`

Verify it is running: `docker ps`

#### Option 3B — Native PostgreSQL (no Docker needed)

Install PostgreSQL on your machine if you haven't already:

```bash
# Ubuntu / Debian
sudo apt install postgresql

# macOS (Homebrew)
brew install postgresql@16 && brew services start postgresql@16
```

Then create the user and database:

```bash
sudo -u postgres psql
```

```sql
CREATE USER profy WITH PASSWORD 'profypassword';
CREATE DATABASE profy_db OWNER profy;
\q
```

Make sure the service is running:

```bash
sudo systemctl start postgresql   # Linux
# macOS: brew services start postgresql@16
```

> Either option produces the same `DATABASE_URL` — the backend doesn't know or care which one you chose.

### Step 4 — Configure the Backend

```bash
cd apps/backend
cp .env.example .env
```

Open `apps/backend/.env` and fill in the values:

```env
# Local PostgreSQL from Docker Compose
DATABASE_URL="postgresql://profy:profypassword@localhost:5432/profy_db?schema=public"
DIRECT_URL="postgresql://profy:profypassword@localhost:5432/profy_db?schema=public"

JWT_SECRET="any-long-random-string-for-local-dev"

PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Leave blank to skip emails locally — or add a Resend key to test emails
RESEND_API_KEY=""
RESEND_FROM="KP WhatsApp Automation <noreply@yourdomain.com>"
```

### Step 5 — Set Up the Database Schema

From the `apps/backend` directory:

```bash
npx prisma migrate dev
npx prisma generate
```

`migrate dev` creates all tables and applies migrations. It will prompt you for a migration name the first time — press Enter to skip.

To view the database in a GUI:

```bash
npx prisma studio
```

This opens Prisma Studio at [http://localhost:5555](http://localhost:5555).

### Step 6 — Start the Backend

Open a terminal in `apps/backend`:

```bash
pnpm run dev
```

You should see:

```
🚀 Server is running on port 3001
```

The backend watches for file changes and restarts automatically via `nodemon`.

### Step 7 — Configure the Frontend

```bash
cd apps/frontend
cp .env.example .env.local
```

The default `.env.local` already points to localhost — no changes needed:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### Step 8 — Start the Frontend

Open a second terminal in `apps/frontend`:

```bash
pnpm run dev
```

You should see:

```
▲ Next.js
- Local: http://localhost:3000
```

---

## Access the App

| Service | URL |
|---|---|
| Frontend (dashboard) | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:3001/api](http://localhost:3001/api) |
| Prisma Studio | [http://localhost:5555](http://localhost:5555) *(when running)* |

---

## Option B Quick Start Checklist

- [ ] `pnpm install` run from repo root
- [ ] PostgreSQL is running (Docker: `docker compose up -d` OR native: `sudo systemctl start postgresql`)
- [ ] `apps/backend/.env` is configured
- [ ] `npx prisma migrate dev` run from `apps/backend`
- [ ] Backend running: `pnpm run dev` in `apps/backend`
- [ ] Frontend running: `pnpm run dev` in `apps/frontend`
- [ ] Open [http://localhost:3000](http://localhost:3000) — login page appears
- [ ] Create an account and scan the QR code

---

## Stopping Everything

Stop the backend and frontend with `Ctrl + C` in each terminal.

Stop Docker:

```bash
docker compose down         # Stop PostgreSQL
docker compose down -v      # Stop and delete the database (resets all data)
```

---

## Useful Commands

| Command | Directory | Description |
|---|---|---|
| `pnpm install` | root | Install all workspace dependencies |
| `pnpm run dev` | `apps/backend` | Start backend with hot reload |
| `pnpm run build` | `apps/backend` | Compile TypeScript to `dist/` |
| `pnpm run dev` | `apps/frontend` | Start Next.js dev server |
| `pnpm run build` | `apps/frontend` | Build Next.js for production |
| `npx prisma migrate dev` | `apps/backend` | Create and apply a new migration |
| `npx prisma migrate deploy` | `apps/backend` | Apply existing migrations (production) |
| `npx prisma generate` | `apps/backend` | Regenerate Prisma client after schema changes |
| `npx prisma studio` | `apps/backend` | Open the database GUI |
| `docker compose up -d` | root | Start PostgreSQL in background |
| `docker compose down` | root | Stop PostgreSQL |

---

## Troubleshooting

### `Cannot connect to database`

Make sure Docker is running and the container started:

```bash
docker ps
docker compose logs
```

### `Error: Prisma Client is not generated`

Run from `apps/backend`:

```bash
npx prisma generate
```

### Port 3000 or 3001 already in use

Find and kill the process:

```bash
lsof -i :3001   # or :3000
kill -9 <PID>
```

### QR code not loading

The backend must be running. Open [http://localhost:3001/api/whatsapp/status](http://localhost:3001/api/whatsapp/status) in your browser — a JSON response (even an error) confirms the backend is up.

### WhatsApp connection drops on restart

Sessions are stored in `apps/backend/sessions/` and persist across restarts. If you delete that folder, you need to re-scan the QR code.
