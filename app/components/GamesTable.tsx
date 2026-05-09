"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

export const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee", tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "Rock Paper Scissors", guess_the_spy: "Guess the Spy",
  memory: "Memory", connect_four: "Connect Four",
  telephone_doodle: "Telephone Doodle", sketch_and_guess: "Sketch & Guess",
  liars_party: "Liars Party", fake_artist: "Fake Artist",
  alias: "Alias", other: "Other",
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

export function GamesTable({
  games,
  total,
  filteredTotal,
  currentSort,
  currentDir,
  pageOffset,
}: {
  games: GameRow[];
  total: number;
  filteredTotal: number;
  currentSort: SortKey | null;
  currentDir: SortDir;
  pageOffset: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeFilter = searchParams.get("type") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";
  const isFiltered = !!(typeFilter || statusFilter || q || currentSort);

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
    router.push(`/games?${params.toString()}`);
  }

  function makeSortUrl(key: SortKey) {
    const newDir = currentSort === key && currentDir === "asc" ? "desc" : "asc";
    return `/games?${buildParams({ sort: key, dir: newDir })}`;
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
        <div className="bk-select-wrap">
          <span className="bk-select-brk">[</span>
          <select
            className="bk-filter-select"
            value={typeFilter}
            onChange={(e) => router.push(`/games?${buildParams({ type: e.target.value })}`)}
          >
            <option value="">all games</option>
            {Object.entries(gameTypeLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <span className="bk-select-brk">]</span>
        </div>
        <div className="bk-select-wrap">
          <span className="bk-select-brk">[</span>
          <select
            className="bk-filter-select"
            value={statusFilter}
            onChange={(e) => router.push(`/games?${buildParams({ status: e.target.value })}`)}
          >
            <option value="">all status</option>
            <option value="playing">playing</option>
            <option value="waiting">waiting</option>
            <option value="finished">finished</option>
            <option value="abandoned">abandoned</option>
            <option value="cancelled">cancelled</option>
          </select>
          <span className="bk-select-brk">]</span>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: "flex" }}>
          <div className="bk-search-bar" style={{ flex: 1 }}>
            <span className="bk-search-prompt">$</span>
            <input
              type="text"
              className="bk-search-input"
              placeholder="search creator..."
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
      </div>
      <div className="bk-table-wrap">
        <table className="bk-table">
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
            {games.length === 0 ? (
              <tr>
                <td colSpan={9} className="bk-empty-cell">// no results</td>
              </tr>
            ) : games.map((game, i) => (
              <tr key={game.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/games/${game.id}`)}>
                <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(pageOffset + i + 1).padStart(2, "0")}</td>
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
