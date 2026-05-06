"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export type GameRow = {
  id: string;
  gameType: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  playerCount: number;
  creatorUsername: string | null;
  creatorEmail: string | null;
};

const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee", tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "Rock Paper Scissors", guess_the_spy: "Guess the Spy",
  memory: "Memory", telephone_doodle: "Telephone Doodle",
  sketch_and_guess: "Sketch & Guess", liars_party: "Liars Party",
  fake_artist: "Fake Artist", other: "Other",
};

type SortKey = "status" | "playerCount" | "createdAt" | "startedAt" | "endedAt" | "durationSeconds";
type SortDir = "asc" | "desc";

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

function fmtDate(iso: string | null) {
  if (!iso) return <span style={{ color: "var(--mute-2)" }}>—</span>;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return <span style={{ color: "var(--mute-2)" }}>—</span>;
  const d = new Date(iso);
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
  const m = Math.floor(s / 60), sec = s % 60;
  return <>{m > 0 ? `${m}m ${sec}s` : `${sec}s`}</>;
}

function numVal(v: string | null): number {
  return v ? new Date(v).getTime() : -1;
}

function compare(a: GameRow, b: GameRow, key: SortKey, dir: SortDir): number {
  let va: string | number, vb: string | number;
  switch (key) {
    case "status":          va = a.status; vb = b.status; break;
    case "playerCount":     va = a.playerCount; vb = b.playerCount; break;
    case "createdAt":       va = numVal(a.createdAt); vb = numVal(b.createdAt); break;
    case "startedAt":       va = numVal(a.startedAt); vb = numVal(b.startedAt); break;
    case "endedAt":         va = numVal(a.endedAt);   vb = numVal(b.endedAt);   break;
    case "durationSeconds": va = a.durationSeconds ?? -1; vb = b.durationSeconds ?? -1; break;
  }
  if (va < vb) return dir === "asc" ? -1 : 1;
  if (va > vb) return dir === "asc" ? 1 : -1;
  return 0;
}

export function GamesTable({ games }: { games: GameRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [gameTypeFilter, setGameTypeFilter] = useState("all");
  const [creatorQuery, setCreatorQuery] = useState("");

  const availableTypes = useMemo(() => {
    const types = new Set(games.map((g) => g.gameType));
    return Array.from(types).sort((a, b) =>
      (gameTypeLabels[a] ?? a).localeCompare(gameTypeLabels[b] ?? b),
    );
  }, [games]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    let result = games;
    if (gameTypeFilter !== "all") {
      result = result.filter((g) => g.gameType === gameTypeFilter);
    }
    const q = creatorQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((g) =>
        (g.creatorUsername ?? "").toLowerCase().includes(q) ||
        (g.creatorEmail ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [games, gameTypeFilter, creatorQuery]);

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

  const isFiltered = gameTypeFilter !== "all" || creatorQuery.trim() !== "";

  return (
    <>
    <div className="bk-filter-bar">
      <div className="bk-select-wrap">
        <span className="bk-select-brk">[</span>
        <select
          className="bk-filter-select"
          value={gameTypeFilter}
          onChange={(e) => setGameTypeFilter(e.target.value)}
        >
          <option value="all">all games</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>{gameTypeLabels[t] ?? t}</option>
          ))}
        </select>
        <span className="bk-select-brk">]</span>
      </div>
      <div className="bk-search-bar" style={{ marginBottom: 0, flex: 1 }}>
        <span className="bk-search-prompt">$</span>
        <input
          type="text"
          className="bk-search-input"
          placeholder="search creator..."
          value={creatorQuery}
          onChange={(e) => setCreatorQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      {isFiltered && (
        <span className="bk-search-count" style={{ alignSelf: "center" }}>
          {sorted.length} / {games.length}
        </span>
      )}
    </div>
    <div className="bk-table-wrap">
    <table className="bk-table" style={{ minHeight: "320px" }}>
      <thead>
        <tr>
          <th className="bk-th-num">#</th>
          <th>GAME TYPE</th>
          <th>CREATOR</th>
          <Th col="status">STATUS</Th>
          <Th col="playerCount">PLAYERS</Th>
          <Th col="createdAt">CREATED</Th>
          <Th col="startedAt">STARTED</Th>
          <Th col="endedAt">ENDED</Th>
          <Th col="durationSeconds" className="bk-th-right">DURATION</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((game, i) => (
          <tr key={game.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/games/${game.id}`)}>
            <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(i + 1).padStart(2, "0")}</td>
            <td style={{ color: "var(--fg-strong)", fontWeight: 600 }}>{gameTypeLabels[game.gameType] ?? game.gameType}</td>
            <td>
              {game.creatorUsername ? (
                <>
                  <div className="bk-cell-user-name">{game.creatorUsername}</div>
                  <div className="bk-cell-user-mail">{game.creatorEmail ?? ""}</div>
                </>
              ) : (
                <span style={{ color: "var(--mute-2)" }}>—</span>
              )}
            </td>
            <td>{statusBadge(game.status)}</td>
            <td style={{ color: "var(--fg)" }}>{game.playerCount}</td>
            <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmtDate(game.createdAt)}</td>
            <td style={{ fontSize: "var(--fz-xs)" }}>{fmtDateTime(game.startedAt)}</td>
            <td style={{ fontSize: "var(--fz-xs)" }}>{fmtDateTime(game.endedAt)}</td>
            <td className="bk-td-right" style={{ color: "var(--fg)", fontSize: "var(--fz-xs)" }}>{fmtDur(game.durationSeconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
    </>
  );
}
