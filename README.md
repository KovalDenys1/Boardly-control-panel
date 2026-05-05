# Boardly Control Panel

An admin control panel for the [Boardly](https://github.com/KovalDenys1/boardly) platform. Built as a separate Next.js application that connects to the same PostgreSQL database as Boardly, with its own authentication, API routes, and deployment.

Administrators can manage users, monitor platform activity, and handle security incidents — all from one interface.

---

## Features

- **Admin-only authentication** — credentials login via NextAuth, restricted to users with `role: admin`
- **Dashboard** — real-time platform stats (users, active games, suspended accounts)
- **User management** — view all users, suspend and unsuspend accounts with full audit logging
- **Games overview** — monitor all games by status, type, and player count
- **Help page** — built-in documentation for new administrators

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│      Boardly        │     │  Boardly Control     │
│   (main platform)   │     │      Panel           │
│                     │     │                      │
│  nextjs · nextauth  │     │  nextjs · nextauth   │
│  prisma · tailwind  │     │  prisma · tailwind   │
└────────┬────────────┘     └──────────┬───────────┘
         │                             │
         └──────────┬──────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Supabase PostgreSQL │
         │  (shared database)   │
         └──────────────────────┘
```

One database, two separate services. The control panel has its own auth and is deployed independently.

---

## Tech Stack

| Technology | Why |
|------------|-----|
| Next.js 16 (App Router) | Combines frontend and backend in one project |
| TypeScript | Type safety, catches errors at compile time |
| Prisma ORM | Type-safe database queries, automatic SQL injection protection |
| PostgreSQL (Supabase) | Same database as Boardly — no data duplication needed |
| NextAuth v5 | Industry-standard auth — handles sessions, CSRF protection, and security |
| bcryptjs | One-way password hashing — passwords can't be reversed even if the database leaks |
| Tailwind CSS | Fast to build with, consistent design |
| Vercel | One-click deploy from Git, automatic HTTPS, scales on demand |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Access to the Boardly Supabase database

### Setup

```bash
git clone https://github.com/KovalDenys1/Boardly-control-panel
cd Boardly-control-panel
pnpm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."      # Supabase pooler URL (port 6543)
DIRECT_URL="postgresql://..."        # Supabase direct URL (port 5432)
AUTH_SECRET="..."                    # Generate: openssl rand -base64 32
AUTH_URL="http://localhost:3000"
```

```bash
pnpm db:generate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with an admin account.

---

## Security

- All routes are protected by middleware — unauthenticated users are redirected to `/login`
- API routes verify the session independently of middleware
- Every admin action (suspend/unsuspend) is logged in `AdminAuditLogs` with timestamp, admin ID, and target
- Passwords are never stored in plain text — bcrypt hashing with salt
- Environment variables are never committed to Git

---

## Deployment

The app is deployed on Vercel. Environment variables are configured in the Vercel dashboard.

```bash
vercel --prod
```

**Environment variables to set in Vercel:**
- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`

---

## Developer

**Denys Koval** — [github.com/KovalDenys1](https://github.com/KovalDenys1)
