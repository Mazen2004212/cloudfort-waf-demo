import { useState } from "react";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import KPIRow from "./components/KPIRow";
import HourlyTimeline from "./components/HourlyTimeline";
import AttackTypeChart from "./components/AttackTypeChart";
import AttackLog from "./components/AttackLog";
import TopAttackers from "./components/TopAttackers";
import BlacklistPanel from "./components/BlacklistPanel";

const PAGE_TITLES = {
  dashboard: { title: "Dashboard", subtitle: "Real-time threat monitoring & analysis" },
  attacks:   { title: "Attack Log", subtitle: "Detailed attack event history" },
  blacklist: { title: "Blacklist Management", subtitle: "Manage banned IPs & access control" },
  settings:  { title: "Settings", subtitle: "CloudFort configuration & administration" },
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  return (
    <>
      {/* Animated grid background */}
      <div className="grid-bg" />

      <div className="app-layout">
        {/* Sidebar */}
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {/* Main content */}
        <main className="main-content">
          {/* Status bar header */}
          <StatusBarHeader pageInfo={pageInfo} />

          {/* Page content */}
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "attacks" && <AttacksPage />}
          {activePage === "blacklist" && <BlacklistPage />}
          {activePage === "settings" && <SettingsPage />}
        </main>
      </div>
    </>
  );
}

/* ─── Status bar header with dynamic title ────────────────────────────── */
function StatusBarHeader({ pageInfo }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 28, flexWrap: "wrap", gap: 14,
      animation: "fadeIn 0.4s ease both",
    }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
          {pageInfo.title}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
          {pageInfo.subtitle}
        </p>
      </div>
      <StatusBar />
    </div>
  );
}

/* ─── Dashboard Page ──────────────────────────────────────────────────── */
function DashboardPage() {
  return (
    <div style={{ animation: "fadeIn 0.3s ease both" }}>
      {/* KPI Strip */}
      <KPIRow />

      {/* Timeline full width */}
      <div style={{ marginBottom: 16 }}>
        <HourlyTimeline />
      </div>

      {/* Charts row: attack distribution + blacklist */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 16,
        marginBottom: 16,
      }}>
        <AttackTypeChart />
        <BlacklistPanel />
      </div>

      {/* Bottom row: log + top attackers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 16,
      }}>
        <AttackLog />
        <TopAttackers />
      </div>
    </div>
  );
}

/* ─── Attacks Page (full-width log) ───────────────────────────────────── */
function AttacksPage() {
  return (
    <div style={{ animation: "fadeIn 0.3s ease both" }}>
      <AttackLog />
    </div>
  );
}

/* ─── Blacklist Page ──────────────────────────────────────────────────── */
function BlacklistPage() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      animation: "fadeIn 0.3s ease both",
    }}>
      <BlacklistPanel />
      <TopAttackers />
    </div>
  );
}

/* ─── Settings Page ───────────────────────────────────────────────────── */
function SettingsPage() {
  return (
    <div className="glass-card" style={{
      padding: 32,
      animation: "fadeIn 0.3s ease both",
    }}>
      <h3 className="section-title" style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 16 }}>⚙️</span>
        CloudFort Configuration
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <SettingItem
          label="Target Server"
          value="http://localhost:9000"
          description="The upstream server CloudFort proxies traffic to"
        />
        <SettingItem
          label="Rate Limit"
          value="30 req / 10s"
          description="Max requests per IP within the sliding window"
        />
        <SettingItem
          label="Auto-ban Threshold"
          value="3 attacks"
          description="Number of detected attacks before an IP is auto-banned"
        />
        <SettingItem
          label="Detection Threshold"
          value="Score ≥ 3"
          description="Minimum severity score required to block a request"
        />
        <SettingItem
          label="Ban Escalation"
          value="1m → 5m → 1h → 24h"
          description="Progressive ban durations for repeat offenders"
        />
        <SettingItem
          label="Max Body Inspect"
          value="64 KB"
          description="Maximum request body size inspected for attacks"
        />
      </div>

      <div style={{
        marginTop: 28, padding: "16px 20px",
        background: "rgba(0, 212, 255, 0.04)",
        border: "1px solid rgba(0, 212, 255, 0.1)",
        borderRadius: "var(--radius-md)",
        fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)",
      }}>
        <span style={{ color: "var(--cyan)", fontWeight: 600 }}>ℹ INFO</span>
        <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>|</span>
        Configuration is managed via environment variables in the CloudFort backend. Edit <code style={{ color: "var(--cyan)" }}>config.py</code> or set <code style={{ color: "var(--cyan)" }}>WAF_*</code> env vars to change these values.
      </div>
    </div>
  );
}

function SettingItem({ label, value, description }) {
  return (
    <div style={{
      padding: "16px 18px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)",
      borderRadius: "var(--radius-md)",
    }}>
      <div style={{
        fontSize: 10, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: 6, fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 16, fontWeight: 700,
        fontFamily: "var(--font-mono)",
        color: "var(--text-primary)",
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
        {description}
      </div>
    </div>
  );
}
