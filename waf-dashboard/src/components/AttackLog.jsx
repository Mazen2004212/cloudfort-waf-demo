import React, { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { getAttacks } from "../lib/api";

const TYPE_COLORS = {
  "SQL Injection":      { bg: "rgba(255,59,59,0.1)",   text: "#ff3b3b", dot: "#ff3b3b" },
  "XSS":                { bg: "rgba(255,170,0,0.1)",   text: "#ffaa00", dot: "#ffaa00" },
  "Path Traversal":     { bg: "rgba(0,212,255,0.1)",   text: "#00d4ff", dot: "#00d4ff" },
  "Command Injection":  { bg: "rgba(168,85,247,0.1)",  text: "#a855f7", dot: "#a855f7" },
  "SSRF":               { bg: "rgba(59,130,246,0.1)",  text: "#3b82f6", dot: "#3b82f6" },
  "XXE":                { bg: "rgba(244,114,182,0.1)", text: "#f472b6", dot: "#f472b6" },
  "Log4Shell":          { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", dot: "#ef4444" },
};
const DEFAULT_TYPE = { bg: "rgba(255,255,255,0.05)", text: "#8899aa", dot: "#8899aa" };

function getSeverityConfig(score) {
  if (score >= 9)  return { label: "CRITICAL", color: "#ff3b3b", bg: "rgba(255,59,59,0.12)" };
  if (score >= 6)  return { label: "HIGH",     color: "#ff6b35", bg: "rgba(255,107,53,0.12)" };
  if (score >= 3)  return { label: "MEDIUM",   color: "#ffaa00", bg: "rgba(255,170,0,0.12)" };
  return                  { label: "LOW",      color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
}

const PAGE_SIZE = 10;

export default function AttackLog() {
  const fetcher = useCallback(getAttacks, []);
  const { data: attacks, loading, error, refresh } = usePolling(fetcher, 5000);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);

  const types = attacks
    ? ["ALL", ...new Set(attacks.map(a => a.attack_type))]
    : ["ALL"];

  const filtered = attacks
    ? (filter === "ALL" ? attacks : attacks.filter(a => a.attack_type === filter))
    : [];

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page_data = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = (f) => { setFilter(f); setPage(0); };

  return (
    <div className="glass-card" style={{
      padding: 24,
      animation: "fadeIn 0.5s ease both",
      animationDelay: "0.4s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          Attack Log
          {attacks && (
            <span className="count-badge">{filtered.length}</span>
          )}
        </h3>
        <button onClick={refresh} className="btn">
          ↻ Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {types.map(t => {
          const c = TYPE_COLORS[t] ?? DEFAULT_TYPE;
          const active = filter === t;
          return (
            <button key={t} onClick={() => handleFilterChange(t)} style={{
              background: active ? c.bg : "transparent",
              color: active ? c.text : "var(--text-muted)",
              border: `1px solid ${active ? c.dot + "44" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "var(--radius-sm)", padding: "5px 14px", fontSize: 11,
              fontFamily: "var(--font-mono)", cursor: "pointer", letterSpacing: "0.05em",
              transition: "all .2s", fontWeight: active ? 600 : 400,
            }}>
              {t}
            </button>
          );
        })}
      </div>

      {loading && <Skeleton rows={5} />}
      {error && <div style={{ color: "var(--crimson)", fontFamily: "var(--font-mono)", fontSize: 12 }}>⚠ {error}</div>}

      {!loading && !error && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {["ID", "IP Address", "Type", "Severity", "Method", "Path", "Time"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page_data.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 14px", textAlign: "center", color: "var(--text-muted)" }}>
                      No attacks found
                    </td>
                  </tr>
                )}
                {page_data.map((atk, i) => {
                  const c = TYPE_COLORS[atk.attack_type] ?? DEFAULT_TYPE;
                  const sev = getSeverityConfig(atk.severity || 0);
                  const isOpen = expanded === atk.id;
                  return (
                    <React.Fragment key={atk.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : atk.id)}
                        style={{
                          animation: `fadeIn 0.3s ease both`,
                          animationDelay: `${i * 0.03}s`,
                        }}
                      >
                        <td style={{ color: "var(--text-muted)", fontSize: 11 }}>#{atk.id}</td>
                        <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{atk.ip}</td>
                        <td>
                          <span style={{
                            background: c.bg, color: c.text,
                            borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 500,
                          }}>
                            {atk.attack_type}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: sev.bg, color: sev.color,
                            borderRadius: 4, padding: "2px 8px", fontSize: 10,
                            fontWeight: 700, letterSpacing: "0.05em",
                          }}>
                            {sev.label}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "var(--text-secondary)",
                            borderRadius: 4, padding: "2px 8px", fontSize: 10,
                            fontWeight: 600,
                          }}>
                            {atk.method || "—"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          /{atk.path || "—"}
                        </td>
                        <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 11 }}>
                          {atk.timestamp ? new Date(atk.timestamp).toLocaleString() : "—"}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={7} style={{ padding: "0 14px 16px", background: "rgba(255,255,255,0.01)" }}>
                            <div style={{
                              background: "var(--bg-base)",
                              border: `1px solid ${c.dot}22`,
                              borderRadius: "var(--radius-md)",
                              padding: "16px 18px",
                              animation: "slideUp 0.2s ease both",
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px 24px",
                            }}>
                              <div>
                                <span style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Request ID</span>
                                <div style={{ color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-mono)", marginTop: 3 }}>
                                  {atk.request_id || "—"}
                                </div>
                              </div>
                              <div>
                                <span style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Severity Score</span>
                                <div style={{ color: sev.color, fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 3 }}>
                                  {atk.severity ?? 0}
                                </div>
                              </div>
                              <div style={{ gridColumn: "1 / -1" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Payload</span>
                                <div style={{
                                  color: c.text, fontSize: 12, fontFamily: "var(--font-mono)",
                                  marginTop: 6, padding: "10px 14px",
                                  background: `${c.dot}08`, borderRadius: "var(--radius-sm)",
                                  wordBreak: "break-all", lineHeight: 1.7,
                                  maxHeight: 120, overflowY: "auto",
                                  border: `1px solid ${c.dot}15`,
                                }}>
                                  {atk.payload || <span style={{ color: "var(--text-faint)" }}>empty payload</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 }}>
              <button className="btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{ opacity: page === 0 ? 0.3 : 1, cursor: page === 0 ? "default" : "pointer" }}>
                ← Prev
              </button>
              <span style={{
                color: "var(--text-muted)", fontSize: 12,
                fontFamily: "var(--font-mono)", padding: "4px 12px",
              }}>
                {page + 1} / {totalPages}
              </span>
              <button className="btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                style={{ opacity: page >= totalPages - 1 ? 0.3 : 1, cursor: page >= totalPages - 1 ? "default" : "pointer" }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Skeleton({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 42, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}
