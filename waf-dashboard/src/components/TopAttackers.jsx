import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { getTopAttackers, getAttackerHistory } from "../lib/api";

export default function TopAttackers() {
  const fetcher = useCallback(getTopAttackers, []);
  const { data, loading, error } = usePolling(fetcher, 7000);
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState(null);
  const [histLoading, setHistLoading] = useState(false);

  const max = data?.[0]?.attacks_count ?? 1;

  const handleExpand = async (ip) => {
    if (expanded === ip) {
      setExpanded(null);
      setHistory(null);
      return;
    }
    setExpanded(ip);
    setHistLoading(true);
    try {
      const h = await getAttackerHistory(ip);
      setHistory(h);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  };

  function getThreatLevel(count) {
    if (count >= 20) return { label: "CRITICAL", color: "#ff3b3b", bg: "rgba(255,59,59,0.12)" };
    if (count >= 10) return { label: "HIGH", color: "#ff6b35", bg: "rgba(255,107,53,0.12)" };
    if (count >= 5)  return { label: "MEDIUM", color: "#ffaa00", bg: "rgba(255,170,0,0.12)" };
    return { label: "LOW", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  }

  return (
    <div className="glass-card" style={{
      padding: 24,
      animation: "fadeIn 0.5s ease both",
      animationDelay: "0.45s",
    }}>
      <h3 className="section-title" style={{ margin: "0 0 20px" }}>
        <span style={{ fontSize: 16 }}>🏴‍☠️</span>
        Top Attackers
      </h3>

      {loading && <Skeleton rows={5} />}
      {error && <div style={{ color: "var(--crimson)", fontFamily: "var(--font-mono)", fontSize: 12 }}>⚠ {error}</div>}

      {!loading && !error && (!data || data.length === 0) && (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center", padding: 36 }}>
          No attackers yet
        </div>
      )}

      {!loading && !error && data && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
          {data.slice(0, 10).map((item, i) => {
            const pct = (item.attacks_count / max) * 100;
            const isTop = i === 0;
            const isOpen = expanded === item.ip;
            const threat = getThreatLevel(item.attacks_count);

            return (
              <div key={item.ip} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                {/* Attacker row */}
                <div
                  onClick={() => handleExpand(item.ip)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 6,
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: isOpen
                      ? "rgba(255,255,255,0.04)"
                      : isTop
                        ? "rgba(255,59,59,0.04)"
                        : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isOpen ? "rgba(255,255,255,0.08)" : "transparent"}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = isTop ? "rgba(255,59,59,0.04)" : "rgba(255,255,255,0.02)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: isTop ? "var(--crimson-dim)" : "rgba(255,255,255,0.05)",
                        color: isTop ? "var(--crimson)" : "var(--text-muted)",
                        fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                      }}>{i + 1}</span>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 13,
                        color: isTop ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: isTop ? 600 : 400,
                      }}>
                        {item.ip}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                        fontFamily: "var(--font-mono)",
                        color: threat.color, background: threat.bg,
                        padding: "2px 7px", borderRadius: 4,
                      }}>
                        {threat.label}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                        color: isTop ? "var(--crimson)" : "var(--amber)",
                        background: isTop ? "var(--crimson-dim)" : "var(--amber-dim)",
                        padding: "3px 10px", borderRadius: 6,
                        minWidth: 36, textAlign: "center",
                      }}>
                        {item.attacks_count}
                      </span>
                      <span style={{
                        fontSize: 10, color: "var(--text-muted)",
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}>▼</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: isTop
                        ? "linear-gradient(90deg, #ff3b3b, #ff8800)"
                        : "linear-gradient(90deg, rgba(0,212,255,0.4), rgba(0,212,255,0.15))",
                      borderRadius: 99,
                      transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                    }} />
                  </div>

                  {/* Last seen */}
                  {item.last_seen && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      Last seen: {new Date(item.last_seen).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Expanded history */}
                {isOpen && (
                  <div style={{
                    margin: "4px 0 4px 14px",
                    padding: "12px 14px",
                    borderLeft: "2px solid rgba(0,212,255,0.2)",
                    background: "rgba(0,212,255,0.02)",
                    borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                    animation: "slideUp 0.2s ease both",
                  }}>
                    <div style={{
                      fontSize: 10, color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      marginBottom: 10, fontWeight: 600,
                    }}>
                      Attack History
                    </div>
                    {histLoading && (
                      <div className="skeleton" style={{ height: 60 }} />
                    )}
                    {!histLoading && history && history.length === 0 && (
                      <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                        No history available
                      </div>
                    )}
                    {!histLoading && history && history.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                        {history.slice(0, 10).map((atk, j) => (
                          <div key={atk.id || j} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            fontSize: 11, fontFamily: "var(--font-mono)",
                            padding: "6px 10px",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "var(--radius-sm)",
                          }}>
                            <span style={{ color: "var(--text-muted)", minWidth: 60, fontSize: 10 }}>
                              {atk.timestamp ? new Date(atk.timestamp).toLocaleTimeString() : "—"}
                            </span>
                            <span style={{
                              background: "rgba(255,59,59,0.1)", color: "#ff8888",
                              padding: "1px 7px", borderRadius: 3, fontSize: 10,
                            }}>
                              {atk.attack_type}
                            </span>
                            <span style={{
                              color: "var(--text-muted)", fontSize: 10,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: 120,
                            }}>
                              /{atk.path || ""}
                            </span>
                          </div>
                        ))}
                        {history.length > 10 && (
                          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: 4 }}>
                            +{history.length - 10} more entries
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Skeleton({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 50, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}
