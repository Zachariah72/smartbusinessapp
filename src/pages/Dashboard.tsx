import { DollarSign, ShoppingCart, TrendingUp, Activity } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import { RevenueChart, WeeklySalesChart } from "@/components/dashboard/Charts";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import TopProducts from "@/components/dashboard/TopProducts";
import InsightsCard from "@/components/dashboard/InsightsCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { kpis, formatKES } from "@/lib/demo-data";

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome back! Here's your business overview.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={formatKES(kpis.totalRevenue)} change={kpis.growthPercentage} icon={<DollarSign className="w-5 h-5" />} />
          <KPICard title="Total Profit" value={formatKES(kpis.totalProfit)} change={12.3} icon={<TrendingUp className="w-5 h-5" />} />
          <KPICard title="Total Orders" value={kpis.totalOrders} change={8.7} icon={<ShoppingCart className="w-5 h-5" />} />
          <KPICard title="Conversion Rate" value={kpis.conversionRate} suffix="%" change={2.1} icon={<Activity className="w-5 h-5" />} />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <RevenueChart />
          <WeeklySalesChart />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><TransactionsTable /></div>
          <div className="space-y-6">
            <TopProducts />
            <InsightsCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
