import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getGame(id: string) {
  return prisma.games.findUnique({
    where: { id },
    select: {
      id: true, gameType: true, status: true, currentTurn: true,
      createdAt: true, startedAt: true, endedAt: true, durationSeconds: true,
      Lobbies: { select: { code: true, name: true } },
      Players: {
        where: { Users: { Bots: null } },
        orderBy: { placement: "asc" },
        select: {
          score: true, finalScore: true, placement: true, isWinner: true,
          Users: { select: { id: true, username: true, email: true, isGuest: true, role: true } },
        },
      },
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

function statusBadge(status: string) {
  const map: Record<string, string> = { playing: "ok", finished: "mute", abandoned: "bad", waiting: "mute", cancelled: "mute" };
  const tone = map[status] ?? "mute";
  return (
    <span className={`bk-brk bk-brk--${tone}`}>
      <span className="bk-brk-l">[</span>{status.toUpperCase()}<span className="bk-brk-r">]</span>
    </span>
  );
}

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDur(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60), sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function placement(n: number | null) {
  if (!n) return "—";
  return `${n}${["st","nd","rd"][n-1] ?? "th"}`;
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const info = [
    ["game type",    gameTypeLabels[game.gameType] ?? game.gameType],
    ["lobby",        game.Lobbies ? `${game.Lobbies.name}  [${game.Lobbies.code}]` : "—"],
    ["created",      fmt(game.createdAt)],
    ["started",      fmt(game.startedAt)],
    ["ended",        fmt(game.endedAt)],
    ["duration",     fmtDur(game.durationSeconds)],
    ["turns played", game.currentTurn > 0 ? String(game.currentTurn) : "—"],
    ["players",      String(game.Players.length)],
  ];

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">
          <Link href="/games" style={{ color: "var(--accent)", textDecoration: "none" }}>
            ./games.log
          </Link>
          {" "}/ {game.id}
        </div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">
              {gameTypeLabels[game.gameType] ?? game.gameType}
              <span className="bk-stat-cursor">▊</span>
            </h1>
            <p className="bk-page-sub" style={{ fontFamily: "var(--mono)", letterSpacing: "0.02em" }}>
              // {game.id}
            </p>
          </div>
          {statusBadge(game.status)}
        </div>
      </div>

      {/* Game info */}
      <div className="bk-section" style={{ marginBottom: 24 }}>
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">game_info</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 40px" }}>
            {info.map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--line)" }}>
                <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ color: "var(--fg-strong)", fontSize: "var(--fz-xs)" }}>{value}</span>
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

      {/* Players */}
      <div className="bk-table-wrap">
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", background: "rgba(0,0,0,0.3)" }}>
          <span style={{ color: "var(--accent)", fontSize: "var(--fz-xs)", fontWeight: 600, letterSpacing: "0.14em" }}>
            PLAYERS
          </span>
        </div>
        <table className="bk-table">
          <thead>
            <tr>
              <th>PLACEMENT</th>
              <th>USERNAME</th>
              <th>EMAIL</th>
              <th>TYPE</th>
              <th className="bk-th-right">SCORE</th>
              <th className="bk-th-right">FINAL SCORE</th>
            </tr>
          </thead>
          <tbody>
            {game.Players.map((p, i) => (
              <tr key={i} className={p.isWinner ? "winner-row" : ""}>
                <td>
                  <span style={{ color: "var(--fg-strong)" }}>{placement(p.placement)}</span>
                  {p.isWinner && (
                    <> <span className="bk-brk bk-brk--warn">
                      <span className="bk-brk-l">[</span>WINNER<span className="bk-brk-r">]</span>
                    </span></>
                  )}
                </td>
                <td>
                  <div className="bk-cell-user-name">{p.Users.username ?? "—"}</div>
                  {p.Users.role === "admin" && (
                    <div style={{ marginTop: 2 }}>
                      <span className="bk-brk bk-brk--accent" style={{ fontSize: "10px" }}>
                        <span className="bk-brk-l">[</span>ADMIN<span className="bk-brk-r">]</span>
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  {p.Users.isGuest
                    ? <span style={{ color: "var(--mute-2)", fontStyle: "italic" }}>guest session</span>
                    : <span className="bk-cell-user-mail">{p.Users.email ?? "—"}</span>
                  }
                </td>
                <td>
                  {p.Users.isGuest ? (
                    <span className="bk-brk bk-brk--mute">
                      <span className="bk-brk-l">[</span>GUEST<span className="bk-brk-r">]</span>
                    </span>
                  ) : (
                    <span className="bk-brk bk-brk--mute">
                      <span className="bk-brk-l">[</span>REGISTERED<span className="bk-brk-r">]</span>
                    </span>
                  )}
                </td>
                <td className="bk-td-right" style={{ color: "var(--fg)" }}>{p.score}</td>
                <td className="bk-td-right" style={{ color: "var(--fg-strong)", fontWeight: 600 }}>
                  {p.finalScore ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {game.Players.length === 0 && (
          <div className="bk-empty">no player records found</div>
        )}
        <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
          {game.Players.length} players · bots excluded · guest emails not stored
        </div>
      </div>
    </div>
  );
}
