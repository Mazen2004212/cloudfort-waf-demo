import { useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { usePolling } from "../hooks/usePolling";
import { getHourlyStats } from "../lib/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10, 16, 32, 0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(0, 212, 255, 0.2)",
      borderRadius: 10, padding: "12px 18px",
      fontFamily: "var(--font-mono)", fontSize: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{ color: "var(--text-muted)", fontSize: 10, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "var(--cyan)", fontWeight: 700, fontSize: 16 }}>
        {payload[0].value} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>attacks</span>
      </div>
    </div>
  );
};

export default function HourlyTimeline() {
  const fetcher = useCallback(getHourlyStats, []);
  const { data, loading, error } = usePolling(fetcher, 10000);

  const chartData = (data || []).map((d) => ({
    hour: d.hour?.substring(11, 16) || "",
    count: d.count,
  }));

  return (
    <div className="glass-card" style={{
      padding: 24,
      animation: "fadeIn 0.5s ease both",
      animationDelay: "0.3s",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span style={{ fontSize: 16 }}>📈</span>
          Attack Timeline (24h)
        </h3>
        {data && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color: "var(--text-muted)",
          }}>
            {chartData.reduce((s, d) => s + d.count, 0)} total
          </span>
        )}
      </div>

      {loading && <div className="skeleton" style={{ height: 200 }} />}
      {error && <div style={{ color: "var(--crimson)", fontFamily: "var(--font-mono)", fontSize: 12 }}>⚠ {error}</div>}

      {!loading && !error && chartData.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center", padding: 50 }}>
          No hourly data yet
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "var(--font-mono)" }}
              axisLine={false} tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00d4ff"
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{
                r: 5, stroke: "#00d4ff", strokeWidth: 2,
                fill: "var(--bg-base)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
