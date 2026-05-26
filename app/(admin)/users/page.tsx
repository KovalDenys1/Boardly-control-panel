import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { UsersTable } from "@/app/components/UsersTable";

async function liftExpiredBans() {
  await prisma.users.updateMany({
    where: { suspended: true, banExpiresAt: { lt: new Date() } },
    data: { suspended: false, banReason: null, banExpiresAt: null },
  });
}

const PAGE_SIZE = 50;

type SortKey = "username" | "role" | "createdAt" | "lastActiveAt" | "online" | "status" | "premium";

async function getUsers(page: number, q: string, role: string, status: string, sort: string, dir: string, date: string) {
  await liftExpiredBans();

  const d = dir === "asc" ? "asc" : ("desc" as const);

  const where: Prisma.UsersWhereInput = { isGuest: false };
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role === "admin" || role === "user") where.role = role;
  if (status === "active") where.suspended = false;
  if (status === "suspended") where.suspended = true;
  if (status === "premium") where.premiumUntil = { gt: new Date() };
  if (status === "unverified") where.emailVerified = null;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    where.createdAt = { gte: start, lte: end };
  }

  let orderBy: Prisma.UsersOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "username") orderBy = { username: d };
  else if (sort === "role") orderBy = { role: d };
  else if (sort === "createdAt") orderBy = { createdAt: d };
  else if (sort === "lastActiveAt") orderBy = { lastActiveAt: d };
  else if (sort === "online") orderBy = { lastActiveAt: d };
  else if (sort === "status") orderBy = { suspended: d };
  else if (sort === "premium") orderBy = { premiumUntil: { sort: d, nulls: d === "asc" ? "first" : "last" } };

  const [raw, total, filteredTotal, suspendedTotal, premiumTotal, unverifiedTotal] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id: true, email: true, username: true, role: true,
        suspended: true, banReason: true, banExpiresAt: true,
        createdAt: true, lastActiveAt: true, premiumUntil: true, emailVerified: true,
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.users.count({ where: { isGuest: false } }),
    prisma.users.count({ where }),
    prisma.users.count({ where: { isGuest: false, suspended: true } }),
    prisma.users.count({ where: { isGuest: false, premiumUntil: { gt: new Date() } } }),
    prisma.users.count({ where: { isGuest: false, emailVerified: null, passwordHash: { not: null } } }),
  ]);

  return { raw, total, filteredTotal, suspendedTotal, premiumTotal, unverifiedTotal };
}

