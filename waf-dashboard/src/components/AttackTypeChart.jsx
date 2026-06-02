import { useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { usePolling } from "../hooks/usePolling";
import { getStats } from "../lib/api";

const COLORS = {
  "SQL Injection":      "#ff3b3b",
  "XSS":                "#ffaa00",
  "Path Traversal":     "#00d4ff",
  "Command Injection":  "#a855f7",
  "SSRF":               "#3b82f6",
  "XXE":                "#f472b6",
  "Log4Shell":          "#ef4444",
};
const DEFAULT_COLOR = "#64748b";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "rgba(10, 16, 32, 0.95)",
      backdropFilter: "blur(12px)",
      border: `1px solid ${d.fill}33`,
      borderRadius: 10, padding: "12px 18px",
      fontFamily: "var(--font-mono)", fontSize: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{ color: d.fill, fontWeight: 700, marginBottom: 2 }}>{d.payload.type}</div>
      <div style={{ color: "var(--text-primary)", fontSize: 14 }}>
        {d.value} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>attacks</span>
      </div>
    </div>
  );
};

export default function AttackTypeChart() {
  const fetcher = useCallback(getStats, []);
  const { data, loading, error } = usePolling(fetcher, 6000);

  const chartData = data
    ? Object.entries(data)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="glass-card" style={{
      padding: 24,
      animation: "fadeIn 0.5s ease both",
      animationDelay: "0.25s",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          Attack Distribution
        </h3>
        {chartData.length > 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color: "var(--text-muted)",
          }}>
            {chartData.length} types
          </span>
        )}
      </div>

      {loading && <div className="skeleton" style={{ height: 220 }} />}
      {error && <div style={{ color: "var(--crimson)", fontFamily: "var(--font-mono)", fontSize: 12 }}>⚠ {error}</div>}
      {!loading && !error && chartData.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center", padding: 50 }}>
          No attacks recorded yet
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%" layout="vertical">
            <XAxis
              type="number"
              tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false} allowDecimals={false}
            />
            <YAxis
              type="category" dataKey="type" width={130}
              tick={{ fill: "#8899aa", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((d) => (
                <Cell key={d.type} fill={COLORS[d.type] ?? DEFAULT_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
