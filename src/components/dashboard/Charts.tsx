import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import {
  demoMonthlyRevenueExpenses,
  demoMonthlySales,
  demoTopProducts,
  demoWeeklyRevenueExpenses,
  demoWeeklyData,
  demoYearlyRevenueExpenses,
  demoYearlySales,
  formatKES,
} from "@/lib/demo-data";
import type { RevenueExpensePoint, SalesPoint } from "@/context/BusinessDataContext";

export type AnalyticsPeriod = "weekly" | "monthly" | "yearly";

interface TooltipPayloadEntry {
  color?: string;
  name?: string;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;
  return (
    <div className="surface-card-strong p-3 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i: number) => (
        <p key={`${entry.name ?? "metric"}-${i}`} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {formatKES(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
};

export const RevenueChart = () => (
  <RevenueExpensesChart period="monthly" />
);

export const WeeklySalesChart = () => (
  <SalesTrendChart period="weekly" />
);

interface ChartProps {
  period: AnalyticsPeriod;
  dataOverride?: RevenueExpensePoint[] | SalesPoint[];
}

function getRevenueExpensesData(period: AnalyticsPeriod) {
  if (period === "weekly") return demoWeeklyRevenueExpenses;
  if (period === "yearly") return demoYearlyRevenueExpenses;
  return demoMonthlyRevenueExpenses;
}

function getSalesData(period: AnalyticsPeriod) {
  if (period === "weekly") return demoWeeklyData.map((item) => ({ label: item.day, sales: item.sales }));
  if (period === "yearly") return demoYearlySales;
  return demoMonthlySales;
}

function periodLabel(period: AnalyticsPeriod) {
  if (period === "weekly") return "Weekly";
  if (period === "yearly") return "Yearly";
  return "Monthly";
}

export const RevenueExpensesChart = ({ period, dataOverride }: ChartProps) => {
  const data = (dataOverride as RevenueExpensePoint[] | undefined) ?? getRevenueExpensesData(period);
  return (
    <div className="surface-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Revenue vs Expenses</h3>
      <p className="text-sm text-muted-foreground mb-6">{periodLabel(period)} comparison</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" />
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
};

export const SalesTrendChart = ({ period, dataOverride }: ChartProps) => {
  const data = (dataOverride as SalesPoint[] | undefined) ?? getSalesData(period);
  return (
    <div className="surface-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Sales Trend</h3>
      <p className="text-sm text-muted-foreground mb-6">{periodLabel(period)} sales view</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" name="Sales" fill="hsl(152, 55%, 28%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ProductSalesChart = () => {
  const data = demoTopProducts.map((item) => ({
    name: item.name.length > 14 ? `${item.name.slice(0, 14)}...` : item.name,
    sales: item.sales,
  }));

  return (
    <div className="surface-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">Product Sales Performance</h3>
      <p className="text-sm text-muted-foreground mb-6">How products have been selling</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(160, 10%, 45%)" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} stroke="hsl(160, 10%, 45%)" />
            <Tooltip />
            <Bar dataKey="sales" name="Units Sold" fill="hsl(152, 55%, 28%)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
