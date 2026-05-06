import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { GamesTable } from "@/app/components/GamesTable";
import Link from "next/link";

const PAGE_SIZE = 50;

type SortKey = "status" | "playerCount" | "createdAt" | "startedAt" | "endedAt" | "durationSeconds";

async function getGames(page: number, typeFilter: string, statusFilter: string, q: string, sort: string, dir: string) {
  const d = dir === "asc" ? "asc" : ("desc" as const);

  const where: Prisma.GamesWhereInput = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeFilter) (where as any).gameType = typeFilter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (statusFilter) (where as any).status = statusFilter;
  if (q) {
    where.Lobbies = {
      Users: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
    };
  }

  let orderBy: Prisma.GamesOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "status") orderBy = { status: d };
  else if (sort === "playerCount") orderBy = { Players: { _count: d } };
  else if (sort === "createdAt") orderBy = { createdAt: d };
  else if (sort === "startedAt") orderBy = { startedAt: { sort: d, nulls: "last" } };
  else if (sort === "endedAt") orderBy = { endedAt: { sort: d, nulls: "last" } };
  else if (sort === "durationSeconds") orderBy = { durationSeconds: { sort: d, nulls: "last" } };

  const [raw, total, filteredTotal, playingCount, finishedCount, abandonedCount] = await Promise.all([
    prisma.games.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy,
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
    prisma.games.count({ where }),
    prisma.games.count({ where: { status: "playing" } }),
    prisma.games.count({ where: { status: "finished" } }),
    prisma.games.count({ where: { status: "abandoned" } }),
  ]);

  return { raw, total, filteredTotal, counts: { playing: playingCount, finished: finishedCount, abandoned: abandonedCount } };
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; status?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const { page: pageParam, type = "", status = "", q = "", sort = "", dir = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { raw, total, filteredTotal, counts } = await getGames(page, type, status, q, sort, dir);
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);

  const currentSort = (["status", "playerCount", "createdAt", "startedAt", "endedAt", "durationSeconds"].includes(sort) ? sort : null) as SortKey | null;
  const currentDir = dir === "asc" ? "asc" : "desc";

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

  const paginationParams = `&type=${type}&status=${status}&q=${q}&sort=${sort}&dir=${dir}`;

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
        <GamesTable
          games={games}
          total={total}
          filteredTotal={filteredTotal}
          currentSort={currentSort}
          currentDir={currentDir}
          pageOffset={(page - 1) * PAGE_SIZE}
        />
        <div
          className="bk-table-foot"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--mute)" }}
        >
          <span>
            {filteredTotal} records · {total} total · bots excluded from player count
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {page > 1 && (
              <Link href={`/games?page=1${paginationParams}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>«</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page > 1 && (
              <Link href={`/games?page=${page - 1}${paginationParams}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>←</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            <form action="/games" method="get" className="bk-page-form">
              {type && <input type="hidden" name="type" value={type} />}
              {status && <input type="hidden" name="status" value={status} />}
              {q && <input type="hidden" name="q" value={q} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {dir && <input type="hidden" name="dir" value={dir} />}
              <span className="bk-page-form-brk">[</span>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="page" defaultValue={page} style={{ width: `${String(totalPages).length}ch` }} className="bk-page-input-inline" />
              <span>/</span>
              <span style={{ fontWeight: 600, color: "var(--fg-strong)" }}>{totalPages}</span>
              <span className="bk-page-form-brk">]</span>
            </form>
            {page < totalPages && (
              <Link href={`/games?page=${page + 1}${paginationParams}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>→</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/games?page=${totalPages}${paginationParams}`} className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
                <span className="bk-btn-brk">[</span><span>»</span><span className="bk-btn-brk">]</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
