import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { UsersTable } from "@/app/components/UsersTable";

async function getUsers() {
  return prisma.users.findMany({
    where: { isGuest: false },
    select: {
      id: true, email: true, username: true, role: true,
      suspended: true, banReason: true, banExpiresAt: true,
      createdAt: true, lastActiveAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
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

export default async function UsersPage() {
  const session = await auth();
  const adminId = session!.user!.id!;
  const raw = await getUsers();

  const users = raw.map((u) => ({
    ...u,
    banExpiresAt: u.banExpiresAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    lastActiveAt: u.lastActiveAt.toISOString(),
  }));

  async function handleSuspend(formData: FormData) {
    "use server";
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
              // {users.length} registered
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
              <span className="bk-pill-count">{users.length}</span>
              <span className="bk-pill-sep">·</span>
              <span>TOTAL</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        <UsersTable users={users} handleSuspend={handleSuspend} />
        {users.length === 0 && <div className="bk-empty">no users found</div>}
        <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
          {users.length} records · all actions logged to audit trail
        </div>
      </div>
    </div>
  );
}
