"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "dashboard", cmd: "01" },
  { href: "/users",     label: "users",     cmd: "02" },
  { href: "/games",     label: "games",     cmd: "03" },
  { href: "/help",      label: "hjelp",     cmd: "04" },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="bk-sidebar">
      <div>
        <div className="bk-logo">
          <div className="bk-logo-row">
            <span className="bk-logo-prompt">$</span>
            <span className="bk-logo-name">boardly</span>
            <span className="bk-cursor">▊</span>
          </div>
          <div className="bk-logo-sub">// CONTROL.PANEL v2.6</div>
        </div>

        <div className="bk-sb-section">
          <div className="bk-sb-section-label">── NAV ──</div>
          <nav className="bk-nav">
            {links.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`bk-nav-item ${active ? "active" : ""}`}
                >
                  <span className="bk-nav-marker">{active ? "▶" : " "}</span>
                  <span className="bk-nav-cmd">{l.cmd}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="bk-sb-bottom">
        <div className="bk-session">
          <div className="bk-session-row" style={{ color: "var(--mute)", fontSize: "var(--fz-xs)" }}>
            session
          </div>
          <div className="bk-session-row" style={{ color: "var(--fg-strong)", fontSize: "var(--fz-xs)", marginTop: 2 }}>
            {email}
          </div>
        </div>
        <button
          className="bk-signout"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <span className="bk-btn-brk">[</span>
          <span className="bk-signout-label">SIGN.OUT</span>
          <span className="bk-btn-brk">]</span>
        </button>
      </div>
    </aside>
  );
}
