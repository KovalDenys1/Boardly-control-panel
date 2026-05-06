import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getGame(id: string) {
  const game = await prisma.games.findUnique({
    where: { id },
    select: {
      id: true,
      gameType: true,
      status: true,
      createdAt: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      currentTurn: true,
      Lobbies: {
        select: { code: true, name: true },
      },
      Players: {
        where: { Users: { Bots: null } },
        orderBy: { placement: "asc" },
        select: {
          score: true,
          finalScore: true,
          placement: true,
          isWinner: true,
          isReady: true,
          Users: {
            select: {
              id: true,
              username: true,
              email: true,
              isGuest: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return game;
}

const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee",
  tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "Rock Paper Scissors",
  guess_the_spy: "Guess the Spy",
  memory: "Memory",
  telephone_doodle: "Telephone Doodle",
  sketch_and_guess: "Sketch & Guess",
  liars_party: "Liars Party",
  fake_artist: "Fake Artist",
  other: "Other",
};

const statusStyles: Record<string, string> = {
  playing: "bg-green-950 text-green-400 border-green-900",
  waiting: "bg-zinc-800 text-zinc-400 border-zinc-700",
  finished: "bg-zinc-900 text-zinc-500 border-zinc-800",
  abandoned: "bg-red-950 text-red-400 border-red-900",
  cancelled: "bg-zinc-900 text-zinc-600 border-zinc-800",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function placementLabel(n: number | null) {
  if (!n) return "—";
  const suffixes: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
  return `${n}${suffixes[n] ?? "th"}`;
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) notFound();

  const info = [
    { label: "Game type", value: gameTypeLabels[game.gameType] ?? game.gameType },
    { label: "Lobby", value: game.Lobbies ? `${game.Lobbies.name} (${game.Lobbies.code})` : "—" },
    { label: "Created", value: formatDate(game.createdAt) },
    { label: "Started", value: formatDate(game.startedAt) },
    { label: "Ended", value: formatDate(game.endedAt) },
    { label: "Duration", value: formatDuration(game.durationSeconds) },
    { label: "Turns played", value: game.currentTurn > 0 ? String(game.currentTurn) : "—" },
    { label: "Players", value: String(game.Players.length) },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/games" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Back to Games
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {gameTypeLabels[game.gameType] ?? game.gameType}
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">{game.id}</p>
        </div>
        <span className={`text-xs border px-2.5 py-1 rounded-full ml-auto ${statusStyles[game.status] ?? statusStyles.finished}`}>
          {game.status}
        </span>
      </div>

      {/* Game info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Game info</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {info.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-baseline">
              <span className="text-zinc-500 text-sm">{label}</span>
              <span className="text-zinc-200 text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Players */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-300">Players</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Placement</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Player</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Email</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Type</th>
              <th className="text-right text-zinc-500 font-medium px-5 py-3">Score</th>
              <th className="text-right text-zinc-500 font-medium px-5 py-3">Final score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {game.Players.map((player, i) => (
              <tr key={i} className={player.isWinner ? "bg-yellow-950/20" : ""}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300">{placementLabel(player.placement)}</span>
                    {player.isWinner && (
                      <span className="text-xs bg-yellow-950 text-yellow-400 border border-yellow-900 px-1.5 py-0.5 rounded-full">
                        winner
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-white font-medium">
                    {player.Users.username ?? "—"}
                  </span>
                  {player.Users.role === "admin" && (
                    <span className="ml-2 text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded-full">
                      admin
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">
                  {player.Users.isGuest ? (
                    <span className="text-zinc-600 italic">guest</span>
                  ) : (
                    player.Users.email ?? "—"
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {player.Users.isGuest ? (
                    <span className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
                      guest
                    </span>
                  ) : (
                    <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                      registered
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-zinc-400 text-right">
                  {player.score}
                </td>
                <td className="px-5 py-3.5 text-zinc-300 text-right font-medium">
                  {player.finalScore ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {game.Players.length === 0 && (
          <div className="px-5 py-10 text-center text-zinc-600">No players recorded.</div>
        )}
      </div>
    </div>
  );
}
