import { prisma } from "@/lib/prisma";
import { gameTypeLabels } from "@/lib/game-type-labels";
import { fmtNum, fmtPct, fmtDur } from "@/lib/fmt";

function fmtSec(s: number | null) {
  return fmtDur(s);
}
function dayLabel(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// ---- KPI card ----
function KPI({ code, label, value, sub, tone = "mute" }: {
  code: string; label: string; value: string; sub: string; tone?: string;
}) {
  return (
    <div className={`bk-kpi bk-kpi--${tone}`}>
      <div className="bk-kpi-top">
        <span className="bk-kpi-code">{code}</span>
        <span className="bk-kpi-label">{label}</span>
      </div>
      <div className="bk-kpi-value">
        {value}
        <span className="bk-stat-cursor">_</span>
      </div>
      <div className="bk-kpi-sub">{`> ${sub}`}</div>
      <span className="bk-stat-corner bk-stat-corner--tl">┌</span>
      <span className="bk-stat-corner bk-stat-corner--tr">┐</span>
      <span className="bk-stat-corner bk-stat-corner--bl">└</span>
      <span className="bk-stat-corner bk-stat-corner--br">┘</span>
    </div>
  );
}

// ---- Section frame ----
function SectionFrame({ title, meta, children, foot }: {
  title: string; meta?: string; children: React.ReactNode; foot?: string;
}) {
  return (
    <section className="bk-section">
      <header className="bk-section-head">
        <span className="bk-section-bracket">┌─</span>
        <span className="bk-section-title">{title}</span>
        {meta && <span className="bk-section-meta bk-mute">{meta}</span>}
        <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
        <span className="bk-section-bracket">─┐</span>
      </header>
      <div className="bk-section-body">{children}</div>
      <footer className="bk-section-foot">
        <span className="bk-section-bracket">└</span>
        {foot && <span className="bk-mute">{foot}</span>}
        <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
        <span className="bk-section-bracket">┘</span>
      </footer>
    </section>
  );
}

// ---- Vertical bar chart ----
function VBarChart({ data, getX, getY, xLabel, tone = "ok", height = 180, ticks = 4 }: {
  data: unknown[];
  getX: (d: unknown) => string | number;
  getY: (d: unknown) => number;
  xLabel: (d: unknown, i: number) => string;
  tone?: string;
  height?: number;
  ticks?: number;
}) {
  const max = Math.max(...data.map(getY), 1);
  const niceMax = Math.ceil(max / ticks) * ticks;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round(niceMax * (1 - i / ticks)));

  return (
    <div className="bk-chart-wrap">
    <div className="bk-chart">
      <div className="bk-chart-yaxis" style={{ height }}>
        {tickVals.map((v, i) => (
          <div key={i} className="bk-chart-ytick">
            <span className="bk-chart-ytick-label">{fmtNum(v)}</span>
          </div>
        ))}
      </div>
      <div className="bk-chart-plot" style={{ height }}>
        <div className="bk-chart-grid" aria-hidden="true">
          {tickVals.map((_, i) => <div key={i} className="bk-chart-grid-line" />)}
        </div>
        <div className="bk-chart-bars">
          {data.map((d, i) => {
            const v = getY(d);
            const pct = (v / niceMax) * 100;
            return (
              <div key={i} className={`bk-vbar bk-vbar--${tone}`} title={`${getX(d)}: ${fmtNum(v)}`}>
                <div className="bk-vbar-fill" style={{ height: pct + "%" }}>
                  <span className="bk-vbar-tip">{fmtNum(v)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bk-chart-xaxis">
        <div className="bk-chart-xaxis-spacer" />
        <div className="bk-chart-xaxis-labels">
          {data.map((d, i) => (
            <span key={i} className="bk-chart-xlabel">{xLabel(d, i)}</span>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

// ---- Horizontal bar list ----
function HBarList({ rows, max, tone = "ok" }: {
  rows: { name: string; value: number; aux?: string }[];
  max: number;
  tone?: string;
}) {
  return (
    <div className="bk-hblist">
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        return (
          <div className="bk-hbrow" key={i}>
            <div className="bk-hbrow-name">{r.name}</div>
            <div className="bk-hbrow-track">
              <div className={`bk-hbrow-fill bk-hbrow-fill--${tone}`} style={{ width: pct + "%" }} />
              <span className="bk-hbrow-pct bk-mute">{Math.round(pct)}%</span>
            </div>
            <div className="bk-hbrow-meta">
              <span className="bk-fg">{fmtNum(r.value)}</span>
              {r.aux !== undefined && (
                <>
                  <span className="bk-mute"> · </span>
                  <span className="bk-mute">avg </span>
                  <span className="bk-fg">{r.aux}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Status breakdown ----
function StatusBreakdown({ counts }: {
  counts: Record<string, number>;
}) {
  const order = [
    { key: "finished",  label: "FINISHED",  tone: "ok" },
    { key: "abandoned", label: "ABANDONED", tone: "bad" },
    { key: "cancelled", label: "CANCELLED", tone: "warn" },
    { key: "playing",   label: "PLAYING",   tone: "accent" },
    { key: "waiting",   label: "WAITING",   tone: "mute" },
  ];
  const total = order.reduce((a, o) => a + (counts[o.key] ?? 0), 0);

  return (
    <div className="bk-statusbk">
      <div className="bk-statusbk-bar">
        {order.map((o) => {
          const v = counts[o.key] ?? 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={o.key}
              className={`bk-statusbk-seg bk-statusbk-seg--${o.tone}`}
              style={{ width: pct + "%" }}
              title={`${o.label}: ${fmtNum(v)}`}
            />
          );
        })}
      </div>
      <div className="bk-statusbk-legend">
        {order.map((o) => {
          const v = counts[o.key] ?? 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          return (
            <div key={o.key} className="bk-statusbk-row">
              <span className={`bk-statusbk-swatch bk-statusbk-swatch--${o.tone}`} />
              <span className="bk-statusbk-label">{o.label}</span>
              <span className="bk-statusbk-count bk-fg">{fmtNum(v)}</span>
              <span className="bk-statusbk-pct bk-mute">{fmtPct(pct, 1)}</span>
            </div>
          );
        })}
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
    premiumUsers,
    premiumCancelling,
  ] = await Promise.all([
    prisma.$queryRaw<{ day: string; count: number }[]>`
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Users"
      WHERE "isGuest" = false AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC'), TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ORDER BY DATE("createdAt" AT TIME ZONE 'UTC')
    `,
    prisma.$queryRaw<{ day: string; count: number }[]>`
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Games"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt" AT TIME ZONE 'UTC'), TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ORDER BY DATE("createdAt" AT TIME ZONE 'UTC')
    `,
    prisma.games.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.$queryRaw<{ type: string; count: number; avg_dur: number | null }[]>`
      SELECT "gameType" AS type,
             COUNT(*)::int AS count,
             AVG("durationSeconds")::int AS avg_dur
      FROM "Games"
      WHERE "status" = 'finished'
      GROUP BY "gameType"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<{ hour: number; count: number }[]>`
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
    prisma.users.count({ where: { isGuest: false, premiumUntil: { gt: now } } }),
    prisma.users.count({ where: { isGuest: false, premiumUntil: { gt: now }, premiumCancelAtPeriod: true } }),
  ]);

  return { regsByDay, gamesByDay, statusCounts, typeStats, hourlyGames, totalUsers, activeWeekly, feedbackByType, premiumUsers, premiumCancelling };
}

export default async function AnalyticsPage() {
  const { regsByDay, gamesByDay, statusCounts, typeStats, hourlyGames, totalUsers, activeWeekly, feedbackByType, premiumUsers, premiumCancelling } = await getAnalytics();

  const statusMap: Record<string, number> = {};
  for (const r of statusCounts) statusMap[r.status] = r._count.id;

  const totalGames     = statusCounts.reduce((s, r) => s + r._count.id, 0);
  const finishedCount  = statusMap["finished"]  ?? 0;
  const abandonedCount = statusMap["abandoned"] ?? 0;
  const completionRate = (finishedCount + abandonedCount) > 0
    ? (finishedCount / (finishedCount + abandonedCount)) * 100
    : 0;

  const regsTotal30  = regsByDay.reduce((a, b) => a + Number(b.count), 0);
  const gamesTotal30 = gamesByDay.reduce((a, b) => a + Number(b.count), 0);
  const peakHour     = hourlyGames.length > 0
    ? hourlyGames.reduce((m, h) => Number(h.count) > Number(m.count) ? h : m, hourlyGames[0])
    : null;

  const typeMax = Math.max(...typeStats.map(t => Number(t.count)), 1);
  const fbMax   = Math.max(...feedbackByType.map(t => t._count.id), 1);

  const regsDays  = regsByDay.map(r => ({ day: r.day, count: Number(r.count) }));
  const gamesDays = gamesByDay.map(r => ({ day: r.day, count: Number(r.count) }));
  const hours     = hourlyGames.map(r => ({ hour: Number(r.hour), count: Number(r.count) }));

  return (
    <div className="bk-page">
      <header className="bk-page-head">
        <div className="bk-breadcrumb">cat ./analytics.log</div>
        <div className="bk-page-title-row">
          <h1 className="bk-page-title">Analytics<span className="bk-cursor">▊</span></h1>
          <div className="bk-pill-row">
            <span className="bk-pill bk-pill--ok">
              <span className="bk-pill-count">30d</span>
              <span className="bk-pill-sep">·</span>
              <span className="bk-pill-label">REGISTRATIONS &amp; GAMES</span>
            </span>
            <span className="bk-pill bk-pill--mute">
              <span className="bk-pill-count">7d</span>
              <span className="bk-pill-sep">·</span>
              <span className="bk-pill-label">HOURLY ACTIVITY</span>
            </span>
          </div>
        </div>
        <div className="bk-page-sub">// platform analytics — aggregates over rolling windows</div>
      </header>

      {/* KPI strip */}
      <div className="bk-kpi-grid">
        <KPI
          code="0x01" label="TOTAL USERS"
          value={fmtNum(totalUsers)}
          sub="all-time registered"
          tone="mute"
        />
        <KPI
          code="0x02" label="WEEKLY ACTIVE"
          value={fmtNum(activeWeekly)}
          sub={`${fmtPct(totalUsers > 0 ? activeWeekly / totalUsers * 100 : 0, 1)} of total · 7d`}
          tone="ok"
        />
        <KPI
          code="0x03" label="TOTAL GAMES"
          value={fmtNum(totalGames)}
          sub="all-time finished + ongoing"
          tone="mute"
        />
        <KPI
          code="0x04" label="COMPLETION RATE"
          value={fmtPct(completionRate)}
          sub="finished / (finished + abandoned)"
          tone="ok"
        />
        <KPI
          code="0x05" label="PREMIUM USERS"
          value={fmtNum(premiumUsers)}
          sub={`${fmtPct(totalUsers > 0 ? premiumUsers / totalUsers * 100 : 0, 1)} conversion rate`}
          tone={premiumUsers > 0 ? "warn" : "mute"}
        />
        <KPI
          code="0x06" label="CHURN RISK"
          value={fmtNum(premiumCancelling)}
          sub="cancelling at period end"
          tone={premiumCancelling > 0 ? "bad" : "mute"}
        />
      </div>

      {/* Row 1: registrations + games by day */}
      <div className="bk-an-row bk-an-row--2col">
        <SectionFrame
          title="registrations_by_day.tsv"
          meta={`30d · ${fmtNum(regsTotal30)} new users`}
          foot={`> ${regsDays.length} buckets · 1 day each`}
        >
          {regsDays.length === 0 ? (
            <span className="bk-mute" style={{ fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <VBarChart
              data={regsDays}
              getX={(d) => (d as { day: string }).day}
              getY={(d) => (d as { count: number }).count}
              xLabel={(d, i) => (i % 5 === 0 || i === regsDays.length - 1) ? dayLabel((d as { day: string }).day) : ""}
              tone="ok"
              height={160}
            />
          )}
        </SectionFrame>

        <SectionFrame
          title="games_by_day.tsv"
          meta={`30d · ${fmtNum(gamesTotal30)} games`}
          foot={`> ${gamesDays.length} buckets · 1 day each`}
        >
          {gamesDays.length === 0 ? (
            <span className="bk-mute" style={{ fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <VBarChart
              data={gamesDays}
              getX={(d) => (d as { day: string }).day}
              getY={(d) => (d as { count: number }).count}
              xLabel={(d, i) => (i % 5 === 0 || i === gamesDays.length - 1) ? dayLabel((d as { day: string }).day) : ""}
              tone="accent"
              height={160}
            />
          )}
        </SectionFrame>
      </div>

      {/* Row 2: status breakdown */}
      <SectionFrame
        title="game_status_distribution.tsv"
        meta={`${fmtNum(totalGames)} games`}
        foot="> stacked horizontal bar · hover segments for details"
      >
        <StatusBreakdown counts={statusMap} />
      </SectionFrame>

      {/* Row 3: hourly activity */}
      <SectionFrame
        title="hourly_activity.tsv"
        meta={peakHour ? `7d · peak hour: ${String(peakHour.hour).padStart(2, "0")}:00 (${fmtNum(peakHour.count)})` : "7d"}
        foot="> games created bucketed by hour-of-day, summed across last 7 days"
      >
        {hours.length === 0 ? (
          <span className="bk-mute" style={{ fontSize: "var(--fz-xs)" }}>no data</span>
        ) : (
          <VBarChart
            data={hours}
            getX={(d) => (d as { hour: number }).hour}
            getY={(d) => (d as { count: number }).count}
            xLabel={(d) => ((d as { hour: number }).hour % 3 === 0) ? String((d as { hour: number }).hour).padStart(2, "0") : ""}
            tone="accent"
            height={140}
          />
        )}
      </SectionFrame>

      {/* Row 4: type stats + feedback */}
      <div className="bk-an-row bk-an-row--2col">
        <SectionFrame
          title="games_by_type.tsv"
          meta={`${typeStats.length} types · all-time finished`}
          foot="> count · avg duration of finished games"
        >
          {typeStats.length === 0 ? (
            <span className="bk-mute" style={{ fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <HBarList
              rows={typeStats.map(t => ({
                name: gameTypeLabels[t.type] ?? t.type,
                value: Number(t.count),
                aux: fmtSec(t.avg_dur),
              }))}
              max={typeMax}
              tone="ok"
            />
          )}
        </SectionFrame>

        <SectionFrame
          title="feedback_by_type.tsv"
          meta={`${feedbackByType.reduce((a, b) => a + b._count.id, 0)} reports · all-time`}
          foot="> categories submitted via in-product feedback form"
        >
          {feedbackByType.length === 0 ? (
            <span className="bk-mute" style={{ fontSize: "var(--fz-xs)" }}>no data</span>
          ) : (
            <HBarList
              rows={feedbackByType.map(t => ({ name: t.type, value: t._count.id }))}
              max={fbMax}
              tone="accent"
            />
          )}
        </SectionFrame>
      </div>
    </div>
  );
}
