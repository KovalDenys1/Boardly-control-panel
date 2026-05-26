import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/fmt";
import { FeedbackSearch } from "@/app/components/FeedbackSearch";
import Link from "next/link";

const PAGE_SIZE = 40;

const typeColor: Record<string, string> = {
  bug:         "var(--bad)",
  feature:     "var(--accent)",
  suggestion:  "var(--accent)",
  complaint:   "var(--bad)",
  praise:      "var(--ok)",
  other:       "var(--mute)",
};

async function getFeedback(page: number, typeFilter: string, q: string) {
  const where: { type?: string; OR?: object[] } = {};
  if (typeFilter) where.type = typeFilter;
  if (q) {
    where.OR = [
      { message: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  const [rows, total, filteredTotal, typeCounts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, type: true, message: true, email: true,
        pageUrl: true, createdAt: true,
        Users: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.feedback.count(),
    prisma.feedback.count({ where }),
    prisma.feedback.groupBy({ by: ["type"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
  ]);
  return { rows, total, filteredTotal, typeCounts };
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; q?: string }>;
}) {
  const { page: pageParam, type = "", q = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { rows, total, filteredTotal, typeCounts } = await getFeedback(page, type, q);
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);
  const grandTotal = typeCounts.reduce((s, t) => s + t._count.id, 0);

  const paginationParams = [type && `type=${type}`, q && `q=${q}`].filter(Boolean).join("&");
  const paginationSuffix = paginationParams ? `&${paginationParams}` : "";

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./feedback.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">feedback<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">// {grandTotal} entries · user-submitted feedback</p>
          </div>
          <div className="bk-pill-row">
            {typeCounts.map((t) => (
              <Link
                key={t.type}
                href={type === t.type ? "/feedback" : `/feedback?type=${t.type}`}
                style={{ textDecoration: "none" }}
              >
                <span className={`bk-pill ${type === t.type ? "bk-pill--accent" : "bk-pill--mute"}`}>
                  <span className="bk-pill-count">{t._count.id}</span>
                  <span className="bk-pill-sep">·</span>
                  <span style={{ textTransform: "uppercase" }}>{t.type}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <FeedbackSearch total={total} filteredTotal={filteredTotal} />

      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th className="bk-th-num">#</th>
              <th>TYPE</th>
              <th>MESSAGE</th>
              <th>USER</th>
              <th>PAGE</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="bk-empty-cell">// no feedback found</td>
              </tr>
            ) : rows.map((row, i) => {
              const offset = (page - 1) * PAGE_SIZE;
              const contactEmail = row.email ?? row.Users?.email ?? null;
              return (
                <tr key={row.id}>
                  <td className="bk-td-num" style={{ color: "var(--mute)" }}>
                    {String(offset + i + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <span style={{
                      color: typeColor[row.type] ?? "var(--mute)",
                      fontWeight: 600, fontSize: "var(--fz-xs)", letterSpacing: "0.06em",
                    }}>
                      {row.type.replace(/_/g, ".")}
                    </span>
                  </td>
                  <td style={{ maxWidth: 360 }}>
                    <div style={{ color: "var(--fg)", fontSize: "var(--fz-xs)", lineHeight: 1.5 }}>
                      {row.message}
                    </div>
                  </td>
                  <td>
                    {row.Users ? (
                      <Link href={`/users/${row.Users.id}`} style={{ textDecoration: "none" }}>
                        <div className="bk-cell-user-name bk-user-link">{row.Users.username ?? "—"}</div>
                        <div className="bk-cell-user-mail">{contactEmail ?? "—"}</div>
                      </Link>
                    ) : contactEmail ? (
                      <div className="bk-cell-user-mail">{contactEmail}</div>
                    ) : (
                      <span style={{ color: "var(--mute-2)" }}>anonymous</span>
                    )}
                  </td>
                  <td style={{ fontSize: "var(--fz-xs)", color: "var(--mute)", maxWidth: 200 }}>
                    {row.pageUrl ? (
                      <span title={row.pageUrl}>
                        {row.pageUrl.replace(/^https?:\/\/[^/]+/, "").slice(0, 40) || "/"}
                      </span>
                    ) : (
                      <span style={{ color: "var(--mute-2)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: "var(--fz-xs)", color: "var(--mute)", whiteSpace: "nowrap" }}>
                    {fmt(row.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bk-table-foot bk-table-foot-nav">
        <span>
          {filteredTotal} records
          {type ? ` · type: "${type}"` : ""}
          {q ? ` · q: "${q}"` : ""}
          {(type || q) ? ` · ${total} total` : ""}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {page > 1 && (
            <Link href={`/feedback?page=1${paginationSuffix}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
              <span className="bk-btn-brk">[</span><span>«</span><span className="bk-btn-brk">]</span>
            </Link>
          )}
          {page > 1 && (
            <Link href={`/feedback?page=${page - 1}${paginationSuffix}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
              <span className="bk-btn-brk">[</span><span>←</span><span className="bk-btn-brk">]</span>
            </Link>
          )}
          <form action="/feedback" method="get" className="bk-page-form">
            {type && <input type="hidden" name="type" value={type} />}
            {q && <input type="hidden" name="q" value={q} />}
            <span className="bk-page-form-brk">[</span>
            <input type="text" inputMode="numeric" pattern="[0-9]*" name="page" defaultValue={page} style={{ width: `${String(Math.max(totalPages, 1)).length}ch` }} className="bk-page-input-inline" />
            <span>/</span>
            <span style={{ fontWeight: 600, color: "var(--fg-strong)" }}>{totalPages}</span>
            <span className="bk-page-form-brk">]</span>
          </form>
          {page < totalPages && (
            <Link href={`/feedback?page=${page + 1}${paginationSuffix}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
              <span className="bk-btn-brk">[</span><span>→</span><span className="bk-btn-brk">]</span>
            </Link>
          )}
          {page < totalPages && (
            <Link href={`/feedback?page=${totalPages}${paginationSuffix}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
              <span className="bk-btn-brk">[</span><span>»</span><span className="bk-btn-brk">]</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
