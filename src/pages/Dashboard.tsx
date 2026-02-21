import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, DollarSign, ShoppingCart, Users, TrendingUp, Activity,
  Menu, X, LogOut, Upload, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/dashboard/KPICard";
import { RevenueChart, WeeklySalesChart } from "@/components/dashboard/Charts";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import TopProducts from "@/components/dashboard/TopProducts";
import InsightsCard from "@/components/dashboard/InsightsCard";
import { kpis, formatKES } from "@/lib/demo-data";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">BiasharaIQ</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { icon: Activity, label: "Dashboard", active: true },
              { icon: ShoppingCart, label: "Orders" },
              { icon: Upload, label: "Upload Data" },
              { icon: Users, label: "Customers" },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <Link to="/">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                <Home className="w-4 h-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Welcome back! Here's your business overview.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right mr-3">
              <p className="text-sm font-medium text-foreground">Mama Fua Shop</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              MF
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Revenue"
              value={formatKES(kpis.totalRevenue)}
              change={kpis.growthPercentage}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <KPICard
              title="Total Profit"
              value={formatKES(kpis.totalProfit)}
              change={12.3}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <KPICard
              title="Total Orders"
              value={kpis.totalOrders}
              change={8.7}
              icon={<ShoppingCart className="w-5 h-5" />}
            />
            <KPICard
              title="Conversion Rate"
              value={kpis.conversionRate}
              suffix="%"
              change={2.1}
              icon={<Activity className="w-5 h-5" />}
            />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <RevenueChart />
            <WeeklySalesChart />
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionsTable />
            </div>
            <div className="space-y-6">
              <TopProducts />
              <InsightsCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
