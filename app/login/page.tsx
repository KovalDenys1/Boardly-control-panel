"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const ASCII = `
 ██████╗  ██████╗  █████╗ ██████╗ ██╗  ██╗   ██╗
 ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██║  ╚██╗ ██╔╝
 ██████╔╝██║   ██║███████║██████╔╝██║   ╚████╔╝
 ██╔══██╗██║   ██║██╔══██║██╔══██╗██║    ╚██╔╝
 ██████╔╝╚██████╔╝██║  ██║██║  ██║███████╗██║
 ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  `.trim();

export default function LoginPage() {
  const router = useRouter();
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form   = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email:    form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("ACCESS DENIED — invalid credentials or insufficient permissions.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="bk-login-root">
      <div className="bk-login-bg" aria-hidden="true" />
      <div className="bk-scanlines" aria-hidden="true" />

      <div className="bk-login-window">
        <div className="bk-login-titlebar">
          <span>boardly@control-panel:~</span>
          <span className="bk-login-titlebar-name">ssh admin@boardly.online</span>
          <span className="bk-login-titlebar-fill" style={{ color: "var(--mute-2)" }}>
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          </span>
        </div>

        <div className="bk-login-body">
          <pre className="bk-ascii">{ASCII}</pre>

          <div className="bk-login-line">
            <span style={{ color: "var(--mute)" }}>system  </span>
            <span style={{ color: "var(--fg)" }}>Boardly Control Panel v1.0</span>
          </div>
          <div className="bk-login-line">
            <span style={{ color: "var(--mute)" }}>access  </span>
            <span style={{ color: "var(--accent)" }}>administrators only</span>
          </div>

          <form className="bk-login-form" onSubmit={handleSubmit}>
            <div className="bk-field">
              <label htmlFor="email" className="bk-field-prompt">email ::</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="bk-input"
                placeholder="admin@boardly.online"
              />
            </div>

            <div className="bk-field">
              <label htmlFor="password" className="bk-field-prompt">passwd ::</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="bk-input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bk-login-err">{error}</div>
            )}

            <div className="bk-login-actions">
              {loading ? (
                <div className="bk-login-loading">
                  AUTHENTICATING<span className="bk-cursor">...</span>
                </div>
              ) : (
                <button type="submit" className="bk-btn bk-btn--accent bk-btn--block">
                  <span className="bk-btn-brk">[</span>
                  <span className="bk-btn-label">AUTHENTICATE</span>
                  <span className="bk-btn-brk">]</span>
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bk-login-footer">
          <span style={{ color: "var(--mute-2)" }}>
            unauthorized access is prohibited and will be logged
          </span>
        </div>
      </div>
    </div>
  );
}
