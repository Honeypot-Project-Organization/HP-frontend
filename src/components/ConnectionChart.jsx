import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Empty } from "./States.jsx";

export default function ConnectionChart({ data, showGranted = false, height = 260 }) {
  if (!data || data.length === 0 || data.every((d) => d.connections === 0)) {
    return <Empty>No connections in this range</Empty>;
  }
  return (
    <div style={{ width: "100%", height }} role="img" aria-label="Connection history chart">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="gConn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FF88" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1B3A28" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#6F9A82", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} stroke="#1B3A28" />
          <YAxis allowDecimals={false} tick={{ fill: "#6F9A82", fontSize: 11 }} stroke="#1B3A28" />
          <Tooltip
            contentStyle={{ background: "#07110B", border: "1px solid #00FF88", borderRadius: 0, fontFamily: "monospace" }}
            labelStyle={{ color: "#00FF88" }}
          />
          <Area type="monotone" dataKey="connections" name="Connections" stroke="#00FF88" strokeWidth={2} fill="url(#gConn)" />
          {showGranted && <Area type="monotone" dataKey="granted" name="Logins granted" stroke="#FF4D4D" strokeWidth={2} fill="none" />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
