"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type GameRow = {
  id: string;
  gameType: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  playerCount: number;
};

const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee", tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "Rock Paper Scissors", guess_the_spy: "Guess the Spy",
  memory: "Memory", telephone_doodle: "Telephone Doodle",
  sketch_and_guess: "Sketch & Guess", liars_party: "Liars Party",
  fake_artist: "Fake Artist", other: "Other",
};

type SortKey = "gameType" | "status" | "playerCount" | "createdAt" | "startedAt" | "endedAt" | "durationSeconds";
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
    case "gameType":        va = (gameTypeLabels[a.gameType] ?? a.gameType).toLowerCase(); vb = (gameTypeLabels[b.gameType] ?? b.gameType).toLowerCase(); break;
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
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = useMemo(
    () => sortKey ? [...games].sort((a, b) => compare(a, b, sortKey, sortDir)) : games,
    [games, sortKey, sortDir],
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

  return (
    <table className="bk-table">
      <thead>
        <tr>
          <th className="bk-th-num">#</th>
          <Th col="gameType">GAME TYPE</Th>
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
          <tr key={game.id} style={{ cursor: "pointer" }}>
            <td className="bk-td-num" style={{ color: "var(--mute)" }}>{String(i + 1).padStart(2, "0")}</td>
            <td>
              <Link href={`/games/${game.id}`} style={{ color: "var(--fg-strong)", textDecoration: "none", fontWeight: 600, display: "block" }}>
                {gameTypeLabels[game.gameType] ?? game.gameType}
              </Link>
            </td>
            <td><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{statusBadge(game.status)}</Link></td>
            <td style={{ color: "var(--fg)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{game.playerCount}</Link></td>
            <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDate(game.createdAt)}</Link></td>
            <td style={{ fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDateTime(game.startedAt)}</Link></td>
            <td style={{ fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDateTime(game.endedAt)}</Link></td>
            <td className="bk-td-right" style={{ color: "var(--fg)", fontSize: "var(--fz-xs)" }}><Link href={`/games/${game.id}`} style={{ textDecoration: "none", display: "block" }}>{fmtDur(game.durationSeconds)}</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
