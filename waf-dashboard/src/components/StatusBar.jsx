import { useState, useEffect } from "react";

export default function StatusBar() {
  const [now, setNow] = useState(new Date());
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        await fetch("http://localhost:8000/waf/stats", { signal: AbortSignal.timeout(3000) });
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  const statusConfig = {
    online:   { color: "var(--emerald)", label: "PROTECTED", bg: "var(--emerald-dim)" },
    offline:  { color: "var(--crimson)", label: "OFFLINE",   bg: "var(--crimson-dim)" },
    checking: { color: "var(--amber)",   label: "CONNECTING", bg: "var(--amber-dim)" },
  };
  const s = statusConfig[status];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* WAF Status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: s.bg,
        border: `1px solid ${s.color}22`,
        borderRadius: "var(--radius-md)",
        padding: "8px 16px",
      }}>
        <span style={{ position: "relative", width: 8, height: 8, display: "inline-block" }}>
          {status === "online" && (
            <span style={{
              position: "absolute", inset: -2, borderRadius: "50%",
              background: s.color, opacity: 0.4,
              animation: "ping 1.5s cubic-bezier(0,0,.2,1) infinite",
            }} />
          )}
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: s.color,
          }} />
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: s.color, letterSpacing: "0.1em", fontWeight: 600,
        }}>
          {s.label}
        </span>
      </div>

      {/* Clock */}
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 12,
        color: "var(--text-muted)",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "var(--radius-md)",
        padding: "8px 16px",
        letterSpacing: "0.06em",
      }}>
        <span style={{ color: "var(--text-secondary)" }}>
          {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>|</span>
        <span style={{ color: "var(--cyan)" }}>
          {now.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
    </div>
  );
}
