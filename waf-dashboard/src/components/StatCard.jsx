import { useEffect, useRef, useState } from "react";

const ACCENT = {
  red:    { glow: "#ff3b3b", border: "rgba(255,59,59,0.15)",  bg: "rgba(255,59,59,0.06)",  gradient: "linear-gradient(135deg, rgba(255,59,59,0.15), rgba(255,59,59,0.02))" },
  amber:  { glow: "#ffaa00", border: "rgba(255,170,0,0.15)",  bg: "rgba(255,170,0,0.06)",  gradient: "linear-gradient(135deg, rgba(255,170,0,0.15), rgba(255,170,0,0.02))" },
  cyan:   { glow: "#00d4ff", border: "rgba(0,212,255,0.15)",  bg: "rgba(0,212,255,0.06)",  gradient: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.02))" },
  violet: { glow: "#a855f7", border: "rgba(168,85,247,0.15)", bg: "rgba(168,85,247,0.06)", gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.02))" },
  emerald:{ glow: "#22c55e", border: "rgba(34,197,94,0.15)",  bg: "rgba(34,197,94,0.06)",  gradient: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.02))" },
};

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (typeof value !== "number" || typeof prevRef.current !== "number") {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const start = prevRef.current;
    const end = value;
    const diff = end - start;
    if (diff === 0) return;

    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevRef.current = value;
  }, [value]);

  return <>{display ?? "—"}</>;
}

export default function StatCard({ label, value, icon, color = "cyan", delta, index = 0 }) {
  const c = ACCENT[color] || ACCENT.cyan;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: c.gradient,
        backdropFilter: "blur(12px)",
        border: `1px solid ${isHovered ? c.glow + "33" : c.border}`,
        borderRadius: "var(--radius-lg)",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: isHovered ? `0 0 30px ${c.glow}18, 0 8px 32px rgba(0,0,0,0.3)` : "0 4px 20px rgba(0,0,0,0.15)",
        animation: `slideUp 0.5s ease both`,
        animationDelay: `${index * 0.08}s`,
        cursor: "default",
      }}
    >
      {/* Corner glow orb */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 100, height: 100,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${c.glow}20 0%, transparent 70%)`,
        pointerEvents: "none",
        transition: "opacity 0.3s",
        opacity: isHovered ? 1 : 0.5,
      }} />

      {/* Bottom edge line */}
      <div style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%",
        height: 1,
        background: `linear-gradient(90deg, transparent, ${c.glow}44, transparent)`,
        opacity: isHovered ? 1 : 0,
        transition: "opacity 0.3s",
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${c.glow}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          {icon}
        </div>
        {delta !== undefined && delta !== 0 && (
          <span style={{
            fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600,
            color: delta > 0 ? "var(--crimson)" : "var(--emerald)",
            background: delta > 0 ? "var(--crimson-dim)" : "var(--emerald-dim)",
            padding: "3px 9px", borderRadius: 99,
          }}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
          </span>
        )}
      </div>

      <div style={{
        fontSize: typeof value === "number" ? 34 : 18,
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        color: c.glow,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : (value ?? "—")}
      </div>

      <div style={{
        fontSize: 11, color: "var(--text-secondary)",
        letterSpacing: "0.1em", textTransform: "uppercase",
        fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}
