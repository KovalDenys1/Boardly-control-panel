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
            Only users with the admin role can access this panel.
          </p>
          <p>
            To sign out, click{" "}
            <span style={{ color: "var(--accent)" }}>[SIGN.OUT]</span>{" "}
            at the bottom of the left sidebar. The session ends immediately.
          </p>
        </SectionBox>

        <SectionBox code="man.02" title="Dashboard — what the numbers mean">
          <ul className="bk-help-ul">
            <li><span style={{ color: "var(--fg-strong)" }}>REGISTERED USERS</span> — registered accounts, guests not included</li>
            <li><span style={{ color: "var(--bad)" }}>SUSPENDED ACCOUNTS</span> — banned accounts that require attention</li>
            <li><span style={{ color: "var(--accent)" }}>ACTIVE GAMES</span> — game sessions currently in progress</li>
            <li><span style={{ color: "var(--fg-strong)" }}>TOTAL GAMES</span> — all game sessions ever created</li>
          </ul>
          <p>All figures are fetched directly from the database and are always up to date.</p>
        </SectionBox>

        <SectionBox code="man.03" title="User management — suspend and restore">
          <p>
            Under <span style={{ color: "var(--accent)" }}>users</span> you can see all registered accounts.
            You can suspend an account if you suspect a rule violation.
          </p>
          <ol className="bk-help-ol">
            <li>Go to <span style={{ color: "var(--accent)" }}>users</span> in the left sidebar</li>
            <li>Find the user in the table</li>
            <li>Click <span style={{ color: "var(--bad)" }}>[SUSPEND]</span> — enter an optional reason and duration</li>
            <li>Status changes immediately to <span style={{ color: "var(--bad)" }}>[SUSPENDED]</span></li>
          </ol>
          <p>
            To restore an account, click <span style={{ color: "var(--fg-strong)" }}>[UNSUSPEND]</span>.
            All actions are automatically logged with the admin ID and timestamp.
          </p>
          <div className="bk-help-sig">
            note :: admin accounts cannot be suspended from the interface
          </div>
        </SectionBox>

        <SectionBox code="man.04" title="Game statuses">
          <ul className="bk-help-ul">
            <li>
              <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>PLAYING<span className="bk-brk-r">]</span></span>
              {" — "}game is actively in progress
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>WAITING<span className="bk-brk-r">]</span></span>
              {" — "}lobby created, waiting for players to start
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>FINISHED<span className="bk-brk-r">]</span></span>
              {" — "}game completed normally with a result
            </li>
            <li>
              <span className="bk-brk bk-brk--bad"><span className="bk-brk-l">[</span>ABANDONED<span className="bk-brk-r">]</span></span>
              {" — "}players left the lobby before finishing
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>CANCELLED<span className="bk-brk-r">]</span></span>
              {" — "}game was cancelled before it started
            </li>
          </ul>
        </SectionBox>

        <SectionBox code="man.05" title="Contact and support">
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
