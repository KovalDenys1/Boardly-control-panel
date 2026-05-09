import { prisma } from "@/lib/prisma";
import { MonitorClient } from "@/app/components/MonitorClient";

const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee", tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "Rock Paper Scissors", guess_the_spy: "Guess the Spy",
  memory: "Memory", connect_four: "Connect Four",
  telephone_doodle: "Telephone Doodle", sketch_and_guess: "Sketch & Guess",
  liars_party: "Liars Party", fake_artist: "Fake Artist",
  alias: "Alias", other: "Other",
};

async function getActiveSessions() {
  const sessions = await prisma.games.findMany({
    where: { status: { in: ["playing", "waiting"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, gameType: true, status: true,
      createdAt: true, startedAt: true,
      Players: { where: { Users: { Bots: null } }, select: { id: true } },
      Lobbies: {
        select: {
          code: true, name: true, maxPlayers: true,
          Users: { select: { username: true, email: true } },
        },
      },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    gameType: gameTypeLabels[s.gameType] ?? s.gameType,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    startedAt: s.startedAt?.toISOString() ?? null,
    playerCount: s.Players.length,
    maxPlayers: s.Lobbies?.maxPlayers ?? null,
    lobbyCode: s.Lobbies?.code ?? null,
    lobbyName: s.Lobbies?.name ?? null,
    creatorUsername: s.Lobbies?.Users?.username ?? null,
    creatorEmail: s.Lobbies?.Users?.email ?? null,
  }));
}

export default async function MonitorPage() {
  const sessions = await getActiveSessions();
  const playing = sessions.filter((s) => s.status === "playing").length;
  const waiting = sessions.filter((s) => s.status === "waiting").length;

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">watch ./monitor</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">monitor<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">// live session feed — refreshes every 30s</p>
          </div>
          <div className="bk-pill-row">
            <span className="bk-pill bk-pill--ok">
              <span className="bk-pill-count">{playing}</span>
              <span className="bk-pill-sep">·</span>
              <span>PLAYING</span>
            </span>
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">{waiting}</span>
              <span className="bk-pill-sep">·</span>
              <span>WAITING</span>
            </span>
          </div>
        </div>
      </div>

      <MonitorClient sessions={sessions} />
    </div>
  );
}
