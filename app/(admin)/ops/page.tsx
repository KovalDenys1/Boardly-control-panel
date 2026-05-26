import { prisma } from "@/lib/prisma";
import { fmt, fmtMs } from "@/lib/fmt";

async function getOpsData() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [openAlerts, allAlerts, eventCounts, latencyEvents, recentEvents] = await Promise.all([
    prisma.operationalAlertStates.findMany({
      where: { isOpen: true },
      orderBy: { lastTriggeredAt: "desc" },
    }),
    prisma.operationalAlertStates.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.operationalEvents.groupBy({
      by: ["eventName", "metricType"],
      _count: { id: true },
      where: { occurredAt: { gte: since24h } },
    }),
    prisma.operationalEvents.findMany({
      where: { metricType: "latency", occurredAt: { gte: since24h } },
      select: { eventName: true, latencyMs: true, targetMs: true, success: true },
    }),
    prisma.operationalEvents.findMany({
      where: { occurredAt: { gte: since24h } },
      orderBy: { occurredAt: "desc" },
      take: 50,
      select: {
        id: true, eventName: true, metricType: true,
        success: true, applied: true, latencyMs: true,
        reason: true, gameType: true, occurredAt: true,
      },
    }),
  ]);

  // Latency summary per event name
  type LatencySummary = { count: number; avgMs: number; sloTarget: number | null; passRate: number };
  const latencyMap: Record<string, LatencySummary> = {};
  for (const e of latencyEvents) {
    const key = e.eventName;
    if (!latencyMap[key]) latencyMap[key] = { count: 0, avgMs: 0, sloTarget: e.targetMs, passRate: 0 };
    const entry = latencyMap[key];
    entry.count++;
    entry.avgMs += e.latencyMs ?? 0;
    if (e.success) entry.passRate++;
  }
  for (const key of Object.keys(latencyMap)) {
    const entry = latencyMap[key];
    entry.avgMs = entry.count > 0 ? Math.round(entry.avgMs / entry.count) : 0;
    entry.passRate = entry.count > 0 ? Math.round((entry.passRate / entry.count) * 100) : 0;
  }

  return { openAlerts, allAlerts, eventCounts, latencyMap, recentEvents };
}

const metricTone: Record<string, string> = {
  alert_signal: "bad",
  latency:      "warn",
  reliability:  "ok",
  flow:         "mute",
};

