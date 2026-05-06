import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getGames() {
  return prisma.games.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, gameType: true, status: true,
      createdAt: true, startedAt: true, endedAt: true, durationSeconds: true,
      Players: { where: { Users: { Bots: null } }, select: { id: true } },
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
  const map: Record<string, { tone: string; label: string }> = {
    playing:   { tone: "ok",   label: "PLAYING" },
    waiting:   { tone: "mute", label: "WAITING" },
    finished:  { tone: "mute", label: "FINISHED" },
    abandoned: { tone: "bad",  label: "ABANDONED" },
    cancelled: { tone: "mute", label: "CANCELLED" },
  };
  const { tone, label } = map[status] ?? { tone: "mute", label: status.toUpperCase() };
  return (
    <span className={`bk-brk bk-brk--${tone}`}>
      <span className="bk-brk-l">[</span>{label}<span className="bk-brk-r">]</span>
    </span>
  );
}

function fmtDate(d: Date | null) {
  if (!d) return <span style={{ color: "var(--mute-2)" }}>—</span>;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date | null) {
  if (!d) return <span style={{ color: "var(--mute-2)" }}>—</span>;
  const t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <span>
      <span style={{ color: "var(--fg-strong)" }}>{t}</span>
      <span style={{ color: "var(--mute)", marginLeft: 4 }}>{date}</span>
    </span>
  );
}

function fmtDur(s: number | null) {
  if (!s) return <span style={{ color: "var(--mute-2)" }}>—</span>;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return <>{m > 0 ? `${m}m ${sec}s` : `${sec}s`}</>;
}

export default async function GamesPage() {
  const games = await getGames();
  const counts = {
    playing:   games.filter((g) => g.status === "playing").length,
    finished:  games.filter((g) => g.status === "finished").length,
    abandoned: games.filter((g) => g.status === "abandoned").length,
  };

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./games.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">games<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">// last 50 sessions — click row for details</p>
          </div>
          <div className="bk-pill-row">
            <span className="bk-pill bk-pill--ok">
              <span className="bk-pill-count">{counts.playing}</span>
              <span className="bk-pill-sep">·</span><span>ACTIVE</span>
            </span>
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">{counts.finished}</span>
              <span className="bk-pill-sep">·</span><span>FINISHED</span>
            </span>
            <span className="bk-pill bk-pill--bad">
              <span className="bk-pill-count">{counts.abandoned}</span>
              <span className="bk-pill-sep">·</span><span>ABANDONED</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th className="bk-th-num">#</th>
              <th>GAME TYPE</th>
              <th>STATUS</th>
              <th>PLAYERS</th>
              <th>CREATED</th>
              <th>STARTED</th>
              <th>ENDED</th>
              <th className="bk-th-right">DURATION</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game, i) => (
              <tr key={game.id} style={{ cursor: "pointer" }}>
                <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(i + 1).padStart(2, "0")}</td>
                <td>
                  <Link href={`/games/${game.id}`} style={{ color: "var(--fg-strong)", textDecoration: "none", fontWeight: 600, display: "block" }}>
                    {gameTypeLabels[game.gameType] ?? game.gameType}
                  </Link>
                </td>
                <td><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{statusBadge(game.status)}</Link></td>
                <td style={{ color: "var(--fg)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{game.Players.length}</Link></td>
                <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDate(game.createdAt)}</Link></td>
                <td style={{ fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDateTime(game.startedAt)}</Link></td>
                <td style={{ fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDateTime(game.endedAt)}</Link></td>
                <td className="bk-td-right" style={{ color: "var(--fg)", fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDur(game.durationSeconds)}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {games.length === 0 && <div className="bk-empty">no games found</div>}
        <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
          {games.length} records · bots excluded from player count
        </div>
      </div>
    </div>
  );
}
