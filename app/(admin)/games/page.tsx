import { prisma } from "@/lib/prisma";
import { GamesTable } from "@/app/components/GamesTable";

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

export default async function GamesPage() {
  const raw = await getGames();

  const games = raw.map((g) => ({
    id: g.id,
    gameType: g.gameType,
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    startedAt: g.startedAt?.toISOString() ?? null,
    endedAt: g.endedAt?.toISOString() ?? null,
    durationSeconds: g.durationSeconds,
    playerCount: g.Players.length,
  }));

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
        <GamesTable games={games} />
        {games.length === 0 && <div className="bk-empty">no games found</div>}
        <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
          {games.length} records · bots excluded from player count
        </div>
      </div>
    </div>
  );
}
