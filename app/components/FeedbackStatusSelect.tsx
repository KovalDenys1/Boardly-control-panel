"use client";

import { useRef } from "react";

const STATUS_COLOR: Record<string, string> = {
  open:         "var(--mute)",
  acknowledged: "var(--accent)",
  done:         "var(--ok)",
  wont_fix:     "var(--bad)",
};

const STATUSES = ["open", "acknowledged", "done", "wont_fix"] as const;

interface Props {
  id: string;
  currentStatus: string;
  hasUser: boolean;
  action: (formData: FormData) => Promise<void>;
}

export function FeedbackStatusSelect({ id, currentStatus, hasUser, action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="id" value={id} />
      <select
        ref={selectRef}
        name="status"
        defaultValue={currentStatus}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "done" && hasUser) {
            if (!confirm("Mark as done? A thank-you notification will be sent to the user.")) {
              e.target.value = currentStatus;
              return;
            }
          }
          formRef.current?.requestSubmit();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: STATUS_COLOR[currentStatus] ?? "var(--mute)",
          fontWeight: 600,
          fontSize: "var(--fz-xs)",
          letterSpacing: "0.06em",
          fontFamily: "inherit",
          appearance: "none",
          WebkitAppearance: "none",
          outline: "none",
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} style={{ color: "var(--fg)", background: "var(--bg)" }}>
            {s.replace(/_/g, ".")}
          </option>
        ))}
      </select>
      {currentStatus === "done" && hasUser && (
        <span title="Notification sent to user" style={{ marginLeft: 4, color: "var(--ok)" }}>✓</span>
      )}
    </form>
  );
}