async function toggleSuspend(
  userId: string,
  suspend: boolean,
  adminId: string,
  banReason?: string | null,
  banExpiresAt?: Date | null,
) {
  await prisma.users.update({
    where: { id: userId },
    data: {
      suspended: suspend,
      banReason: suspend ? (banReason || null) : null,
      banExpiresAt: suspend ? (banExpiresAt ?? null) : null,
    },
  });
  await prisma.adminAuditLogs.create({
    data: {
      id: crypto.randomUUID(), adminId,
      action: suspend ? "suspend_user" : "unsuspend_user",
      targetType: "user", targetId: userId,
      details: { suspended: suspend, banReason: banReason ?? null },
    },
  });
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string; sort?: string; dir?: string; date?: string }>;
}) {
  const { page: pageParam, q = "", role = "", status = "", sort = "", dir = "", date = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const session = await auth();
  const adminId = session!.user!.id!;
  const { raw, total, filteredTotal, suspendedTotal, premiumTotal, unverifiedTotal } = await getUsers(page, q, role, status, sort, dir, date);
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);

  const currentSort = (["username", "role", "createdAt", "lastActiveAt", "online", "status", "premium"].includes(sort) ? sort : null) as SortKey | null;
  const currentDir = dir === "asc" ? "asc" : "desc";

  const users = raw.map((u) => ({
    ...u,
    banExpiresAt: u.banExpiresAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    lastActiveAt: u.lastActiveAt.toISOString(),
    premiumUntil: u.premiumUntil?.toISOString() ?? null,
    emailVerified: u.emailVerified?.toISOString() ?? null,
  }));

  async function handleSuspend(formData: FormData) {
    "use server";
    const session = await auth();
    if (session?.user && (session.user as { role?: string }).role !== "admin") return;
    const userId = formData.get("userId") as string;
    const action = formData.get("action") as string;
    const banReason = formData.get("banReason") as string | null;
    const banDuration = formData.get("banDuration") as string | null;

    let banExpiresAt: Date | null = null;
    if (action === "suspend" && banDuration && banDuration !== "0") {
      const days = parseInt(banDuration, 10);
      banExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    await toggleSuspend(userId, action === "suspend", adminId, banReason || null, banExpiresAt);
    revalidatePath("/users");
  }

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./users.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">users<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">
              {"// "}{total}{" registered · page "}{page}{" of "}{totalPages}
              {suspendedTotal > 0 && (
                <> · <span style={{ color: "var(--bad)" }}>{suspendedTotal} suspended</span></>
              )}
              {date && (
                <> · <span style={{ color: "var(--accent)" }}>registered on {date}</span>{" "}<Link href="/users" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>[×clear]</Link></>
              )}
            </p>
          </div>
          <div className="bk-pill-row">
            {unverifiedTotal > 0 && (
              <span className="bk-pill bk-pill--bad">
                <span className="bk-pill-count">{unverifiedTotal}</span>
                <span className="bk-pill-sep">·</span>
                <span>UNVERIFIED</span>
              </span>
            )}
            <span className={`bk-pill bk-pill--${premiumTotal > 0 ? "warn" : "mute"}`}>
              <span className="bk-pill-count">{premiumTotal}</span>
              <span className="bk-pill-sep">·</span>
              <span>PREMIUM</span>
            </span>
            <span className={`bk-pill bk-pill--${suspendedTotal > 0 ? "bad" : "mute"}`}>
              <span className="bk-pill-count">{suspendedTotal}</span>
              <span className="bk-pill-sep">·</span>
              <span>SUSPENDED</span>
            </span>
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">{total}</span>
              <span className="bk-pill-sep">·</span>
              <span>TOTAL</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        <UsersTable
          users={users}
          handleSuspend={handleSuspend}
          total={total}
          filteredTotal={filteredTotal}
          currentSort={currentSort}
          currentDir={currentDir}
          pageOffset={(page - 1) * PAGE_SIZE}
        />
        <div className="bk-table-foot bk-table-foot-nav">
          <span>{filteredTotal} records · {total} total · all actions logged to audit trail</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {page > 1 && (
              <Link href={`/users?page=1&q=${q}&role=${role}&status=${status}&sort=${sort}&dir=${dir}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>«</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page > 1 && (
              <Link href={`/users?page=${page - 1}&q=${q}&role=${role}&status=${status}&sort=${sort}&dir=${dir}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>←</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            <form action="/users" method="get" className="bk-page-form">
              {q && <input type="hidden" name="q" value={q} />}
              {role && <input type="hidden" name="role" value={role} />}
              {status && <input type="hidden" name="status" value={status} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {dir && <input type="hidden" name="dir" value={dir} />}
              <span className="bk-page-form-brk">[</span>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="page" defaultValue={page} style={{ width: `${String(totalPages).length}ch` }} className="bk-page-input-inline" />
              <span>/</span>
              <span style={{ fontWeight: 600, color: "var(--fg-strong)" }}>{totalPages}</span>
              <span className="bk-page-form-brk">]</span>
            </form>
            {page < totalPages && (
              <Link href={`/users?page=${page + 1}&q=${q}&role=${role}&status=${status}&sort=${sort}&dir=${dir}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>→</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/users?page=${totalPages}&q=${q}&role=${role}&status=${status}&sort=${sort}&dir=${dir}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>»</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
