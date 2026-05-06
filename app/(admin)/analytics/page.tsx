import { prisma } from "@/lib/prisma";

const gameTypeLabels: Record<string, string> = {
  yahtzee: "Yahtzee", tic_tac_toe: "Tic-Tac-Toe",
  rock_paper_scissors: "RPS", guess_the_spy: "Guess Spy",
  memory: "Memory", telephone_doodle: "Tel. Doodle",
  sketch_and_guess: "Sketch", liars_party: "Liars",
  fake_artist: "Fake Artist", other: "Other",
};

function pct(val: number, total: number) {
  return total === 0 ? 0 : Math.round((val / total) * 100);
}

type BarRow = { label: string; value: number; max: number; color?: string; suffix?: string };

function BarChart({ rows, color = "var(--accent)" }: { rows: BarRow[]; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map(({ label, value, max, color: rowColor, suffix }) => {
        const width = max === 0 ? 0 : Math.max(1, Math.round((value / max) * 100));
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 96, flexShrink: 0, color: "var(--mute)", fontSize: "var(--fz-xs)", textAlign: "right", fontFamily: "var(--mono)" }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 10, background: "var(--line)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${width}%`, background: rowColor ?? color, transition: "width 0.2s" }} />
            </div>
            <span style={{ width: 52, flexShrink: 0, color: "var(--fg-strong)", fontSize: "var(--fz-xs)", fontFamily: "var(--mono)", fontWeight: 600 }}>
              {value}{suffix ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SectionBox({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bk-section">
      <div className="bk-section-head">
        <span className="bk-section-bracket">┌─</span>
        <span className="bk-section-title">{title}</span>
        {sub && <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", marginLeft: 8 }}>{sub}</span>}
        <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
        <span className="bk-section-bracket">─┐</span>
      </div>
      <div className="bk-section-body">{children}</div>
      <div className="bk-section-foot">
        <span className="bk-section-bracket">└</span>
        <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
        <span className="bk-section-bracket">┘</span>
      </div>
    </div>
  );
}

async function getAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

  const [
    regsByDay,
    gamesByDay,
    statusCounts,
    typeStats,
    hourlyGames,
    totalUsers,
    activeWeekly,
    feedbackByType,
  ] = await Promise.all([
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Mon DD') AS day,
             COUNT(*)::int AS count
      FROM "Users"
      WHERE "isGuest" = false AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC'), TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Mon DD')
      ORDER BY DATE("createdAt" AT TIME ZONE 'UTC')
    `,
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Mon DD') AS day,
             COUNT(*)::int AS count
      FROM "Games"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC'), TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Mon DD')
      ORDER BY DATE("createdAt" AT TIME ZONE 'UTC')
    `,
    prisma.games.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.$queryRaw<{ type: string; count: bigint; avg_dur: number | null }[]>`
      SELECT "gameType" AS type,
             COUNT(*)::int AS count,
             AVG("durationSeconds")::int AS avg_dur
      FROM "Games"
      WHERE "status" = 'finished'
      GROUP BY "gameType"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC')::int AS hour,
             COUNT(*)::int AS count
      FROM "Games"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY hour
      ORDER BY hour
    `,
    prisma.users.count({ where: { isGuest: false } }),
    prisma.users.count({ where: { isGuest: false, lastActiveAt: { gte: sevenDaysAgo } } }),
    prisma.feedback.groupBy({ by: ["type"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
  ]);

  return { regsByDay, gamesByDay, statusCounts, typeStats, hourlyGames, totalUsers, activeWeekly, feedbackByType };
}

export default async function AnalyticsPage() {
  const { regsByDay, gamesByDay, statusCounts, typeStats, hourlyGames, totalUsers, activeWeekly, feedbackByType } = await getAnalytics();

  const totalGames = statusCounts.reduce((s, r) => s + r._count.id, 0);
  const finishedCount  = statusCounts.find(r => r.status === "finished")?._count.id  ?? 0;
  const abandonedCount = statusCounts.find(r => r.status === "abandoned")?._count.id ?? 0;
  const playingCount   = statusCounts.find(r => r.status === "playing")?._count.id   ?? 0;
  const waitingCount   = statusCounts.find(r => r.status === "waiting")?._count.id   ?? 0;
  const completionRate = pct(finishedCount, finishedCount + abandonedCount);

  const maxRegs  = Math.max(...regsByDay.map(r => Number(r.count)), 1);
  const maxGames = Math.max(...gamesByDay.map(r => Number(r.count)), 1);
  const maxType  = Math.max(...typeStats.map(r => Number(r.count)), 1);
  const maxHour  = Math.max(...hourlyGames.map(r => Number(r.count)), 1);
  const maxFeed  = Math.max(...feedbackByType.map(r => r._count.id), 1);

  const fmtDur = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./analytics.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">analytics<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">// product metrics · last 30 days unless noted</p>
          </div>
          <div className="bk-pill-row">
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">{totalUsers}</span>
              <span className="bk-pill-sep">·</span><span>USERS</span>
            </span>
            <span className="bk-pill bk-pill--ok">
              <span className="bk-pill-count">{activeWeekly}</span>
              <span className="bk-pill-sep">·</span><span>WAU</span>
            </span>
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">{totalGames}</span>
              <span className="bk-pill-sep">·</span><span>GAMES</span>
            </span>
            <span className={`bk-pill bk-pill--${completionRate >= 60 ? "ok" : completionRate >= 30 ? "mute" : "bad"}`}>
              <span className="bk-pill-count">{completionRate}%</span>
              <span className="bk-pill-sep">·</span><span>COMPLETION</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 16 }}>

        <SectionBox title="new_registrations" sub="// last 30 days">
          {regsByDay.length === 0 ? (
            <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <BarChart rows={regsByDay.map(r => ({ label: r.day, value: Number(r.count), max: maxRegs }))} />
          )}
        </SectionBox>

        <SectionBox title="games_created" sub="// last 30 days">
          {gamesByDay.length === 0 ? (
            <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <BarChart rows={gamesByDay.map(r => ({ label: r.day, value: Number(r.count), max: maxGames, color: "var(--ok)" }))} color="var(--ok)" />
          )}
        </SectionBox>

        <SectionBox title="game_outcomes" sub={`// ${totalGames} total sessions`}>
          <BarChart rows={[
            { label: "finished",  value: finishedCount,  max: totalGames, color: "var(--accent)" },
            { label: "abandoned", value: abandonedCount, max: totalGames, color: "var(--bad)" },
            { label: "playing",   value: playingCount,   max: totalGames, color: "var(--ok)" },
            { label: "waiting",   value: waitingCount,   max: totalGames, color: "var(--mute)" },
          ]} />
          <div style={{ marginTop: 12, color: "var(--mute)", fontSize: "var(--fz-xs)" }}>
            completion rate (finished / finished+abandoned) ·{" "}
            <span style={{ color: completionRate >= 60 ? "var(--ok)" : completionRate >= 30 ? "var(--accent)" : "var(--bad)", fontWeight: 600 }}>
              {completionRate}%
            </span>
          </div>
        </SectionBox>

        <SectionBox title="activity_by_hour" sub="// last 7 days, UTC">
          {hourlyGames.length === 0 ? (
            <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <BarChart rows={hourlyGames.map(r => ({
              label: `${String(r.hour).padStart(2, "0")}:00`,
              value: Number(r.count),
              max: maxHour,
              color: "var(--accent)",
            }))} />
          )}
        </SectionBox>

        <SectionBox title="popular_game_types" sub="// finished games only">
          {typeStats.length === 0 ? (
            <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <BarChart rows={typeStats.map(r => ({
              label: gameTypeLabels[r.type] ?? r.type,
              value: Number(r.count),
              max: maxType,
              color: "var(--ok)",
            }))} />
          )}
        </SectionBox>

        <SectionBox title="avg_game_duration" sub="// finished games by type">
          {typeStats.filter(r => r.avg_dur).length === 0 ? (
            <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {typeStats.filter(r => r.avg_dur).sort((a, b) => (b.avg_dur ?? 0) - (a.avg_dur ?? 0)).map(r => (
                <div key={r.type} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--line)" }}>
                  <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{gameTypeLabels[r.type] ?? r.type}</span>
                  <span style={{ color: "var(--fg-strong)", fontSize: "var(--fz-xs)", fontFamily: "var(--mono)", fontWeight: 600 }}>{fmtDur(r.avg_dur)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionBox>

        {feedbackByType.length > 0 && (
          <SectionBox title="feedback_by_type" sub="// all time">
            <BarChart rows={feedbackByType.map(r => ({
              label: r.type,
              value: r._count.id,
              max: maxFeed,
              color: r.type === "bug" ? "var(--bad)" : r.type === "praise" ? "var(--ok)" : "var(--accent)",
            }))} />
          </SectionBox>
        )}

      </div>
    </div>
  );
}
