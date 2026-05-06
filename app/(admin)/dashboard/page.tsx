import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType] =
    await Promise.all([
      prisma.users.count({ where: { isGuest: false } }),
      prisma.users.count({ where: { isGuest: false, suspended: false } }),
      prisma.users.count({ where: { suspended: true } }),
      prisma.games.count({ where: { status: "playing" } }),
      prisma.games.count(),
      prisma.games.groupBy({ by: ["gameType"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    ]);

  return { totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType };
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

export default async function DashboardPage() {
  const { totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType } =
    await getStats();

  const stats = [
    { label: "Registered Users", value: totalUsers, sub: `${registeredUsers} active`, href: "/users" },
    { label: "Suspended Accounts", value: suspendedUsers, sub: "require attention", href: "/users", alert: suspendedUsers > 0 },
    { label: "Active Games", value: activeGames, sub: "currently playing", href: "/games" },
    { label: "Total Games", value: totalGames, sub: "all time", href: "/games" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Platform overview — live data</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">
                  {stat.label}
                </div>
                <div className={`text-3xl font-semibold ${stat.alert ? "text-red-400" : "text-white"}`}>
                  {stat.value}
                </div>
                <div className="text-zinc-600 text-xs mt-1">{stat.sub}</div>
              </div>
              {stat.alert && stat.value > 0 && (
                <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-full">
                  action needed
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Games by type</h2>
        <div className="space-y-2">
          {gamesByType.map((g) => {
            const pct = totalGames > 0 ? Math.round((g._count.id / totalGames) * 100) : 0;
            return (
              <div key={g.gameType} className="flex items-center gap-3">
                <div className="w-32 text-xs text-zinc-400 shrink-0">
                  {gameTypeLabels[g.gameType] ?? g.gameType}
                </div>
                <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-zinc-400 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-500 w-8 text-right">{g._count.id}</div>
              </div>
            );
          })}
          {gamesByType.length === 0 && (
            <p className="text-zinc-600 text-sm">No games yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
