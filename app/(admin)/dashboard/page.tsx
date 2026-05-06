import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getStats() {
  const [totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType] =
    await Promise.all([
      prisma.users.count({ where: { isGuest: false } }),
      prisma.users.count({ where: { isGuest: false, suspended: false } }),
      prisma.users.count({ where: { suspended: true } }),
      prisma.games.count({ where: { status: 'playing' } }),
      prisma.games.count(),
      prisma.games.groupBy({
        by: ['gameType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ])
  return { totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType }
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
  const { totalUsers, registeredUsers, suspendedUsers, activeGames, totalGames, gamesByType } =
    await getStats()

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
