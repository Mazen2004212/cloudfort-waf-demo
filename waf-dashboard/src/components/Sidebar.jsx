import { useState } from "react";

const NAV_ITEMS = [
  { id: "dashboard",  icon: "📊", label: "Dashboard" },
  { id: "attacks",    icon: "⚡", label: "Attack Log" },
  { id: "blacklist",  icon: "🚫", label: "Blacklist" },
  { id: "settings",   icon: "⚙️", label: "Settings" },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [hovered, setHovered] = useState(null);

  return (
    <aside style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "var(--sidebar-width)",
      height: "100vh",
      background: "rgba(6, 10, 20, 0.95)",
      backdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
      transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
    }}>
      {/* ── Brand ────────────────────────────────────────── */}
      <div style={{
        padding: "28px 24px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/cloudfort-logo.jpg" alt="CloudFort Logo" style={{
            width: 42, height: 42, borderRadius: 12,
            objectFit: "cover",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
          }} />
          <div>
            <div style={{
              fontSize: 17, fontWeight: 800,
              fontFamily: "var(--font-mono)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}>
              Cloud<span style={{ color: "var(--cyan)" }}>Fort</span>
            </div>
            <div style={{
              fontSize: 9, color: "var(--text-muted)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginTop: 2,
            }}>
              Web Application Firewall
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const isHover = hovered === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(0, 212, 255, 0.04))"
                  : isHover
                    ? "rgba(255, 255, 255, 0.04)"
                    : "transparent",
                borderLeft: isActive ? "3px solid var(--cyan)" : "3px solid transparent",
                transition: "all 0.2s ease",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Active glow */}
              {isActive && (
                <div style={{
                  position: "absolute", left: 0, top: "50%",
                  transform: "translateY(-50%)",
                  width: 60, height: 60,
                  background: "radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
              )}
              <span style={{ fontSize: 18, position: "relative", zIndex: 1 }}>{item.icon}</span>
              <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────── */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          background: "rgba(255, 255, 255, 0.02)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--cyan), var(--violet))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Admin</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>CloudFort v2.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
