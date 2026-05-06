import { prisma } from "@/lib/prisma";
import Link from "next/link";

const PAGE_SIZE = 30;

async function getLogs(page: number) {
  const [logs, total] = await Promise.all([
    prisma.adminAuditLogs.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, action: true, targetType: true, targetId: true,
        details: true, createdAt: true,
        Users: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.adminAuditLogs.count(),
  ]);
  return { logs, total };
}

const actionColor: Record<string, string> = {
  suspend_user:   "var(--bad)",
  unsuspend_user: "var(--accent)",
};

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { logs, total } = await getLogs(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./audit.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">audit<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">// {total} entries · admin action log</p>
          </div>
          <div className="bk-pill-row">
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">{total}</span>
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
              <th>ACTION</th>
              <th>ADMIN</th>
              <th>TARGET</th>
              <th>DETAILS</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const details = log.details as Record<string, unknown> | null;
              const banReason = details?.banReason as string | null | undefined;
              const offset = (page - 1) * PAGE_SIZE;
              return (
                <tr key={log.id}>
                  <td className="bk-td-num" style={{ color: "var(--mute)" }}>
                    {String(offset + i + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <span style={{ color: actionColor[log.action] ?? "var(--fg)", fontWeight: 600, fontSize: "var(--fz-xs)", letterSpacing: "0.06em" }}>
                      {log.action.replace(/_/g, ".")}
                    </span>
                  </td>
                  <td>
                    <Link href={`/users/${log.Users.id}`} style={{ textDecoration: "none" }}>
                      <div className="bk-cell-user-name bk-user-link">{log.Users.username ?? "—"}</div>
                      <div className="bk-cell-user-mail">{log.Users.email ?? "—"}</div>
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontSize: "var(--fz-xs)", color: "var(--mute)", letterSpacing: "0.04em" }}>
                      {log.targetType}
                    </div>
                    {log.targetId && (
                      log.targetType === "user" ? (
                        <Link href={`/users/${log.targetId}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontSize: "var(--fz-xs)", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                            {log.targetId.slice(0, 8)}…
                          </div>
                        </Link>
                      ) : (
                        <div style={{ fontSize: "var(--fz-xs)", color: "var(--mute-2)", fontFamily: "var(--mono)" }}>
                          {log.targetId.slice(0, 8)}…
                        </div>
                      )
                    )}
                  </td>
                  <td style={{ fontSize: "var(--fz-xs)", color: "var(--mute)", maxWidth: 240 }}>
                    {banReason ? (
                      <span style={{ color: "var(--fg)" }}>{banReason}</span>
                    ) : (
                      <span style={{ color: "var(--mute-2)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: "var(--fz-xs)", color: "var(--mute)", whiteSpace: "nowrap" }}>
                    {fmt(log.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="bk-empty">no audit records found</div>
        )}
        <div className="bk-table-foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--mute)" }}>
            page {page} of {totalPages} · {total} total entries
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {page > 1 && (
              <Link href="/audit?page=1" className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>«</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page > 1 && (
              <Link href={`/audit?page=${page - 1}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>←</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            <form action="/audit" method="get" className="bk-page-form">
              <span className="bk-page-form-brk">[</span>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="page" defaultValue={page} style={{ width: `${String(totalPages).length}ch` }} className="bk-page-input-inline" />
              <span>/</span>
              <span style={{ fontWeight: 600, color: "var(--fg-strong)" }}>{totalPages}</span>
              <span className="bk-page-form-brk">]</span>
            </form>
            {page < totalPages && (
              <Link href={`/audit?page=${page + 1}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>→</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/audit?page=${totalPages}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>»</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