export default async function OpsPage() {
  const { openAlerts, allAlerts, eventCounts, latencyMap, recentEvents } = await getOpsData();

  const latencyRows = Object.entries(latencyMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">watch ./ops.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">ops<span className="bk-stat-cursor">▊</span></h1>
            <p className="bk-page-sub">// operational events + alert states · last 24h</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {openAlerts.length === 0 ? (
              <span className="bk-brk bk-brk--ok">
                <span className="bk-brk-l">[</span>ALL CLEAR<span className="bk-brk-r">]</span>
              </span>
            ) : (
              <span className="bk-brk bk-brk--bad">
                <span className="bk-brk-l">[</span>{openAlerts.length} OPEN ALERT{openAlerts.length !== 1 ? "S" : ""}<span className="bk-brk-r">]</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert strip */}
      {openAlerts.length > 0 && (
        <div style={{
          border: "1px dashed rgba(255,59,59,0.5)", background: "rgba(255,59,59,0.06)",
          padding: "12px 16px", marginBottom: 20,
        }}>
          <div style={{ color: "var(--bad)", fontSize: "var(--fz-xs)", letterSpacing: "0.06em", marginBottom: 8 }}>
            {"// OPEN ALERTS — requires attention"}
          </div>
          {openAlerts.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px dashed var(--line)" }}>
              <span style={{ color: "var(--bad)", fontFamily: "var(--mono)", fontSize: "var(--fz-xs)" }}>{a.alertKey}</span>
              <div style={{ display: "flex", gap: 16, fontSize: "var(--fz-xs)", color: "var(--mute)" }}>
                <span>triggered: {fmt(a.lastTriggeredAt)}</span>
                {a.lastValue !== null && <span>last val: {a.lastValue}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event counts (last 24h) */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">event_counts_24h</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          {eventCounts.length === 0 ? (
            <div className="bk-empty">no events in the last 24h</div>
          ) : (
            <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>EVENT</th>
                    <th>TYPE</th>
                    <th className="bk-th-right">COUNT (24H)</th>
                  </tr>
                </thead>
                <tbody>
                  {eventCounts
                    .sort((a, b) => b._count.id - a._count.id)
                    .map((e) => (
                    <tr key={e.eventName}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "var(--fz-xs)", color: "var(--fg-strong)" }}>{e.eventName}</td>
                      <td>
                        <span className={`bk-brk bk-brk--${metricTone[e.metricType] ?? "mute"}`}>
                          <span className="bk-brk-l">[</span>{e.metricType}<span className="bk-brk-r">]</span>
                        </span>
                      </td>
                      <td className="bk-td-right" style={{ color: "var(--fg)", fontWeight: 600 }}>{e._count.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>

      {/* Latency table */}
      {latencyRows.length > 0 && (
        <div className="bk-section">
          <div className="bk-section-head">
            <span className="bk-section-bracket">┌─</span>
            <span className="bk-section-title">latency_summary_24h</span>
            <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
            <span className="bk-section-bracket">─┐</span>
          </div>
          <div className="bk-section-body">
            <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>EVENT</th>
                    <th className="bk-th-right">COUNT</th>
                    <th className="bk-th-right">AVG LATENCY</th>
                    <th className="bk-th-right">SLO TARGET</th>
                    <th className="bk-th-right">PASS RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {latencyRows.map(([name, s]) => (
                    <tr key={name}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "var(--fz-xs)", color: "var(--fg-strong)" }}>{name}</td>
                      <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{s.count}</td>
                      <td className="bk-td-right" style={{ color: s.sloTarget !== null && s.avgMs > s.sloTarget ? "var(--bad)" : "var(--ok)", fontSize: "var(--fz-xs)" }}>
                        {fmtMs(s.avgMs)}
                      </td>
                      <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmtMs(s.sloTarget)}</td>
                      <td className="bk-td-right">
                        <span style={{ color: s.passRate >= 95 ? "var(--ok)" : s.passRate >= 80 ? "var(--warn)" : "var(--bad)", fontSize: "var(--fz-xs)" }}>
                          {s.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bk-section-foot">
            <span className="bk-section-bracket">└</span>
            <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
            <span className="bk-section-bracket">┘</span>
          </div>
        </div>
      )}

      {/* Alert states (all) */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">alert_states</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          {allAlerts.length === 0 ? (
            <div className="bk-empty">no alert states recorded</div>
          ) : (
            <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>ALERT KEY</th>
                    <th>STATE</th>
                    <th className="bk-th-right">LAST TRIGGERED</th>
                    <th className="bk-th-right">LAST RESOLVED</th>
                  </tr>
                </thead>
                <tbody>
                  {allAlerts.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "var(--fz-xs)", color: "var(--fg-strong)" }}>{a.alertKey}</td>
                      <td>
                        {a.isOpen ? (
                          <span className="bk-brk bk-brk--bad"><span className="bk-brk-l">[</span>OPEN<span className="bk-brk-r">]</span></span>
                        ) : (
                          <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>RESOLVED<span className="bk-brk-r">]</span></span>
                        )}
                      </td>
                      <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmt(a.lastTriggeredAt)}</td>
                      <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmt(a.lastResolvedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>

      {/* Recent event log */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">recent_events_log</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          {recentEvents.length === 0 ? (
            <div className="bk-empty">no events in the last 24h</div>
          ) : (
            <div className="bk-table-wrap" style={{ marginBottom: 0 }}>
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>TIME</th>
                    <th>EVENT</th>
                    <th>TYPE</th>
                    <th>RESULT</th>
                    <th className="bk-th-right">LATENCY</th>
                    <th>GAME</th>
                    <th>REASON</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e) => {
                    const outcome = e.success === true ? "ok" : e.success === false ? "bad" : e.applied === true ? "ok" : e.applied === false ? "bad" : null;
                    return (
                      <tr key={e.id}>
                        <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", whiteSpace: "nowrap" }}>{fmt(e.occurredAt)}</td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "var(--fz-xs)", color: "var(--fg-strong)" }}>{e.eventName}</td>
                        <td>
                          <span className={`bk-brk bk-brk--${metricTone[e.metricType] ?? "mute"}`} style={{ fontSize: 10 }}>
                            <span className="bk-brk-l">[</span>{e.metricType}<span className="bk-brk-r">]</span>
                          </span>
                        </td>
                        <td>
                          {outcome ? (
                            <span className={`bk-brk bk-brk--${outcome}`} style={{ fontSize: 10 }}>
                              <span className="bk-brk-l">[</span>{outcome === "ok" ? "OK" : "FAIL"}<span className="bk-brk-r">]</span>
                            </span>
                          ) : (
                            <span style={{ color: "var(--mute-2)" }}>—</span>
                          )}
                        </td>
                        <td className="bk-td-right" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{fmtMs(e.latencyMs)}</td>
                        <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>{e.gameType ?? "—"}</td>
                        <td style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.reason ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bk-table-foot" style={{ color: "var(--mute)" }}>
                {recentEvents.length} most recent events · last 24h · socket_reconnect_* events are from the decommissioned Socket.IO era (removed 2026-05-21)
              </div>
            </div>
          )}
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: "var(--mute-2)" }}>{"─".repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>
    </div>
  );
}
