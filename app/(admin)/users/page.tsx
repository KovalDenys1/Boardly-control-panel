import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function getUsers() {
  return prisma.users.findMany({
    where: { isGuest: false },
    select: { id: true, email: true, username: true, role: true, suspended: true, createdAt: true, lastActiveAt: true },
    orderBy: { createdAt: "desc" },
  });
}

async function toggleSuspend(userId: string, suspend: boolean, adminId: string) {
  await prisma.users.update({ where: { id: userId }, data: { suspended: suspend } });
  await prisma.adminAuditLogs.create({
    data: {
      id: crypto.randomUUID(), adminId,
      action: suspend ? "suspend_user" : "unsuspend_user",
      targetType: "user", targetId: userId,
      details: { suspended: suspend },
    },
  });
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function UsersPage() {
  const session = await auth();
  const adminId = session!.user!.id!;
  const users   = await getUsers();

  async function handleSuspend(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const action = formData.get("action") as string;
    await toggleSuspend(userId, action === "suspend", adminId);
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

      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th className="bk-th-num">#</th>
              <th>USER</th>
              <th>ROLE</th>
              <th>JOINED</th>
              <th>LAST ACTIVE</th>
              <th>STATUS</th>
              <th className="bk-th-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id}>
                <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(i + 1).padStart(2, "0")}</td>
                <td>
                  <div className="bk-cell-user-name">{user.username ?? "—"}</div>
                  <div className="bk-cell-user-mail">{user.email}</div>
                </td>
                <td>
                  {user.role === "admin" ? (
                    <span className="bk-brk bk-brk--accent">
                      <span className="bk-brk-l">[</span>ADMIN<span className="bk-brk-r">]</span>
                    </span>
                  ) : (
                    <span className="bk-mute">user</span>
                  )}
                </td>
                <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmt(user.createdAt)}</td>
                <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmt(user.lastActiveAt)}</td>
                <td>
                  {user.suspended ? (
                    <span className="bk-brk bk-brk--bad">
                      <span className="bk-brk-l">[</span>SUSPENDED<span className="bk-brk-r">]</span>
                    </span>
                  ) : (
                    <span className="bk-brk bk-brk--ok">
                      <span className="bk-brk-l">[</span>ACTIVE<span className="bk-brk-r">]</span>
                    </span>
                  )}
                </td>
                <td className="bk-td-right">
                  {user.role !== "admin" && (
                    <form action={handleSuspend}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="action" value={user.suspended ? "unsuspend" : "suspend"} />
                      <button
                        type="submit"
                        className={`bk-btn ${user.suspended ? "bk-btn--neutral" : "bk-btn--bad"}`}
                      >
                        <span className="bk-btn-brk">[</span>
                        <span className="bk-btn-label">{user.suspended ? "UNSUSPEND" : "SUSPEND"}</span>
                        <span className="bk-btn-brk">]</span>
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="bk-empty">no users found</div>
        )}
        <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
          {users.length} records · all actions logged to audit trail
        </div>
      </div>
    </div>
  );
}
