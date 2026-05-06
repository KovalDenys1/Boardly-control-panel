import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const revalidate = 30

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDays() {
  const days: { key: string; label: string }[] = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const wd  = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const mon = d.toLocaleDateString('en-GB', { month: 'short' });
    days.push({ key, label: `${wd} ${day} ${mon}` });
  }
  return days;
}

async function getStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers, registeredUsers, suspendedUsers,
    activeGames, totalGames, gamesByType,
    recentGames, recentUsers,
  ] = await Promise.all([
    prisma.users.count({ where: { isGuest: false } }),
    prisma.users.count({ where: { isGuest: false, suspended: false } }),
    prisma.users.count({ where: { suspended: true } }),
    prisma.games.count({ where: { status: 'playing' } }),
    prisma.games.count(),
    prisma.games.groupBy({ by: ['gameType'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.games.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
    prisma.users.findMany({ where: { isGuest: false, createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
  ]);

  const gamesByDay: Record<string, number> = {};
  for (const g of recentGames) gamesByDay[dayKey(g.createdAt)] = (gamesByDay[dayKey(g.createdAt)] ?? 0) + 1;

  const usersByDay: Record<string, number> = {};
  for (const u of recentUsers) usersByDay[dayKey(u.createdAt)] = (usersByDay[dayKey(u.createdAt)] ?? 0) + 1;

  return { totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType, gamesByDay, usersByDay };
}

const gameTypeLabels: Record<string, string> = {
  yahtzee: 'Yahtzee',
  tic_tac_toe: 'Tic-Tac-Toe',
  rock_paper_scissors: 'Rock Paper Scissors',
  guess_the_spy: 'Guess the Spy',
  memory: 'Memory',
  telephone_doodle: 'Telephone Doodle',
  sketch_and_guess: 'Sketch & Guess',
  liars_party: 'Liars Party',
  fake_artist: 'Fake Artist',
  other: 'Other',
}

function AsciiBar({ pct }: { pct: number }) {
  const width = 28
  const filled = Math.round((pct / 100) * width)
  return (
    <span className="bk-gtbar-ascii">
      {'█'.repeat(filled)}
      <span style={{ color: 'var(--mute-2)' }}>{'░'.repeat(width - filled)}</span>
    </span>
  )
}

export default async function DashboardPage() {
  const { totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType, gamesByDay, usersByDay } =
    await getStats()

  const days = buildDays()
  const maxGames = Math.max(...days.map((d) => gamesByDay[d.key] ?? 0), 1)
  const maxUsers = Math.max(...days.map((d) => usersByDay[d.key] ?? 0), 1)
  const todayKey = dayKey(new Date())
  const gamesTotal7d = days.reduce((s, d) => s + (gamesByDay[d.key] ?? 0), 0)
  const usersTotal7d = days.reduce((s, d) => s + (usersByDay[d.key] ?? 0), 0)

  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">cat ./status.log</div>
        <div className="bk-page-title-row">
          <div>
            <h1 className="bk-page-title">
              dashboard<span className="bk-stat-cursor">▊</span>
            </h1>
            <p className="bk-page-sub">// live platform metrics — refreshes on load</p>
          </div>
        </div>
      </div>

      <div className="bk-stats-grid">
        {/* Registered Users */}
        <Link href="/users" className="bk-stat">
          <span className="bk-stat-corner bk-stat-corner--tl">┌</span>
          <span className="bk-stat-corner bk-stat-corner--tr">┐</span>
          <span className="bk-stat-corner bk-stat-corner--bl">└</span>
          <span className="bk-stat-corner bk-stat-corner--br">┘</span>
          <div className="bk-stat-top">
            <span className="bk-stat-code">stat.01</span>
            <span className="bk-stat-label">REGISTERED USERS</span>
          </div>
          <div className="bk-stat-value">{totalUsers.toLocaleString()}</div>
          <div className="bk-stat-sub">{registeredUsers.toLocaleString()} active accounts</div>
        </Link>

        {/* Suspended */}
        <Link href="/users" className={`bk-stat ${suspendedUsers > 0 ? 'bk-stat--bad' : ''}`}>
          <span className="bk-stat-corner bk-stat-corner--tl">┌</span>
          <span className="bk-stat-corner bk-stat-corner--tr">┐</span>
          <span className="bk-stat-corner bk-stat-corner--bl">└</span>
          <span className="bk-stat-corner bk-stat-corner--br">┘</span>
          <div className="bk-stat-top">
            <span className="bk-stat-code">stat.02</span>
            <span className="bk-stat-label">SUSPENDED ACCOUNTS</span>
            {suspendedUsers > 0 && (
              <span className="bk-stat-alert">
                <span className="bk-brk bk-brk--bad">
                  <span className="bk-brk-l">[</span>ACTION NEEDED
                  <span className="bk-brk-r">]</span>
                </span>
              </span>
            )}
          </div>
          <div className="bk-stat-value">{suspendedUsers}</div>
          <div className="bk-stat-sub">require administrator review</div>
        </Link>

        {/* Active Games */}
        <Link href="/games" className="bk-stat bk-stat--ok">
          <span className="bk-stat-corner bk-stat-corner--tl">┌</span>
          <span className="bk-stat-corner bk-stat-corner--tr">┐</span>
          <span className="bk-stat-corner bk-stat-corner--bl">└</span>
          <span className="bk-stat-corner bk-stat-corner--br">┘</span>
          <div className="bk-stat-top">
            <span className="bk-stat-code">stat.03</span>
            <span className="bk-stat-label">ACTIVE GAMES</span>
          </div>
          <div className="bk-stat-value">{activeGames}</div>
          <div className="bk-stat-sub">currently in progress</div>
        </Link>

        {/* Total Games */}
        <Link href="/games" className="bk-stat">
          <span className="bk-stat-corner bk-stat-corner--tl">┌</span>
          <span className="bk-stat-corner bk-stat-corner--tr">┐</span>
          <span className="bk-stat-corner bk-stat-corner--bl">└</span>
          <span className="bk-stat-corner bk-stat-corner--br">┘</span>
          <div className="bk-stat-top">
            <span className="bk-stat-code">stat.04</span>
            <span className="bk-stat-label">TOTAL GAMES</span>
          </div>
          <div className="bk-stat-value">{totalGames.toLocaleString()}</div>
          <div className="bk-stat-sub">all time across all types</div>
        </Link>
      </div>

      {/* 7-day activity */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">activity_7d</span>
          <span className="bk-section-fill" style={{ color: 'var(--mute-2)' }}>{'─'.repeat(60)}</span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          <div className="bk-act-wrap">
          <div className="bk-act-head">
            <span style={{ color: 'var(--mute)' }}>DATE</span>
            <span style={{ color: 'var(--mute)' }}>
              <span style={{ color: 'var(--accent)', marginRight: 4 }}>█</span>GAMES
            </span>
            <span style={{ color: 'var(--accent)', textAlign: 'right' }}>CNT</span>
            <span style={{ color: 'var(--line-2)' }}>│</span>
            <span style={{ color: 'var(--mute)' }}>
              <span style={{ color: 'var(--mute-2)', marginRight: 4 }}>█</span>NEW USERS
            </span>
            <span style={{ color: 'var(--mute)', textAlign: 'right' }}>CNT</span>
          </div>
          {days.map((d) => {
            const gc = gamesByDay[d.key] ?? 0;
            const uc = usersByDay[d.key] ?? 0;
            const BAR = 24;
            const gFill = maxGames > 0 ? Math.round((gc / maxGames) * BAR) : 0;
            const uFill = maxUsers > 0 ? Math.round((uc / maxUsers) * BAR) : 0;
            const isToday = d.key === todayKey;
            return (
              <div key={d.key} className={`bk-act-row${isToday ? ' bk-act-row--today' : ''}`}>
                <span className="bk-act-date">
                  {isToday && <span style={{ color: 'var(--accent)', marginRight: 4 }}>▶</span>}
                  {d.label}
                </span>
                <span className="bk-act-bar">
                  <span style={{ color: 'var(--accent)', letterSpacing: '-0.5px' }}>{'█'.repeat(gFill)}</span>
                  <span style={{ color: 'var(--mute-2)', letterSpacing: '-0.5px' }}>{'░'.repeat(BAR - gFill)}</span>
                </span>
                <span className="bk-act-cnt" style={{ color: gc > 0 ? 'var(--accent)' : 'var(--mute-2)' }}>
                  {gc}
                </span>
                <span style={{ color: 'var(--line-2)', textAlign: 'center' }}>│</span>
                <span className="bk-act-bar">
                  <span style={{ color: 'var(--mute)', letterSpacing: '-0.5px' }}>{'█'.repeat(uFill)}</span>
                  <span style={{ color: 'var(--mute-2)', letterSpacing: '-0.5px' }}>{'░'.repeat(BAR - uFill)}</span>
                </span>
                <span className="bk-act-cnt" style={{ color: uc > 0 ? 'var(--fg)' : 'var(--mute-2)' }}>
                  {uc}
                </span>
              </div>
            );
          })}
          <div className="bk-act-foot">
            <span style={{ color: 'var(--mute)' }}>7d total</span>
            <span />
            <span style={{ color: 'var(--accent)', fontWeight: 600, textAlign: 'right' }}>{gamesTotal7d}</span>
            <span style={{ color: 'var(--line-2)', textAlign: 'center' }}>│</span>
            <span />
            <span style={{ color: 'var(--fg)', fontWeight: 600, textAlign: 'right' }}>{usersTotal7d}</span>
          </div>
          </div>
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: 'var(--mute-2)' }}>{'─'.repeat(80)}</span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>

      {/* Games by type */}
      <div className="bk-section">
        <div className="bk-section-head">
          <span className="bk-section-bracket">┌─</span>
          <span className="bk-section-title">games_by_type</span>
          <span className="bk-section-fill" style={{ color: 'var(--mute-2)' }}>
            {'─'.repeat(60)}
          </span>
          <span className="bk-section-bracket">─┐</span>
        </div>
        <div className="bk-section-body">
          <div className="bk-act-wrap">
          <div className="bk-gtbar bk-gtbar--head">
            <span style={{ color: 'var(--mute)' }}>GAME TYPE</span>
            <span style={{ color: 'var(--mute)' }}>DISTRIBUTION</span>
            <span style={{ color: 'var(--mute)', textAlign: 'right' }}>COUNT · PCT</span>
          </div>
          {gamesByType.map((g) => {
            const pct = totalGames > 0 ? Math.round((g._count.id / totalGames) * 100) : 0
            return (
              <div key={g.gameType} className="bk-gtbar">
                <span className="bk-gtbar-name">
                  {(gameTypeLabels[g.gameType] ?? g.gameType).padEnd(20)}
                </span>
                <div className="bk-gtbar-track">
                  <AsciiBar pct={pct} />
                </div>
                <span className="bk-gtbar-meta" style={{ color: 'var(--mute)' }}>
                  <span style={{ color: 'var(--fg)' }}>{g._count.id.toLocaleString()}</span>
                  {' · '}
                  <span style={{ color: 'var(--accent)' }}>{pct}%</span>
                </span>
              </div>
            )
          })}
          {gamesByType.length === 0 && <div className="bk-empty">no game data available</div>}
          </div>
        </div>
        <div className="bk-section-foot">
          <span className="bk-section-bracket">└</span>
          <span className="bk-section-fill" style={{ color: 'var(--mute-2)' }}>
            {'─'.repeat(80)}
          </span>
          <span className="bk-section-bracket">┘</span>
        </div>
      </div>
    </div>
  )
}
