export default function HelpPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Hjelp</h1>
        <p className="text-zinc-500 text-sm mt-1">Dokumentasjon for administratorer</p>
      </div>

      <div className="space-y-6">
        <Section title="Innlogging og utlogging">
          <p>
            Logg inn med e-postadressen og passordet som er registrert for administratorkontoen din.
            Kun brukere med administratorrolle kan logge inn her.
          </p>
          <p className="mt-2">
            For å logge ut, klikk på <strong className="text-zinc-300">Sign out</strong> nederst i venstremenyen.
            Sesjonen avsluttes umiddelbart og du sendes tilbake til innloggingssiden.
          </p>
        </Section>

        <Section title="Dashboard — hva tallene betyr">
          <ul className="space-y-2">
            <Item label="Registered Users">Antall registrerte brukere på plattformen (gjester ikke inkludert).</Item>
            <Item label="Suspended Accounts">Antall kontoer som er midlertidig sperret. Høyere enn 0 krever oppmerksomhet.</Item>
            <Item label="Active Games">Spill som pågår akkurat nå — spillere er inne i et aktivt spill.</Item>
            <Item label="Total Games">Alle spill som noen gang er opprettet på plattformen.</Item>
          </ul>
          <p className="mt-3">
            Tallene er hentet direkte fra databasen og er alltid oppdaterte. Klikk på et kort for å gå til den aktuelle seksjonen.
          </p>
        </Section>

        <Section title="Brukeradministrasjon">
          <p>
            Under <strong className="text-zinc-300">Users</strong> ser du alle registrerte brukere.
            Du kan suspendere en konto hvis brukeren bryter reglene — kontoen vil ikke lenger kunne brukes til å spille.
          </p>
          <div className="mt-3 space-y-2">
            <Step n={1}>Gå til <strong className="text-zinc-300">Users</strong> i menyen til venstre.</Step>
            <Step n={2}>Finn brukeren du vil suspendere i tabellen.</Step>
            <Step n={3}>Klikk på <span className="text-red-400">Suspend</span>-knappen til høyre for brukeren.</Step>
            <Step n={4}>Statusen endres umiddelbart til <span className="text-red-400">suspended</span>.</Step>
          </div>
          <p className="mt-3">
            For å gjenopprette en konto, klikk <strong className="text-zinc-300">Unsuspend</strong> på den samme brukeren.
            Alle handlinger logges automatisk — hvem som gjorde hva og når.
          </p>
          <p className="mt-2 text-zinc-500 text-sm">
            Administratorkontoer kan ikke suspenderes fra grensesnittet.
          </p>
        </Section>

        <Section title="Spillstatuser">
          <ul className="space-y-2">
            <Item label="playing" color="green">Spillet pågår akkurat nå.</Item>
            <Item label="waiting" color="zinc">Lobbyen er opprettet, men spillet har ikke startet.</Item>
            <Item label="finished" color="zinc">Spillet er fullført og avsluttet normalt.</Item>
            <Item label="abandoned" color="red">Spillet ble forlatt — spillerne forlot lobbyen uten å fullføre.</Item>
            <Item label="cancelled" color="zinc">Spillet ble avbrutt før det startet.</Item>
          </ul>
        </Section>

        <Section title="Kontakt og support">
          <p>
            Har du spørsmål eller oppdager et problem? Ta kontakt med utvikleren:{" "}
            <span className="text-zinc-300">kovaldenys993@gmail.com</span>
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-white font-medium mb-3">{title}</h2>
      <div className="text-zinc-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Item({ label, color = "zinc", children }: { label: string; color?: "green" | "red" | "zinc"; children: React.ReactNode }) {
  const badge = {
    green: "bg-green-950 text-green-400 border-green-900",
    red: "bg-red-950 text-red-400 border-red-900",
    zinc: "bg-zinc-800 text-zinc-400 border-zinc-700",
  }[color];
  return (
    <li className="flex items-start gap-2.5">
      <span className={`text-xs border px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${badge}`}>{label}</span>
      <span>{children}</span>
    </li>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}
