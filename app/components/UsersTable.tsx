"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  role: string;
  suspended: boolean;
  banReason: string | null;
  banExpiresAt: string | null;
  createdAt: string;
  lastActiveAt: string;
};

type SortKey = "username" | "role" | "createdAt" | "lastActiveAt" | "online" | "status";
type SortDir = "asc" | "desc";

const ONLINE_MS = 10 * 60 * 1000;
function isOnline(iso: string) { return Date.now() - new Date(iso).getTime() < ONLINE_MS; }

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtExpiry(iso: string | null) {
  if (!iso) return "permanent";
  const d = new Date(iso);
  if (d < new Date()) return "expired";
  return `until ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function compare(a: UserRow, b: UserRow, key: SortKey, dir: SortDir): number {
  let va: string | number, vb: string | number;
  switch (key) {
    case "username":     va = (a.username ?? a.email ?? "").toLowerCase(); vb = (b.username ?? b.email ?? "").toLowerCase(); break;
    case "role":         va = a.role; vb = b.role; break;
    case "createdAt":    va = new Date(a.createdAt).getTime();      vb = new Date(b.createdAt).getTime();      break;
    case "lastActiveAt": va = new Date(a.lastActiveAt).getTime();   vb = new Date(b.lastActiveAt).getTime();   break;
    case "online":       va = isOnline(a.lastActiveAt) ? 1 : 0;     vb = isOnline(b.lastActiveAt) ? 1 : 0;    break;
    case "status":       va = a.suspended ? 1 : 0;                  vb = b.suspended ? 1 : 0;                 break;
  }
  if (va < vb) return dir === "asc" ? -1 : 1;
  if (va > vb) return dir === "asc" ? 1 : -1;
  return 0;
}

export function UsersTable({
  users,
  handleSuspend,
}: {
  users: UserRow[];
  handleSuspend: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openBanForm, setOpenBanForm] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "admin" | "user">("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "suspended">("");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    let result = users;
    const q = query.trim().toLowerCase();
    if (q) result = result.filter((u) =>
      (u.username ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q),
    );
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    if (statusFilter === "active") result = result.filter((u) => !u.suspended);
    if (statusFilter === "suspended") result = result.filter((u) => u.suspended);
    return result;
  }, [users, query, roleFilter, statusFilter]);

  const sorted = useMemo(
    () => sortKey ? [...filtered].sort((a, b) => compare(a, b, sortKey, sortDir)) : filtered,
    [filtered, sortKey, sortDir],
  );

  function Th({ col, children, className }: { col: SortKey; children: React.ReactNode; className?: string }) {
    const active = sortKey === col;
    return (
      <th
        className={`bk-th-sort${active ? " bk-th-sort--active" : ""}${className ? ` ${className}` : ""}`}
        onClick={() => handleSort(col)}
      >
        {children}
        <span className={`bk-sort-icon${active ? " bk-sort-icon--active" : ""}`}>
          {active ? (sortDir === "asc" ? "▲" : "▼") : "·"}
        </span>
      </th>
    );
  }

  return (
    <>
    <div className="bk-filter-bar">
      <div className="bk-search-bar" style={{ flex: 1 }}>
        <span className="bk-search-prompt">$</span>
        <input
          type="text"
          className="bk-search-input"
          placeholder="search username or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        {(query || roleFilter || statusFilter) && (
          <span className="bk-search-count">{sorted.length} / {users.length}</span>
        )}
      </div>
      <div className="bk-select-wrap">
        <span className="bk-select-brk">[</span>
        <select className="bk-filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
          <option value="">all roles</option>
          <option value="admin">admin</option>
          <option value="user">user</option>
        </select>
        <span className="bk-select-brk">]</span>
      </div>
      <div className="bk-select-wrap">
        <span className="bk-select-brk">[</span>
        <select className="bk-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="">all status</option>
          <option value="active">active</option>
          <option value="suspended">suspended</option>
        </select>
        <span className="bk-select-brk">]</span>
      </div>
    </div>
    <div className="bk-table-wrap">
    <table className="bk-table" style={{ minHeight: "320px" }}>
      <thead>
        <tr>
          <th className="bk-th-num">#</th>
          <Th col="username">USER</Th>
          <Th col="role">ROLE</Th>
          <Th col="createdAt">JOINED</Th>
          <Th col="lastActiveAt">LAST ACTIVE</Th>
          <Th col="online">ONLINE</Th>
          <Th col="status">STATUS</Th>
          <th className="bk-th-right">ACTION</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((user, i) => (
          <tr key={user.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/users/${user.id}`)}>
            <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(i + 1).padStart(2, "0")}</td>
            <td>
              <div className="bk-cell-user-name">{user.username ?? "—"}</div>
              <div className="bk-cell-user-mail">{user.email ?? "—"}</div>
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
              {isOnline(user.lastActiveAt) ? (
                <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>ONLINE<span className="bk-brk-r">]</span></span>
              ) : (
                <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>OFFLINE<span className="bk-brk-r">]</span></span>
              )}
            </td>
            <td>
              {user.suspended ? (
                <div>
                  <span className="bk-brk bk-brk--bad"><span className="bk-brk-l">[</span>SUSPENDED<span className="bk-brk-r">]</span></span>
                  {user.banReason && (
                    <div style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", marginTop: 3 }}>{user.banReason}</div>
                  )}
                  <div style={{ color: "var(--mute-2)", fontSize: "var(--fz-xs)", marginTop: 1 }}>
                    {fmtExpiry(user.banExpiresAt)}
                  </div>
                </div>
              ) : (
                <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>ACTIVE<span className="bk-brk-r">]</span></span>
              )}
            </td>
            <td className="bk-td-right" onClick={(e) => e.stopPropagation()}>
              {user.role !== "admin" && (
                user.suspended ? (
                  <form action={handleSuspend}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="action" value="unsuspend" />
                    <button type="submit" className="bk-btn bk-btn--neutral">
                      <span className="bk-btn-brk">[</span>
                      <span className="bk-btn-label">UNSUSPEND</span>
                      <span className="bk-btn-brk">]</span>
                    </button>
                  </form>
                ) : openBanForm === user.id ? (
                  <form action={handleSuspend} className="bk-ban-form">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="action" value="suspend" />
                    <input
                      type="text"
                      name="banReason"
                      placeholder="reason (optional)"
                      className="bk-ban-input"
                      maxLength={200}
                    />
                    <select name="banDuration" className="bk-ban-select">
                      <option value="0">permanent</option>
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                    </select>
                    <div className="bk-ban-actions">
                      <button type="submit" className="bk-btn bk-btn--bad">
                        <span className="bk-btn-brk">[</span>
                        <span className="bk-btn-label">CONFIRM</span>
                        <span className="bk-btn-brk">]</span>
                      </button>
                      <button type="button" className="bk-btn bk-btn--neutral" onClick={() => setOpenBanForm(null)}>
                        <span className="bk-btn-brk">[</span>
                        <span className="bk-btn-label">CANCEL</span>
                        <span className="bk-btn-brk">]</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <button type="button" className="bk-btn bk-btn--bad" onClick={() => setOpenBanForm(user.id)}>
                    <span className="bk-btn-brk">[</span>
                    <span className="bk-btn-label">SUSPEND</span>
                    <span className="bk-btn-brk">]</span>
                  </button>
                )
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    </>
  );
}
