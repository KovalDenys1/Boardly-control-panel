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
        <span style={{ flex: 1, overflow: "hidden", color: "var(--mute-2)" }}>{fill.repeat(40)}</span>
        <span style={{ color: "var(--mute)" }}>─┐</span>
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
        <div className="bk-breadcrumb">man ./hjelp</div>
        <div>
          <h1 className="bk-page-title">hjelp<span className="bk-stat-cursor">▊</span></h1>
          <p className="bk-page-sub">// administratordokumentasjon — Boardly Control Panel v2.6</p>
        </div>
      </div>

      <div className="bk-help-grid">
        <SectionBox code="man.01" title="Innlogging og utlogging">
          <p>
            Logg inn med e-postadressen og passordet som er registrert for administratorkontoen din.
            Kun brukere med administratorrolle kan logge inn her.
          </p>
          <p>
            For å logge ut, klikk på{" "}
            <span style={{ color: "var(--accent)" }}>[SIGN.OUT]</span>{" "}
            nederst i venstremenyen. Sesjonen avsluttes umiddelbart.
          </p>
        </SectionBox>

        <SectionBox code="man.02" title="Dashboard — hva tallene betyr">
          <ul className="bk-help-ul">
            <li><span style={{ color: "var(--fg-strong)" }}>REGISTERED USERS</span> — registrerte kontoer, gjester ikke inkludert</li>
            <li><span style={{ color: "var(--bad)" }}>SUSPENDED ACCOUNTS</span> — sperrede kontoer som krever oppmerksomhet</li>
            <li><span style={{ color: "var(--accent)" }}>ACTIVE GAMES</span> — spill som pågår akkurat nå</li>
            <li><span style={{ color: "var(--fg-strong)" }}>TOTAL GAMES</span> — alle spill som noen gang er opprettet</li>
          </ul>
          <p>Tallene er hentet direkte fra databasen og er alltid oppdaterte.</p>
        </SectionBox>

        <SectionBox code="man.03" title="Brukeradministrasjon — suspend og gjenopprett">
          <p>
            Under <span style={{ color: "var(--accent)" }}>users</span> ser du alle registrerte brukere.
            Du kan suspendere en konto ved mistanke om regelbrudd.
          </p>
          <ol className="bk-help-ol">
            <li>Gå til <span style={{ color: "var(--accent)" }}>users</span> i venstremenyen</li>
            <li>Finn brukeren i tabellen</li>
            <li>Klikk <span style={{ color: "var(--bad)" }}>[SUSPEND]</span> til høyre for brukeren</li>
            <li>Status endres umiddelbart til <span style={{ color: "var(--bad)" }}>[SUSPENDED]</span></li>
          </ol>
          <p>
            For å gjenopprette en konto, klikk <span style={{ color: "var(--fg-strong)" }}>[UNSUSPEND]</span>.
            Alle handlinger logges automatisk med admin-ID og tidsstempel.
          </p>
          <div className="bk-help-sig">
            note :: administratorkontoer kan ikke suspenderes fra grensesnittet
          </div>
        </SectionBox>

        <SectionBox code="man.04" title="Spillstatuser">
          <ul className="bk-help-ul">
            <li>
              <span className="bk-brk bk-brk--ok"><span className="bk-brk-l">[</span>PLAYING<span className="bk-brk-r">]</span></span>
              {" — "}spillet pågår akkurat nå
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>WAITING<span className="bk-brk-r">]</span></span>
              {" — "}lobbyen er opprettet, men spillet har ikke startet
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>FINISHED<span className="bk-brk-r">]</span></span>
              {" — "}spillet er fullført normalt
            </li>
            <li>
              <span className="bk-brk bk-brk--bad"><span className="bk-brk-l">[</span>ABANDONED<span className="bk-brk-r">]</span></span>
              {" — "}spillere forlot lobbyen uten å fullføre
            </li>
            <li>
              <span className="bk-brk bk-brk--mute"><span className="bk-brk-l">[</span>CANCELLED<span className="bk-brk-r">]</span></span>
              {" — "}spillet ble avbrutt før det startet
            </li>
          </ul>
        </SectionBox>

        <SectionBox code="man.05" title="Kontakt og support">
          <p>
            Oppdager du et problem eller har spørsmål?
            Ta kontakt med utvikleren:
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
