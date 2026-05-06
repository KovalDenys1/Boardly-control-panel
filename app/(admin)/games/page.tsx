import { prisma } from "@/lib/prisma";

async function getGames() {
  return prisma.games.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      gameType: true,
      status: true,
      createdAt: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      Players: { select: { id: true } },
    },
  });
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

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function GamesPage() {
  const games = await getGames();

  const counts = {
    playing: games.filter((g) => g.status === "playing").length,
    finished: games.filter((g) => g.status === "finished").length,
    abandoned: games.filter((g) => g.status === "abandoned").length,
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Games</h1>
          <p className="text-zinc-500 text-sm mt-1">Last 50 games</p>
        </div>
        <div className="flex gap-3 ml-auto">
          <Pill label="Active" count={counts.playing} color="green" />
          <Pill label="Finished" count={counts.finished} color="zinc" />
          <Pill label="Abandoned" count={counts.abandoned} color="red" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Game</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Status</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Players</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Created</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Started</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Ended</th>
              <th className="text-left text-zinc-500 font-medium px-5 py-3">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-white">{gameTypeLabels[game.gameType] ?? game.gameType}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs border px-2 py-0.5 rounded-full ${statusStyles[game.status] ?? statusStyles.finished}`}>
                    {game.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-zinc-400">{game.Players.length}</td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDate(game.createdAt)}</td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDate(game.startedAt)}</td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDate(game.endedAt)}</td>
                <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatDuration(game.durationSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {games.length === 0 && (
          <div className="px-5 py-12 text-center text-zinc-600">No games found.</div>
        )}
      </div>
    </div>
  );
}

function Pill({ label, count, color }: { label: string; count: number; color: "green" | "red" | "zinc" }) {
  const styles = {
    green: "bg-green-950 text-green-400 border-green-900",
    red: "bg-red-950 text-red-400 border-red-900",
    zinc: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  return (
    <span className={`text-xs border px-2.5 py-1 rounded-full ${styles[color]}`}>
      {count} {label}
    </span>
  );
}
