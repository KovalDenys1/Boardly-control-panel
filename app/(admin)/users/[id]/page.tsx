import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getUser(id: string) {
  return prisma.users.findUnique({
    where: { id, isGuest: false },
    select: {
      id: true, email: true, username: true, role: true, friendCode: true,
      suspended: true, banReason: true, banExpiresAt: true,
      createdAt: true, lastActiveAt: true, emailVerified: true,
      Players: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          score: true, finalScore: true, placement: true, isWinner: true, position: true,
          createdAt: true,
          Games: {
            select: {
              id: true, gameType: true, status: true,
              createdAt: true, endedAt: true, durationSeconds: true,
            },
          },
        },
      },
    },
  });
}

async function getAuditLog(userId: string) {
  return prisma.adminAuditLogs.findMany({
    where: { targetId: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, action: true, details: true, createdAt: true,
      Users: { select: { username: true, email: true } },
    },
  });
}

const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee", tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "Rock Paper Scissors", guess_the_spy: "Guess the Spy",
  memory: "Memory", telephone_doodle: "Telephone Doodle",
  sketch_and_guess: "Sketch & Guess", liars_party: "Liars Party",
  fake_artist: "Fake Artist", other: "Other",
};

function fmt(d: Date | null | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDur(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60), sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function placementLabel(n: number | null) {
  if (!n) return "—";
  return `${n}${(["st", "nd", "rd"][n - 1]) ?? "th"}`;
}

const ONLINE_MS = 10 * 60 * 1000;

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, auditLog] = await Promise.all([getUser(id), getAuditLog(id)]);
  if (!user) notFound();

  const isOnline = Date.now() - new Date(user.lastActiveAt).getTime() < ONLINE_MS;

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">
          <Link href="/users" style={{ color: "var(--accent)", textDecoration: "none" }}>./users.log</Link>
          {" "}/ {user.username ?? user.id}
        </div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">
              {user.username ?? <span style={{ color: "var(--mute)" }}>no username</span>}
              <span className="bk-stat-cursor">▊</span>
            </h1>
            <p className="bk-page-sub" style={{ fontFamily: "var(--mono)" }}>
              {"// "}{user.email ?? "—"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {user.role === "admin" && (
              <span className="bk-brk bk-brk--accent">
                <span className="bk-brk-l">[</span>ADMIN<span className="bk-brk-r">]</span>
              </span>
            )}
            {user.suspended ? (
              <span className="bk-brk bk-brk--bad">
                <span className="bk-brk-l">[</span>SUSPENDED<span className="bk-brk-r">]</span>
              </span>
            ) : isOnline ? (
              <span className="bk-brk bk-brk--ok">
                <span className="bk-brk-l">[</span>ONLINE<span className="bk-brk-r">]</span>
              </span>
            ) : (
              <span className="bk-brk bk-brk--mute">
                <span className="bk-brk-l">[</span>OFFLINE<span className="bk-brk-r">]</span>
              </span>
            )}
            <Link href="/users" className="bk-btn bk-btn--neutral">
              <span className="bk-btn-brk">[</span>
              <span className="bk-btn-label">← BACK</span>
              <span className="bk-btn-brk">]</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">profile</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "6px 40px" }}>
            {([
              ["user id",      <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{user.id}</span>],
              ["username",     user.username ?? "—"],
              ["email",        user.email ?? "—"],
              ["role",         user.role],
              ["friend code",  user.friendCode ?? "—"],
              ["email verified", user.emailVerified ? fmt(user.emailVerified) : <span style={{ color: "var(--bad)" }}>no</span>],
              ["joined",       fmt(user.createdAt)],
              ["last active",  fmt(user.lastActiveAt)],
              ["status",       user.suspended
                ? <span style={{ color: "var(--bad)" }}>suspended{user.banReason ? ` — ${user.banReason}` : ""}</span>
                : <span style={{ color: "var(--accent)" }}>active</span>],
              ...(user.suspended && user.banExpiresAt ? [["ban expires", fmt(user.banExpiresAt)] as [string, React.ReactNode]] : []),
            ] as [string, React.ReactNode][]).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed var(--line)" }}>
                <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ color: "var(--fg-strong)", fontSize: "var(--fz-xs)", textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>

      {/* Game history */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">game_history</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
            <table className="bk-table">
              <thead>
                <tr>
                  <th>GAME</th>
                  <th>STATUS</th>
                  <th>PLACEMENT</th>
                  <th className="bk-th-right">SCORE</th>
                  <th className="bk-th-right">DURATION</th>
                  <th className="bk-th-right">DATE</th>
                </tr>
              </thead>
              <tbody>
                {user.Players.map((p) => (
                  <tr key={p.Games.id} style={{ cursor: "pointer" }} onClick={undefined}>
                    <td>
                      <Link href={`/games/${p.Games.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                        {gameTypeLabels[p.Games.gameType] ?? p.Games.gameType}
                      </Link>
                    </td>
                    <td>
                      <span className={`bk-brk bk-brk--${p.Games.status === "playing" ? "ok" : p.Games.status === "abandoned" ? "bad" : "mute"}`}>
                        <span className="bk-brk-l">[</span>{p.Games.status.toUpperCase()}<span className="bk-brk-r">]</span>
                      </span>
                    </td>
                    <td style={{ color: "var(--fg-strong)" }}>
                      {placementLabel(p.placement)}
                      {p.isWinner && p.placement === 1 && (
                        <> <span className="bk-brk bk-brk--warn" style={{ fontSize: 10 }}>
                          <span className="bk-brk-l">[</span>W<span className="bk-brk-r">]</span>
                        </span></>
                      )}
                    </td>
                    <td className="bk-td-right" style={{ color: "var(--fg)" }}>{p.finalScore ?? p.score}</td>
                    <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmtDur(p.Games.durationSeconds)}</td>
                    <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmt(p.Games.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {user.Players.length === 0 && <div className="bk-empty">no games played</div>}
            <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
              {user.Players.length} recent games shown · click game name to open session detail
            </div>
          </div>
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>

      {/* Audit log */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">admin_actions</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          {auditLog.length === 0 ? (
            <div className="bk-empty">no admin actions recorded</div>
          ) : (
            <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>ACTION</th>
                    <th>BY</th>
                    <th>REASON</th>
                    <th className="bk-th-right">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log) => {
                    const details = log.details as Record<string, unknown> | null;
                    const reason = details?.banReason as string | null;
                    return (
                      <tr key={log.id}>
                        <td>
                          <span className={`bk-brk bk-brk--${log.action.includes("unsuspend") ? "ok" : "bad"}`}>
                            <span className="bk-brk-l">[</span>
                            {log.action.replace(/_/g, " ").toUpperCase()}
                            <span className="bk-brk-r">]</span>
                          </span>
                        </td>
                        <td style={{ color: "var(--fg)" }}>
                          {log.Users.username ?? log.Users.email ?? "—"}
                        </td>
                        <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>
                          {reason ?? <span style={{ color: "var(--mute-2)" }}>—</span>}
                        </td>
                        <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>
                          {fmt(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>
    </div>
  );
}
