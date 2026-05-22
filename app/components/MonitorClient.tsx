"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Session = {
  id: string;
  gameType: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  playerCount: number;
  maxPlayers: number | null;
  lobbyCode: string | null;
  lobbyName: string | null;
  lobbyTheme: string;
  creatorUsername: string | null;
  creatorEmail: string | null;
};

function elapsed(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function MonitorClient({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.refresh();
          return 30;
        }
        return c - 1;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  if (sessions.length === 0) {
    return (
      <div className="bk-table-wrap">
        <div className="bk-empty">no active sessions</div>
        <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
          refreshing in {countdown}s
        </div>
      </div>
    );
  }

  return (
    <div className="bk-table-wrap">
      <table className="bk-table">
        <thead>
          <tr>
            <th className="bk-th-num">#</th>
            <th>STATUS</th>
            <th>GAME TYPE</th>
            <th>LOBBY</th>
            <th>THEME</th>
            <th>CREATOR</th>
            <th>PLAYERS</th>
            <th>ELAPSED</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/games/${s.id}`)}>
              <td className="bk-td-num" style={{ color: "var(--mute)" }}>
                {String(i + 1).padStart(2, "0")}
              </td>
              <td>
                <span className={`bk-brk bk-brk--${s.status === "playing" ? "ok" : "mute"}`}>
                  <span className="bk-brk-l">[</span>
                  {s.status.toUpperCase()}
                  <span className="bk-brk-r">]</span>
                </span>
              </td>
              <td style={{ color: "var(--fg-strong)", fontWeight: 600 }}>{s.gameType}</td>
              <td>
                {s.lobbyCode ? (
                  <>
                    <div style={{ color: "var(--accent)", fontSize: "var(--fz-xs)" }}>{s.lobbyCode}</div>
                    {s.lobbyName && <div className="bk-cell-user-mail">{s.lobbyName}</div>}
                  </>
                ) : (
                  <span style={{ color: "var(--mute-2)" }}>—</span>
                )}
              </td>
              <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>
                {s.lobbyTheme}
              </td>
              <td>
                {s.creatorUsername ? (
                  <>
                    <div className="bk-cell-user-name">{s.creatorUsername}</div>
                    <div className="bk-cell-user-mail">{s.creatorEmail ?? ""}</div>
                  </>
                ) : (
                  <span style={{ color: "var(--mute-2)" }}>—</span>
                )}
              </td>
              <td style={{ color: "var(--fg)", fontSize: "var(--fz-xs)" }}>
                {s.playerCount}{s.maxPlayers ? `/${s.maxPlayers}` : ""}
              </td>
              <td style={{ fontSize: "var(--fz-xs)", color: "var(--accent)", fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
                {elapsed(s.startedAt ?? s.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
        {sessions.length} active session{sessions.length !== 1 ? "s" : ""} · refreshing in {countdown}s
      </div>
    </div>
  );
}
