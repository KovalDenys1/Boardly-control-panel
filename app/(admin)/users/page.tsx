import { prisma } from "@/lib/prisma";
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

async function getUsers(page: number) {
  await liftExpiredBans();
  const [raw, total] = await Promise.all([
    prisma.users.findMany({
      where: { isGuest: false },
      select: {
        id: true, email: true, username: true, role: true,
        suspended: true, banReason: true, banExpiresAt: true,
        createdAt: true, lastActiveAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.users.count({ where: { isGuest: false } }),
  ]);
  return { raw, total };
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
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const session = await auth();
  const adminId = session!.user!.id!;
  const { raw, total } = await getUsers(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const users = raw.map((u) => ({
    ...u,
    banExpiresAt: u.banExpiresAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    lastActiveAt: u.lastActiveAt.toISOString(),
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

    await toggleSuspend(
      userId,
      action === "suspend",
      adminId,
      banReason || null,
      banExpiresAt,
    );
    revalidatePath("/users");
  }

  const suspended = users.filter((u) => u.suspended).length;

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./users.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">users<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">
              {"// "}{total}{" registered · page "}{page}{" of "}{totalPages}
              {suspended > 0 && (
                <> · <span style={{ color: "var(--bad)" }}>{suspended} suspended</span></>
              )}
            </p>
          </div>
          <div className="bk-pill-row">
            <span className={`bk-pill bk-pill--${suspended > 0 ? "bad" : "mute"}`}>
              <span className="bk-pill-count">{suspended}</span>
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
        <UsersTable users={users} handleSuspend={handleSuspend} />
        {users.length === 0 && <div className="bk-empty">no users found</div>}
        <div className="bk-table-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--mute)" }}>
          <span>{users.length} records on this page · {total} total · all actions logged to audit trail</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {page > 1 && (
              <Link href="/users?page=1" className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>FIRST</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page > 1 && (
              <Link href={`/users?page=${page - 1}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>PREV</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            <form action="/users" method="get" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" name="page" defaultValue={page} min={1} max={totalPages} className="bk-page-input" />
              <button type="submit" className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>GO</span><span className="bk-btn-brk">]</span>
              </button>
            </form>
            {page < totalPages && (
              <Link href={`/users?page=${page + 1}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>NEXT</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
