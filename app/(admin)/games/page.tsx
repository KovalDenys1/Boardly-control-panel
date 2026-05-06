import { prisma } from "@/lib/prisma";
import { GamesTable } from "@/app/components/GamesTable";
import Link from "next/link";

const PAGE_SIZE = 50;

async function getGames(page: number) {
  const [raw, total] = await Promise.all([
    prisma.games.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, gameType: true, status: true,
        createdAt: true, startedAt: true, endedAt: true, durationSeconds: true,
        Players: { where: { Users: { Bots: null } }, select: { id: true } },
        Lobbies: {
          select: {
            Users: { select: { username: true, email: true } },
          },
        },
      },
    }),
    prisma.games.count(),
  ]);
  return { raw, total };
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { raw, total } = await getGames(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const games = raw.map((g) => ({
    id: g.id,
    gameType: g.gameType,
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    startedAt: g.startedAt?.toISOString() ?? null,
    endedAt: g.endedAt?.toISOString() ?? null,
    durationSeconds: g.durationSeconds,
    playerCount: g.Players.length,
    creatorUsername: g.Lobbies?.Users?.username ?? null,
    creatorEmail: g.Lobbies?.Users?.email ?? null,
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
            <p className="bk-page-sub">
              {"// "}{total}{" sessions · page "}{page}{" of "}{totalPages}{" · click row for details"}
            </p>
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

      <div>
        <GamesTable games={games} />
        {games.length === 0 && <div className="bk-empty">no games found</div>}
        <div
          className="bk-table-foot"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--mute)" }}
        >
          <span>
            {games.length} records on this page · {total} total · bots excluded from player count
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {page > 1 && (
              <Link href={`/games?page=${page - 1}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>PREV</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/games?page=${page + 1}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>NEXT</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
