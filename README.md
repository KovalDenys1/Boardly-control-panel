# Boardly Control Panel

An admin control panel for the [Boardly](https://github.com/KovalDenys1/boardly) platform. Built as a separate Next.js application that connects to the same PostgreSQL database as Boardly, with its own authentication and deployment.

Live at **[admin.boardly.online](https://admin.boardly.online)**

---

## Features

- **Admin-only authentication** — credentials login via NextAuth v5, restricted to users with `role: admin`, with in-memory rate limiting (10 attempts / 15 min)
- **Dashboard** — platform stats (total users, suspended accounts, active/total games) and 7-day activity charts for games and registrations
- **User management** — paginated user list, suspend/unsuspend accounts, auto-expiry of time-limited bans, full audit trail
- **Games overview** — paginated list (50/page) of all game sessions with status, type, creator, and player count; click any row for full session detail
- **Game detail** — full session info: lobby config, player list with placements and scores, abandoned game warnings
- **Monitor** — live view of active and waiting games, auto-refreshes every 30 seconds
- **Audit log** — paginated history of all admin actions (suspend, unsuspend) with reason, timestamp, and acting admin
- **Help page** — built-in documentation for administrators

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│      Boardly        │     │  Boardly Control    │
│   (main platform)   │     │      Panel          │
│                     │     │                     │
│  nextjs · nextauth  │     │  nextjs · nextauth  │
│  prisma · tailwind  │     │  prisma (readonly)  │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └─────────────┬─────────────┘
                         │
              ┌──────────▼──────────┐
              │ Supabase PostgreSQL │
              │  (shared database)  │
              └─────────────────────┘
```

One database, two separate services. The control panel has its own auth and is deployed independently.

---

## Tech Stack

| Technology | Version | Role |
|------------|---------|------|
| Next.js App Router | 16.2.4 | Framework — frontend + server actions |
| TypeScript | 5 | Type safety |
| Prisma ORM | 6.19.3 | Type-safe database queries |
| PostgreSQL (Supabase) | — | Shared database with Boardly |
| NextAuth | v5 beta | Auth — JWT sessions, CSRF protection |
| bcryptjs | 2.4.3 | Password verification (bcrypt) |
| Vercel | — | Hosting, automatic HTTPS, custom domain |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Access to the Boardly Supabase database (read + write on admin tables)

### Setup

```bash
git clone https://github.com/KovalDenys1/Boardly-control-panel
cd Boardly-control-panel
pnpm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."      # Supabase pooler URL (port 6543, for queries)
DIRECT_URL="postgresql://..."        # Supabase direct URL (port 5432, for migrations)
AUTH_SECRET="..."                    # openssl rand -base64 32
AUTH_URL="http://localhost:3000"
```

```bash
pnpm db:generate   # generate Prisma client
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with an admin account.

---

## Security

- All routes behind middleware — unauthenticated requests redirect to `/login`
- Server actions re-verify the session and check `role === "admin"` independently of middleware
- Every suspend/unsuspend action is written to `AdminAuditLogs` with admin ID, target user ID, reason, and timestamp
- Passwords verified with bcrypt — never stored or logged in plain text
- In-memory rate limiter blocks login after 10 failed attempts per email per 15-minute window
- Environment variables never committed to Git; secrets configured in Vercel dashboard

---

## Deployment

Deployed on Vercel at `admin.boardly.online` (A record → `76.76.21.21`).

**Required environment variables in Vercel:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `AUTH_SECRET` | Random 32-byte base64 secret |
| `AUTH_URL` | `https://admin.boardly.online` |

**Notes:**
- `pnpm.onlyBuiltDependencies` in `package.json` allows pnpm v10 to run Prisma's engine download scripts during install
- `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in `schema.prisma` ensures the Linux engine binary is generated
- `outputFileTracingIncludes` in `next.config.ts` forces Next.js to bundle the `.node` engine file into the deployment

---

## Developer

**Denys Koval** — [github.com/KovalDenys1](https://github.com/KovalDenys1)
