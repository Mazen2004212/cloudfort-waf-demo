import { useCallback, useRef } from "react";
import { usePolling } from "../hooks/usePolling";
import { getAttacks, getStats, getBlacklist, getRecentAttacks } from "../lib/api";
import StatCard from "./StatCard";

export default function KPIRow() {
  const fetchAttacks   = useCallback(getAttacks, []);
  const fetchStats     = useCallback(getStats, []);
  const fetchBlacklist = useCallback(getBlacklist, []);
  const fetchRecent    = useCallback(() => getRecentAttacks(60), []);

  const { data: attacks }   = usePolling(fetchAttacks, 5000);
  const { data: stats }     = usePolling(fetchStats, 6000);
  const { data: blacklist } = usePolling(fetchBlacklist, 5000);
  const { data: recent }    = usePolling(fetchRecent, 5000);

  const prevTotal = useRef(0);
  const total = attacks?.length ?? 0;
  const delta = attacks ? total - prevTotal.current : undefined;
  if (attacks) prevTotal.current = total;

  const topType = stats
    ? Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  const banned = blacklist?.blacklisted_ips?.length ?? 0;

  const uniqueIPs = attacks
    ? new Set(attacks.map(a => a.ip)).size
    : undefined;

  const recentCount = recent?.length ?? 0;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: 16,
      marginBottom: 24,
    }}>
      <StatCard label="Total Attacks"    value={total}      icon="⚡"  color="red"     delta={delta} index={0} />
      <StatCard label="Unique Attackers" value={uniqueIPs}  icon="👤"  color="amber"   index={1} />
      <StatCard label="Blacklisted IPs"  value={banned}     icon="🚫"  color="red"     index={2} />
      <StatCard label="Last Hour"        value={recentCount} icon="🕐" color="cyan"    index={3} />
      <StatCard label="Top Threat"       value={topType}    icon="🎯"  color="violet"  index={4} />
    </div>
  );
}
