import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { getBlacklist, banIP, unbanIP } from "../lib/api";

export default function BlacklistPanel() {
  const fetcher = useCallback(getBlacklist, []);
  const { data, loading, error, refresh } = usePolling(fetcher, 5000);

  const [banForm, setBanForm] = useState({ ip: "", duration: "3600" });
  const [banning, setBanning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const ips = data?.blacklisted_ips ?? [];

  const handleBan = async (e) => {
    e.preventDefault();
    if (!banForm.ip.trim()) return;
    setBanning(true);
    setFeedback(null);
    try {
      await banIP(banForm.ip.trim(), parseInt(banForm.duration));
      setFeedback({ type: "success", msg: `Banned ${banForm.ip}` });
      setBanForm({ ip: "", duration: "3600" });
      refresh();
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (ip) => {
    try {
      await unbanIP(ip);
      setFeedback({ type: "success", msg: `Unbanned ${ip}` });
      refresh();
    } catch (err) {
      setFeedback({ type: "error", msg: err.message });
    }
  };

  return (
    <div className="glass-card" style={{
      padding: 24,
      borderColor: "rgba(255,59,59,0.1)",
      animation: "fadeIn 0.5s ease both",
      animationDelay: "0.35s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>🚫</span>
        <h3 className="section-title" style={{ margin: 0 }}>
          Blacklisted IPs
        </h3>
        <span style={{
          marginLeft: "auto",
          background: ips.length > 0 ? "var(--crimson-dim)" : "rgba(255,255,255,0.04)",
          color: ips.length > 0 ? "var(--crimson)" : "var(--text-muted)",
          borderRadius: 99, padding: "3px 12px", fontSize: 11,
          fontFamily: "var(--font-mono)", fontWeight: 600,
        }}>
          {loading ? "…" : ips.length}
        </span>
      </div>

      {/* Ban form */}
      <form onSubmit={handleBan} style={{
        display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap",
      }}>
        <input
          className="input"
          placeholder="IP address..."
          value={banForm.ip}
          onChange={e => setBanForm(f => ({ ...f, ip: e.target.value }))}
          style={{ flex: 1, minWidth: 120 }}
        />
        <select
          value={banForm.duration}
          onChange={e => setBanForm(f => ({ ...f, duration: e.target.value }))}
          style={{
            background: "var(--bg-base)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: 12, padding: "6px 10px",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="60">1 min</option>
          <option value="300">5 min</option>
          <option value="3600">1 hour</option>
          <option value="86400">24 hours</option>
        </select>
        <button type="submit" className="btn btn-danger" disabled={banning} style={{ opacity: banning ? 0.5 : 1 }}>
          {banning ? "…" : "Ban"}
        </button>
      </form>

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: "8px 14px", borderRadius: "var(--radius-sm)",
          marginBottom: 14, fontSize: 12, fontFamily: "var(--font-mono)",
          background: feedback.type === "success" ? "var(--emerald-dim)" : "var(--crimson-dim)",
          color: feedback.type === "success" ? "var(--emerald)" : "var(--crimson)",
          border: `1px solid ${feedback.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(255,59,59,0.2)"}`,
          animation: "fadeIn 0.2s ease both",
        }}>
          {feedback.type === "success" ? "✓" : "✕"} {feedback.msg}
        </div>
      )}

      {loading && <Skeleton rows={3} />}
      {error && <div style={{ color: "var(--crimson)", fontFamily: "var(--font-mono)", fontSize: 12 }}>⚠ {error}</div>}

      {!loading && !error && ips.length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
          No IPs currently blacklisted
        </div>
      )}

      {!loading && !error && ips.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
          {ips.map((ip, i) => (
            <div key={ip} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,59,59,0.05)",
              border: "1px solid rgba(255,59,59,0.1)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Pulsing dot */}
                <span style={{ position: "relative", display: "inline-block", width: 8, height: 8 }}>
                  <span style={{
                    position: "absolute", inset: -2,
                    borderRadius: "50%", background: "var(--crimson)", opacity: 0.4,
                    animation: "ping 1.8s cubic-bezier(0,0,.2,1) infinite",
                  }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--crimson)" }} />
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#ff8888" }}>{ip}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 10, color: "rgba(255,59,59,0.6)",
                  fontFamily: "var(--font-mono)",
                  background: "rgba(255,59,59,0.08)",
                  padding: "2px 8px", borderRadius: 4,
                  fontWeight: 600, letterSpacing: "0.05em",
                }}>
                  BANNED
                </span>
                <button
                  onClick={() => handleUnban(ip)}
                  className="btn btn-success"
                  style={{ padding: "3px 10px", fontSize: 10 }}
                >
                  Unban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeleton({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}
