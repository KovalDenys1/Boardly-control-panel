"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  premiumUntil: string | null;
};

type SortKey = "username" | "role" | "createdAt" | "lastActiveAt" | "online" | "status" | "premium";
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

export function UsersTable({
  users,
  handleSuspend,
  total,
  filteredTotal,
  currentSort,
  currentDir,
  pageOffset,
}: {
  users: UserRow[];
  handleSuspend: (formData: FormData) => Promise<void>;
  total: number;
  filteredTotal: number;
  currentSort: SortKey | null;
  currentDir: SortDir;
  pageOffset: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openBanForm, setOpenBanForm] = useState<string | null>(null);

  const q = searchParams.get("q") ?? "";
  const roleFilter = searchParams.get("role") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const isFiltered = !!(q || roleFilter || statusFilter || currentSort);

  const [searchInput, setSearchInput] = useState(q);
  const prevQ = useRef(q);
  useEffect(() => {
    if (q !== prevQ.current) {
      setSearchInput(q);
      prevQ.current = q;
    }
  }, [q]);

  function buildParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.set("page", "1");
    return params.toString();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    params.set("page", "1");
    router.push(`/users?${params.toString()}`);
  }

  function makeSortUrl(key: SortKey) {
    const newDir = currentSort === key && currentDir === "asc" ? "desc" : "asc";
    return `/users?${buildParams({ sort: key, dir: newDir })}`;
  }

  function Th({ col, children, className }: { col: SortKey; children: React.ReactNode; className?: string }) {
    const active = currentSort === col;
    return (
      <th
        className={`bk-th-sort${active ? " bk-th-sort--active" : ""}${className ? ` ${className}` : ""}`}
        onClick={() => router.push(makeSortUrl(col))}
      >
        {children}
        <span className={`bk-sort-icon${active ? " bk-sort-icon--active" : ""}`}>
          {active ? (currentDir === "asc" ? "▲" : "▼") : "·"}
        </span>
      </th>
    );
  }

  return (
    <>
      <div className="bk-filter-bar">
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: "flex" }}>
          <div className="bk-search-bar" style={{ flex: 1 }}>
            <span className="bk-search-prompt">$</span>
            <input
              type="text"
              className="bk-search-input"
              placeholder="search username or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            {isFiltered && (
              <span className="bk-search-count">{filteredTotal} / {total}</span>
            )}
          </div>
        </form>
        <div className="bk-select-wrap">
          <span className="bk-select-brk">[</span>
          <select
            className="bk-filter-select"
            value={roleFilter}
            onChange={(e) => router.push(`/users?${buildParams({ role: e.target.value })}`)}
          >
            <option value="">all roles</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
          <span className="bk-select-brk">]</span>
        </div>
        <div className="bk-select-wrap">
          <span className="bk-select-brk">[</span>
          <select
            className="bk-filter-select"
            value={statusFilter}
            onChange={(e) => router.push(`/users?${buildParams({ status: e.target.value })}`)}
          >
            <option value="">all status</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="premium">premium</option>
          </select>
          <span className="bk-select-brk">]</span>
        </div>
      </div>
      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th className="bk-th-num">#</th>
              <Th col="username">USER</Th>
              <Th col="role">ROLE</Th>
              <Th col="createdAt">JOINED</Th>
              <Th col="lastActiveAt">LAST ACTIVE</Th>
              <Th col="online">ONLINE</Th>
              <Th col="status">STATUS</Th>
              <Th col="premium">PREMIUM</Th>
              <th className="bk-th-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="bk-empty-cell">// no results</td>
              </tr>
            ) : users.map((user, i) => (
              <tr key={user.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/users/${user.id}`)}>
                <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(pageOffset + i + 1).padStart(2, "0")}</td>
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
                <td>
                  {user.premiumUntil && new Date(user.premiumUntil) > new Date() ? (
                    <span className="bk-brk bk-brk--warn">
                      <span className="bk-brk-l">[</span>PREMIUM<span className="bk-brk-r">]</span>
                    </span>
                  ) : (
                    <span style={{ color: "var(--mute-2)" }}>—</span>
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
                        <div className="bk-search-bar" style={{ marginBottom: 0, width: "100%" }}>
                          <span className="bk-search-prompt">$</span>
                          <input
                            type="text"
                            name="banReason"
                            placeholder="reason (optional)"
                            className="bk-search-input"
                            maxLength={200}
                            spellCheck={false}
                            autoComplete="off"
                          />
                        </div>
                        <div className="bk-select-wrap" style={{ width: "100%" }}>
                          <span className="bk-select-brk">[</span>
                          <select name="banDuration" className="bk-filter-select" style={{ flex: 1 }}>
                            <option value="0">permanent</option>
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7">7 days</option>
                            <option value="30">30 days</option>
                          </select>
                          <span className="bk-select-brk">]</span>
                        </div>
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
