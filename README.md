# KP WhatsApp Automation

A multi-tenant WhatsApp automation platform. Connect your WhatsApp Business number via QR code and let AI handle your customer conversations 24/7.

## Features

- **WhatsApp Gateway** — Connect any WhatsApp account by scanning a QR code. Uses the Baileys library (WhatsApp Web protocol). Sessions persist across restarts.
- **AI Assistant** — Plug in your own API key for OpenAI, Anthropic (Claude), Google Gemini, DeepSeek, or OpenRouter. Write a system prompt describing your business and the AI replies on your behalf.
- **Keyword Auto-Replies** — Define keyword → reply rules that fire instantly, bypassing the AI.
- **Welcome Greeting** — A fixed first message sent automatically to brand-new contacts.
- **Live Inbox** — View all WhatsApp transcripts in real time. See whether each reply came from the AI, a rule, or you.
- **Manual Takeover** — Pause the AI for any individual customer and reply manually from the dashboard.
- **Multi-Tenant** — Each business account has isolated sessions, AI configs, contacts, and message history.
- **Transactional Email** — Welcome emails sent via Resend on signup.
- **SEO-Ready** — Server-rendered public/contact pages with metadata, schema.org structured data, `sitemap.xml`, and `robots.txt` so the site and its developer are indexable.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, React 19 |
| Backend | Node.js, Express, TypeScript |
| WhatsApp | Baileys (`@whiskeysockets/baileys`) |
| Database | PostgreSQL (Neon in production) |
| ORM | Prisma |
| AI providers | OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter |
| Email | Resend |
| Auth | JWT (7-day cookie) |
| Package manager | pnpm (workspace monorepo) |

## Production Stack

| Service | Provider |
|---|---|
| Database | [Neon](https://neon.tech) |
| Backend | [Render](https://render.com) |
| Frontend | [Vercel](https://vercel.com) |
| Email | [Resend](https://resend.com) |

## Repository Structure

```
kp-whatsapp-automation/
├── apps/
│   ├── backend/          # Express API + Baileys + Prisma
│   ├── frontend/         # Next.js dashboard (public site + customer app)
│   └── admin/            # Next.js admin panel (port 3002)
├── render.yaml           # Render deployment config
├── docker-compose.yml    # Local PostgreSQL
├── DEPLOYMENT.md         # Step-by-step production deployment guide
├── LOCAL_SETUP.md        # Step-by-step local development guide
├── TECHNICAL_DOC.md      # Full architecture and API reference
└── USER_GUIDE.md         # End-user manual with GUI procedures
```

## Quick Start

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for a full step-by-step local development guide.

**TL;DR:**
```bash
# 1. Start local database
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Configure backend
cd apps/backend && cp .env.example .env
# Edit .env — set DATABASE_URL, DIRECT_URL, JWT_SECRET

# 4. Apply schema
npx prisma migrate dev && npx prisma generate

# 5. Start backend (terminal 1)
pnpm run dev

# 6. Start frontend (terminal 2)
cd ../frontend && pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full guide.

**Summary:**
1. Create a Neon project → copy both connection strings
2. Deploy backend to Render → set all environment variables
3. Deploy frontend to Vercel → set `NEXT_PUBLIC_API_URL`
4. Create a Resend account → verify your domain → set `RESEND_API_KEY`
5. Update `FRONTEND_URL` on Render with the Vercel URL

### Production Database

Local development uses the local Docker Postgres (fast and reliable). **Production
uses a managed Postgres such as [Neon](https://neon.tech).** To switch a backend
from local to production:

1. **Get the connection strings.** In Neon, create a project and copy both:
   - the **pooled** string (host contains `-pooler`) → use for `DATABASE_URL`
   - the **direct** string (no `-pooler`) → use for `DIRECT_URL` (Prisma migrations need a direct connection)

2. **Set the env vars.** In `apps/backend/.env` (local build) or your host's
   dashboard (e.g. Render), point both at Neon. The committed `.env` keeps the
   Neon strings ready as commented-out lines — comment out the two local
   `localhost:5432` lines and uncomment the Neon pair:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require&channel_binding=require
   DIRECT_URL=postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DB?sslmode=require&channel_binding=require
   ```

3. **Create the schema on the production DB.** Run migrations against it once
   (and on every deploy that adds a migration):

   ```bash
   cd apps/backend
   npx prisma migrate deploy   # applies committed migrations — never prompts, safe for prod
   npx prisma generate         # regenerate the client
   ```

   > Use `migrate deploy` in production, **not** `migrate dev` — `dev` can reset
   > data and prompts interactively. On Render, add `prisma migrate deploy` to the
   > build/start command so each deploy applies pending migrations automatically.

4. **Heads-up: serverless cold starts.** Neon sleeps when idle, so the first
   query after a pause can be slow or time out. The backend already tolerates
   this (handlers are wrapped and a failed query is logged rather than crashing),
   but it's why local development stays on the always-on local Postgres.

## Documentation

| Document | Contents |
|---|---|
| [LOCAL_SETUP.md](LOCAL_SETUP.md) | Local development from scratch |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment on Render, Vercel, Neon, Resend |
| [TECHNICAL_DOC.md](TECHNICAL_DOC.md) | Architecture, database schema, API reference |
| [USER_GUIDE.md](USER_GUIDE.md) | End-user manual with GUI walkthrough |

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string (for migrations) |
| `JWT_SECRET` | Token signing secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Verified sender address |

See [`apps/backend/.env.example`](apps/backend/.env.example) for all variables.

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (including `/api`) |
| `NEXT_PUBLIC_SITE_URL` | Public site origin — used for canonical URLs, Open Graph, sitemap, and robots. Set to the real production domain. |

See [`apps/frontend/.env.example`](apps/frontend/.env.example) for all variables.
