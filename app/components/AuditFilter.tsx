"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ACTIONS = ["suspend_user", "unsuspend_user", "force_end_game"] as const;

export function AuditFilter({ total, filteredTotal }: { total: number; filteredTotal: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("action", value);
    params.set("page", "1");
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <div className="bk-filter-bar">
      <div className="bk-select-wrap">
        <span className="bk-select-brk">[</span>
        <select
          className="bk-filter-select"
          value={action}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">all actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <span className="bk-select-brk">]</span>
      </div>
      {action && (
        <Link href="/audit" className="bk-btn bk-btn--neutral" style={{ padding: "4px 10px", fontSize: "var(--fz-xs)" }}>
          <span className="bk-btn-brk">[</span><span>CLEAR</span><span className="bk-btn-brk">]</span>
        </Link>
      )}
      {action && (
        <span style={{ color: "var(--mute)", fontSize: "var(--fz-xs)", alignSelf: "center" }}>
          {filteredTotal} / {total}
        </span>
      )}
    </div>
  );
}
