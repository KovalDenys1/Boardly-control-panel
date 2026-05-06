import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getGame(id: string) {
  return prisma.games.findUnique({
    where: { id },
    select: {
      id: true, gameType: true, status: true, currentTurn: true,
      createdAt: true, startedAt: true, endedAt: true, abandonedAt: true,
      lastMoveAt: true, durationSeconds: true, terminalMetadata: true,
      Lobbies: {
        select: {
          code: true, name: true, maxPlayers: true, turnTimer: true,
          allowSpectators: true, spectatorCount: true,
          password: true,
          Users: { select: { username: true, email: true } },
        },
      },
      Players: {
        orderBy: [
          { placement: { sort: "asc", nulls: "last" } },
          { position: "asc" },
        ],
        select: {
          score: true, finalScore: true, placement: true,
          isWinner: true, position: true,
          Users: {
            select: {
              id: true, username: true, email: true, isGuest: true, role: true,
              Bots: { select: { id: true } },
            },
          },
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

function placementLabel(n: number | null) {
  if (!n) return "—";
  return `${n}${["st", "nd", "rd"][n - 1] ?? "th"}`;
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bk-section">
      <div className="bk-section-head">
        <span className="bk-section-bracket">┌─</span>
        <span className="bk-section-title">{title}</span>
        <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
        <span className="bk-section-bracket">─┐</span>
      </div>
      <div className="bk-section-body">{children}</div>
      <div className="bk-section-foot">
        <span className="bk-section-bracket">└</span>
        <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
        <span className="bk-section-bracket">┘</span>
      </div>
    </div>
  );
}

function InfoGrid({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "6px 40px" }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed var(--line)" }}>
          <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", letterSpacing: "0.08em" }}>{label}</span>
          <span style={{ color: "var(--fg-strong)", fontSize: "var(--fz-xs)", textAlign: "right", maxWidth: "60%" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const lobby = game.Lobbies;
  const creator = lobby?.Users;

  const humanPlayers = game.Players.filter((p) => !p.Users.Bots);
  const botPlayers   = game.Players.filter((p) =>  p.Users.Bots);
  const isFinished   = game.status === "finished";

  const gameInfoRows: [string, React.ReactNode][] = [
    ["game type",    gameTypeLabels[game.gameType] ?? game.gameType],
    ["lobby code",   lobby ? <span style={{ color: "var(--accent)" }}>{lobby.code}</span> : "—"],
    ["lobby name",   lobby?.name ?? "—"],
    ["creator",      creator?.username ?? <span style={{ color: "var(--mute-2)" }}>—</span>],
    ["creator email", creator?.email ?? <span style={{ color: "var(--mute-2)" }}>—</span>],
    ["created",      fmt(game.createdAt)],
    ["started",      fmt(game.startedAt)],
    ["ended",        fmt(game.endedAt)],
    ...(game.abandonedAt ? [["abandoned at", fmt(game.abandonedAt)] as [string, React.ReactNode]] : []),
    ["last move",    fmt(game.lastMoveAt)],
    ["duration",     fmtDur(game.durationSeconds)],
    ["turns played", game.currentTurn > 0 ? String(game.currentTurn) : "—"],
    ["players",      `${humanPlayers.length} human${botPlayers.length > 0 ? ` · ${botPlayers.length} bot` : ""}`],
  ];

  const lobbyRows: [string, React.ReactNode][] = lobby ? [
    ["max players",      String(lobby.maxPlayers)],
    ["turn timer",       `${lobby.turnTimer}s`],
    ["password",         lobby.password ? <span style={{ color: "var(--bad)" }}>protected</span> : <span style={{ color: "var(--mute-2)" }}>none</span>],
    ["spectators",       lobby.allowSpectators ? `allowed (${lobby.spectatorCount} watched)` : <span style={{ color: "var(--mute-2)" }}>disabled</span>],
  ] : [];

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">
          <Link href="/games" style={{ color: "var(--accent)", textDecoration: "none" }}>./games.log</Link>
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

      <SectionBox title="game_info">
        <InfoGrid rows={gameInfoRows} />
      </SectionBox>

      {lobby && (
        <SectionBox title="lobby_config">
          <InfoGrid rows={lobbyRows} />
        </SectionBox>
      )}

      <SectionBox title="players">
        <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
          <table className="bk-table">
            <thead>
              <tr>
                <th className="bk-th-num">SEAT</th>
                <th>PLAYER</th>
                <th>TYPE</th>
                {isFinished && <th>PLACEMENT</th>}
                <th className="bk-th-right">SCORE</th>
                <th className="bk-th-right">FINAL</th>
              </tr>
            </thead>
            <tbody>
              {humanPlayers.map((p) => {
                const isWinner = isFinished && p.isWinner && p.placement === 1;
                return (
                  <tr key={p.Users.id}>
                    <td className="bk-td-num" style={{ color: "var(--mute)" }}>
                      {String(p.position).padStart(2, "0")}
                    </td>
                    <td>
                      <div className="bk-cell-user-name">
                        {p.Users.username ?? <span style={{ color: "var(--mute-2)", fontStyle: "italic" }}>guest</span>}
                        {p.Users.role === "admin" && (
                          <> <span className="bk-brk bk-brk--accent" style={{ fontSize: "10px" }}>
                            <span className="bk-brk-l">[</span>ADMIN<span className="bk-brk-r">]</span>
                          </span></>
                        )}
                      </div>
                      <div className="bk-cell-user-mail">
                        {p.Users.isGuest ? "guest session" : (p.Users.email ?? "—")}
                      </div>
                    </td>
                    <td>
                      {p.Users.isGuest ? (
                        <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>GUEST<span className="bk-brk-r">]</span></span>
                      ) : (
                        <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>REG<span className="bk-brk-r">]</span></span>
                      )}
                    </td>
                    {isFinished && (
                      <td>
                        <span style={{ color: "var(--fg-strong)" }}>{placementLabel(p.placement)}</span>
                        {isWinner && (
                          <> <span className="bk-brk bk-brk--warn">
                            <span className="bk-brk-l">[</span>WINNER<span className="bk-brk-r">]</span>
                          </span></>
                        )}
                      </td>
                    )}
                    <td className="bk-td-right" style={{ color: "var(--fg)" }}>{p.score}</td>
                    <td className="bk-td-right" style={{ color: "var(--fg-strong)", fontWeight: 600 }}>
                      {p.finalScore ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {humanPlayers.length === 0 && (
            <div className="bk-empty">no player records found</div>
          )}
          <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
            {humanPlayers.length} human player{humanPlayers.length !== 1 ? "s" : ""}
            {botPlayers.length > 0 && ` · ${botPlayers.length} bot${botPlayers.length !== 1 ? "s" : ""}`}
            {" · guest emails not stored"}
          </div>
        </div>
      </SectionBox>
    </div>
  );
}
