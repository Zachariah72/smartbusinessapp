import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { demoSalesData, demoWeeklyData, formatKES } from "@/lib/demo-data";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-elevated text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {formatKES(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const RevenueChart = () => (
  <div className="bg-card rounded-xl p-6 shadow-card">
    <h3 className="font-display text-lg font-semibold text-foreground mb-1">Revenue vs Expenses</h3>
    <p className="text-sm text-muted-foreground mb-6">Monthly comparison for 2026</p>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={demoSalesData}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152, 55%, 28%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(152, 55%, 28%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38, 85%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(38, 85%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(152, 55%, 28%)" fill="url(#gradRevenue)" strokeWidth={2} />
          <Area type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(38, 85%, 55%)" fill="url(#gradExpenses)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const WeeklySalesChart = () => (
  <div className="bg-card rounded-xl p-6 shadow-card">
    <h3 className="font-display text-lg font-semibold text-foreground mb-1">This Week's Sales</h3>
    <p className="text-sm text-muted-foreground mb-6">Daily breakdown</p>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={demoWeeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sales" name="Sales" fill="hsl(152, 55%, 28%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
