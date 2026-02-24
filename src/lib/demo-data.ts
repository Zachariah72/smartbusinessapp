export const demoSalesData = [
  { date: "Jan", sales: 245000, revenue: 320000, expenses: 180000, visitors: 1200, orders: 85 },
  { date: "Feb", sales: 278000, revenue: 350000, expenses: 190000, visitors: 1350, orders: 92 },
  { date: "Mar", sales: 312000, revenue: 410000, expenses: 195000, visitors: 1500, orders: 108 },
  { date: "Apr", sales: 295000, revenue: 385000, expenses: 200000, visitors: 1420, orders: 98 },
  { date: "May", sales: 340000, revenue: 445000, expenses: 210000, visitors: 1680, orders: 115 },
  { date: "Jun", sales: 385000, revenue: 490000, expenses: 215000, visitors: 1850, orders: 128 },
  { date: "Jul", sales: 420000, revenue: 540000, expenses: 225000, visitors: 2100, orders: 142 },
  { date: "Aug", sales: 398000, revenue: 510000, expenses: 220000, visitors: 1950, orders: 135 },
  { date: "Sep", sales: 445000, revenue: 580000, expenses: 230000, visitors: 2250, orders: 155 },
  { date: "Oct", sales: 478000, revenue: 620000, expenses: 240000, visitors: 2400, orders: 168 },
  { date: "Nov", sales: 512000, revenue: 670000, expenses: 250000, visitors: 2600, orders: 180 },
  { date: "Dec", sales: 560000, revenue: 720000, expenses: 260000, visitors: 2850, orders: 195 },
];

export const demoWeeklyData = [
  { day: "Mon", sales: 45000, orders: 12 },
  { day: "Tue", sales: 52000, orders: 15 },
  { day: "Wed", sales: 48000, orders: 13 },
  { day: "Thu", sales: 61000, orders: 18 },
  { day: "Fri", sales: 55000, orders: 16 },
  { day: "Sat", sales: 72000, orders: 22 },
  { day: "Sun", sales: 38000, orders: 10 },
];

export const demoWeeklyRevenueExpenses = demoWeeklyData.map((item) => ({
  label: item.day,
  revenue: Math.round(item.sales * 1.18),
  expenses: Math.round(item.sales * 0.62),
}));

export const demoMonthlySales = demoSalesData.map((item) => ({
  label: item.date,
  sales: item.sales,
}));

export const demoMonthlyRevenueExpenses = demoSalesData.map((item) => ({
  label: item.date,
  revenue: item.revenue,
  expenses: item.expenses,
}));

export const demoYearlyRevenueExpenses = [
  { label: "2024", revenue: 4870000, expenses: 2660000 },
  { label: "2025", revenue: 5480000, expenses: 2940000 },
  { label: "2026", revenue: 6040000, expenses: 3220000 },
];

export const demoYearlySales = [
  { label: "2024", sales: 3950000 },
  { label: "2025", sales: 4520000 },
  { label: "2026", sales: 5110000 },
];

export const demoTopProducts = [
  { name: "Premium Coffee Beans", sales: 156, revenue: 234000, trend: 12 },
  { name: "Organic Tea Collection", sales: 132, revenue: 198000, trend: 8 },
  { name: "Fresh Juice Pack", sales: 98, revenue: 147000, trend: -3 },
  { name: "Snack Bundle", sales: 87, revenue: 130500, trend: 15 },
  { name: "Water Bottles (12pk)", sales: 76, revenue: 91200, trend: 5 },
];

export const demoRecentTransactions = [
  { id: "TXN-001", customer: "Amina Wanjiku", amount: 12500, date: "2026-02-21", status: "completed", method: "M-Pesa" },
  { id: "TXN-002", customer: "James Ochieng", amount: 8750, date: "2026-02-21", status: "completed", method: "Card" },
  { id: "TXN-003", customer: "Faith Muthoni", amount: 23000, date: "2026-02-20", status: "pending", method: "M-Pesa" },
  { id: "TXN-004", customer: "Peter Kamau", amount: 5600, date: "2026-02-20", status: "completed", method: "M-Pesa" },
  { id: "TXN-005", customer: "Sarah Njeri", amount: 18900, date: "2026-02-19", status: "completed", method: "Card" },
  { id: "TXN-006", customer: "David Mutua", amount: 31200, date: "2026-02-19", status: "failed", method: "M-Pesa" },
];

export const kpis = {
  totalRevenue: 6040000,
  totalProfit: 3700000,
  growthPercentage: 18.5,
  totalOrders: 1601,
  averageOrderValue: 3773,
  conversionRate: 6.8,
};

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}
