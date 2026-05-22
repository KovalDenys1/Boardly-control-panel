function SectionBox({
  code, title, fill = "─",
  children,
}: {
  code: string;
  title: string;
  fill?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bk-help-card">
      <div className="bk-help-head">
        <span className="bk-help-code">{code}</span>
        <span className="bk-help-title">{title}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", color: "var(--mute-2)" }}>{fill.repeat(80)}</span>
        <span style={{ color: "var(--mute)", flexShrink: 0 }}>─┐</span>
      </div>
      <div className="bk-help-body">{children}</div>
      <div className="bk-help-head">
        <span style={{ color: "var(--mute)" }}>└</span>
        <span style={{ flex: 1, overflow: "hidden", color: "var(--mute-2)" }}>{fill.repeat(50)}</span>
        <span style={{ color: "var(--mute)" }}>┘</span>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="bk-page">
      <div className="bk-page-head">
        <div className="bk-breadcrumb">man ./help</div>
        <div>
          <h1 className="bk-page-title">help<span className="bk-stat-cursor">▊</span></h1>
          <p className="bk-page-sub">// admin documentation — Boardly Control Panel v1.0</p>
        </div>
      </div>

      <div className="bk-help-grid">
        <SectionBox code="man.01" title="Login and logout">
          <p>
            Sign in with the email address and password registered for your admin account.
            Only users with the <span style={{ color: "var(--accent)" }}>admin</span> role can access this panel.
          </p>
          <p>
            To sign out, click{" "}
            <span style={{ color: "var(--accent)" }}>[SIGN.OUT]</span>{" "}
            at the bottom of the left sidebar. The session ends immediately.
          </p>
        </SectionBox>

        <SectionBox code="man.02" title="Dashboard">
          <ul className="bk-help-ul">
            <li><span style={{ color: "var(--fg-strong)" }}>REGISTERED USERS</span> — registered accounts, guests excluded</li>
            <li><span style={{ color: "var(--bad)" }}>SUSPENDED ACCOUNTS</span> — accounts currently banned</li>
            <li><span style={{ color: "var(--accent)" }}>ACTIVE GAMES</span> — sessions currently in progress or waiting</li>
            <li><span style={{ color: "var(--fg-strong)" }}>TOTAL GAMES</span> — all sessions ever created</li>
          </ul>
          <p>
            Charts show registrations and game activity for the last 7 days, plus a breakdown by game type.
            All figures are fetched live from the database.
          </p>
        </SectionBox>

        <SectionBox code="man.03" title="Tables — navigation, filtering, sorting">
          <p>
            All tables support <span style={{ color: "var(--fg-strong)" }}>server-side filtering and sorting</span> —
            results are fetched across all pages, not just the current one.
          </p>
          <ul className="bk-help-ul">
            <li>Click any <span style={{ color: "var(--accent)" }}>column header</span> to sort by that column. Click again to reverse order.</li>
            <li>Use the <span style={{ color: "var(--fg-strong)" }}>search bar</span> and <span style={{ color: "var(--fg-strong)" }}>dropdowns</span> to filter — press Enter to apply search.</li>
            <li>The count badge <span style={{ color: "var(--accent)" }}>42 / 200</span> shows matching records vs total.</li>
            <li>Click any <span style={{ color: "var(--fg-strong)" }}>row</span> to open the detail page.</li>
          </ul>
          <p>
            Pagination: <span style={{ color: "var(--accent)" }}>[«]</span> first · <span style={{ color: "var(--accent)" }}>[←]</span> prev ·
            type a page number in the <span style={{ color: "var(--accent)" }}>[n/N]</span> badge and press Enter · <span style={{ color: "var(--accent)" }}>[→]</span> next · <span style={{ color: "var(--accent)" }}>[»]</span> last.
          </p>
        </SectionBox>

        <SectionBox code="man.04" title="Users — suspend and restore">
          <p>
            Click any user row to open their detail page with full profile, game history, and moderation controls.
          </p>
          <ol className="bk-help-ol">
            <li>Open a user from the <span style={{ color: "var(--accent)" }}>users</span> table or their detail page</li>
            <li>Click <span style={{ color: "var(--bad)" }}>[SUSPEND]</span> — enter an optional reason and duration</li>
            <li>Status changes immediately to <span style={{ color: "var(--bad)" }}>[SUSPENDED]</span></li>
            <li>To restore, click <span style={{ color: "var(--fg-strong)" }}>[UNSUSPEND]</span></li>
          </ol>
          <ul className="bk-help-ul">
            <li>Suspensions can be permanent or time-limited (1 / 3 / 7 / 30 days)</li>
            <li>Expired bans are lifted automatically on the next page load</li>
          </ul>
          <div className="bk-help-sig">
            note :: admin accounts cannot be suspended from the interface
          </div>
        </SectionBox>

        <SectionBox code="man.05" title="Games — statuses and force-end">
          <ul className="bk-help-ul">
            <li>
              <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>PLAYING<span className="bk-brk-r">]</span></span>
              {" — "}game is actively in progress
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>WAITING<span className="bk-brk-r">]</span></span>
              {" — "}lobby created, waiting for players to join or start
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>FINISHED<span className="bk-brk-r">]</span></span>
              {" — "}game completed normally with a result
            </li>
            <li>
              <span className="bk-brk bk-brk--bad"><span className="bk-brk-l">[</span>ABANDONED<span className="bk-brk-r">]</span></span>
              {" — "}players left before finishing or force-ended by admin
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>CANCELLED<span className="bk-brk-r">]</span></span>
              {" — "}game was cancelled before it started
            </li>
          </ul>
          <p>
            On a game detail page, active sessions (<span style={{ color: "var(--accent)" }}>[PLAYING]</span> or <span style={{ color: "var(--mute)" }}>[WAITING]</span>)
            show a <span style={{ color: "var(--bad)" }}>[FORCE END]</span> button. This marks the session as{" "}
            <span style={{ color: "var(--bad)" }}>ABANDONED</span> immediately and records the action in the audit log.
          </p>
          <div className="bk-help-sig">
            note :: player count on the games table excludes bots
          </div>
        </SectionBox>

        <SectionBox code="man.06" title="Monitor — live game sessions">
          <p>
            The <span style={{ color: "var(--accent)" }}>monitor</span> page shows all currently active game sessions in real time.
            The list auto-refreshes every 30 seconds.
          </p>
          <ul className="bk-help-ul">
            <li>Elapsed time updates live while you are on the page</li>
            <li>Click a session row to open the full game detail page</li>
            <li>Only sessions with status <span style={{ color: "var(--accent)" }}>[PLAYING]</span> or <span style={{ color: "var(--mute)" }}>[WAITING]</span> appear here</li>
          </ul>
        </SectionBox>

        <SectionBox code="man.07" title="Audit log — admin action history">
          <p>
            Every moderation action is recorded automatically in the{" "}
            <span style={{ color: "var(--accent)" }}>audit</span> log with:
          </p>
          <ul className="bk-help-ul">
            <li><span style={{ color: "var(--fg-strong)" }}>action</span> — what was done (e.g. <span style={{ color: "var(--bad)" }}>suspend.user</span>, <span style={{ color: "var(--accent)" }}>unsuspend.user</span>, <span style={{ color: "var(--bad)" }}>force.end.game</span>)</li>
            <li><span style={{ color: "var(--fg-strong)" }}>admin</span> — which admin performed the action</li>
            <li><span style={{ color: "var(--fg-strong)" }}>target</span> — the affected user or resource (clickable)</li>
            <li><span style={{ color: "var(--fg-strong)" }}>details</span> — reason provided at the time of action</li>
            <li><span style={{ color: "var(--fg-strong)" }}>timestamp</span> — exact date and time</li>
          </ul>
          <div className="bk-help-sig">
            note :: audit log entries cannot be edited or deleted
          </div>
        </SectionBox>

        <SectionBox code="man.08" title="Analytics — platform metrics">
          <p>
            The <span style={{ color: "var(--accent)" }}>analytics</span> page shows aggregated product metrics across rolling time windows.
          </p>
          <ul className="bk-help-ul">
            <li><span style={{ color: "var(--fg-strong)" }}>TOTAL USERS</span> — all-time registered (non-guest) accounts</li>
            <li><span style={{ color: "var(--fg-strong)" }}>WEEKLY ACTIVE</span> — users who were active in the last 7 days</li>
            <li><span style={{ color: "var(--fg-strong)" }}>TOTAL GAMES</span> — all sessions across all statuses</li>
            <li><span style={{ color: "var(--fg-strong)" }}>COMPLETION RATE</span> — finished / (finished + abandoned)</li>
          </ul>
          <ul className="bk-help-ul">
            <li>Registrations and games charts cover the last <span style={{ color: "var(--accent)" }}>30 days</span>, one bar per day</li>
            <li>Hourly activity chart covers the last <span style={{ color: "var(--accent)" }}>7 days</span>, bucketed by UTC hour</li>
            <li>Game type stats show all-time finished sessions, sorted by count</li>
            <li>Status distribution shows the stacked breakdown of all sessions ever created</li>
          </ul>
          <div className="bk-help-sig">
            note :: hover any bar or segment for the exact count
          </div>
        </SectionBox>

        <SectionBox code="man.09" title="Feedback — user-submitted reports">
          <p>
            The <span style={{ color: "var(--accent)" }}>feedback</span> page collects all messages submitted by users from the Boardly app.
          </p>
          <ul className="bk-help-ul">
            <li>Click a <span style={{ color: "var(--fg-strong)" }}>type badge</span> at the top to filter by category (bug, feature, praise, etc.)</li>
            <li>Registered users are shown with a link to their profile — click to open</li>
            <li>Anonymous submissions show the contact email if one was provided</li>
            <li>The page URL column shows where in the app the feedback was submitted from</li>
          </ul>
          <div className="bk-help-sig">
            note :: feedback entries are read-only and cannot be deleted from this interface
          </div>
        </SectionBox>

        <SectionBox code="man.10" title="Contact and support">
          <p>
            Found a bug or have a question?
            Reach out to the developer:
          </p>
          <div className="bk-help-sig">
            <span style={{ color: "var(--mute)" }}>email  :: </span>
            <span style={{ color: "var(--fg-strong)" }}>kovaldenys993@gmail.com</span>
            <br />
            <span style={{ color: "var(--mute)" }}>github :: </span>
            <span style={{ color: "var(--accent)" }}>github.com/KovalDenys1</span>
          </div>
        </SectionBox>
      </div>
    </div>
  );
}
