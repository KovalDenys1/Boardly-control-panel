"use client";

import { useState, useMemo } from "react";

export type UserRow = {
  id: string;
  email: string;
  username: string | null;
  role: string;
  suspended: boolean;
  createdAt: string;
  lastActiveAt: string;
};

type SortKey = "index" | "username" | "role" | "createdAt" | "lastActiveAt" | "status";
type SortDir = "asc" | "desc";

type IndexedUserRow = UserRow & { _idx: number };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function compare(a: IndexedUserRow, b: IndexedUserRow, key: SortKey, dir: SortDir): number {
  let va: string | number, vb: string | number;
  switch (key) {
    case "index":      va = a._idx; vb = b._idx; break;
    case "username":   va = (a.username ?? a.email).toLowerCase(); vb = (b.username ?? b.email).toLowerCase(); break;
    case "role":       va = a.role; vb = b.role; break;
    case "createdAt":  va = new Date(a.createdAt).getTime();     vb = new Date(b.createdAt).getTime();     break;
    case "lastActiveAt": va = new Date(a.lastActiveAt).getTime(); vb = new Date(b.lastActiveAt).getTime(); break;
    case "status":     va = a.suspended ? 1 : 0; vb = b.suspended ? 1 : 0; break;
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
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const indexed = useMemo<IndexedUserRow[]>(
    () => users.map((u, i) => ({ ...u, _idx: i })),
    [users],
  );

  const sorted = useMemo(
    () => sortKey ? [...indexed].sort((a, b) => compare(a, b, sortKey, sortDir)) : indexed,
    [indexed, sortKey, sortDir],
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
    <table className="bk-table">
      <thead>
        <tr>
          <Th col="index" className="bk-th-num">#</Th>
          <Th col="username">USER</Th>
          <Th col="role">ROLE</Th>
          <Th col="createdAt">JOINED</Th>
          <Th col="lastActiveAt">LAST ACTIVE</Th>
          <Th col="status">STATUS</Th>
          <th className="bk-th-right">ACTION</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((user, i) => (
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
                <span className="bk-brk bk-brk--bad"><span className="bk-brk-l">[</span>SUSPENDED<span className="bk-brk-r">]</span></span>
              ) : (
                <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>ACTIVE<span className="bk-brk-r">]</span></span>
              )}
            </td>
            <td className="bk-td-right">
              {user.role !== "admin" && (
                <form action={handleSuspend}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="action" value={user.suspended ? "unsuspend" : "suspend"} />
                  <button type="submit" className={`bk-btn ${user.suspended ? "bk-btn--neutral" : "bk-btn--bad"}`}>
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
  );
}
